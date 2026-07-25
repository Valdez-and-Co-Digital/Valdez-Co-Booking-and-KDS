-- ============================================================
-- SwiftKDS — Initial Schema
-- A Valdez & Co. Product
-- ============================================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- TENANTS
-- Represents each business (salon or food truck)
-- ============================================================
create table public.tenants (
  id                uuid primary key default uuid_generate_v4(),
  slug              text unique not null,
  name              text not null,
  domain            text unique,
  stripe_account_id text,
  settings          jsonb not null default '{
    "is_salon": false,
    "is_foodtruck": false,
    "max_capacity": 10,
    "slot_interval_minutes": 15,
    "currency": "usd",
    "booking_advance_days": 30
  }'::jsonb,
  business_hours    jsonb not null default '{
    "mon": {"open": "09:00", "close": "18:00", "closed": false},
    "tue": {"open": "09:00", "close": "18:00", "closed": false},
    "wed": {"open": "09:00", "close": "18:00", "closed": false},
    "thu": {"open": "09:00", "close": "18:00", "closed": false},
    "fri": {"open": "09:00", "close": "20:00", "closed": false},
    "sat": {"open": "10:00", "close": "16:00", "closed": false},
    "sun": {"open": null, "close": null, "closed": true}
  }'::jsonb,
  -- Geolocation (food trucks)
  latitude          double precision,
  longitude         double precision,
  last_heartbeat    timestamptz,
  -- Branding
  logo_url          text,
  brand_color       text default '#7c3aed',
  -- Metadata
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- ADMIN USERS
-- Links auth.users → tenants with role-based access
-- ============================================================
create table public.admin_users (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  role        text not null default 'staff'
              check (role in ('owner', 'manager', 'staff')),
  display_name text,
  created_at  timestamptz default now(),
  unique (user_id, tenant_id)
);

-- ============================================================
-- SERVICES
-- What a tenant offers (haircut, dish, etc.)
-- ============================================================
create table public.services (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  name              text not null,
  description       text,
  price_cents       integer not null check (price_cents >= 0),
  duration_minutes  integer check (duration_minutes > 0),  -- Salon: sequential sum
  prep_time_minutes integer check (prep_time_minutes >= 0), -- Food: parallel max
  category          text,
  image_url         text,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- ORDERS / APPOINTMENTS (unified table)
-- Used for both salon appointments and food truck orders
-- ============================================================
create table public.orders_appointments (
  id                        uuid primary key default uuid_generate_v4(),
  tenant_id                 uuid not null references public.tenants(id) on delete cascade,
  -- Customer info (denormalized for receipt portability)
  customer_name             text not null,
  customer_email            text not null,
  customer_phone            text,
  -- Scheduling
  slot_start                timestamptz not null,
  slot_end                  timestamptz,
  -- Cart snapshot (immutable at order time)
  cart_items                jsonb not null default '[]'::jsonb,
  -- Example item: {"service_id":"uuid","name":"Haircut","price_cents":2500,"duration_minutes":30,"quantity":1}
  total_cents               integer not null check (total_cents >= 0),
  -- KDS state machine
  status                    text not null default 'pending'
                            check (status in (
                              'pending',    -- Awaiting payment/confirmation
                              'confirmed',  -- Paid & confirmed
                              'in_progress', -- Being prepared / in chair
                              'ready',      -- Ready for pickup / client notified
                              'completed',  -- Done
                              'cancelled',  -- Cancelled by customer or admin
                              'no_show'     -- Customer did not arrive
                            )),
  -- Internal notes
  notes                     text,
  -- Payments
  stripe_payment_intent_id  text unique,
  stripe_transfer_id        text,
  payment_status            text not null default 'unpaid'
                            check (payment_status in ('unpaid', 'paid', 'refunded', 'partially_refunded')),
  -- Quick Charge (Stripe Terminal)
  stripe_terminal_payment_id text,
  -- Timestamps
  ordered_at                timestamptz default now(),
  updated_at                timestamptz default now(),
  completed_at              timestamptz
);

-- ============================================================
-- PUSH SUBSCRIPTIONS (Web Push API)
-- Stores browser push endpoints per admin user
-- ============================================================
create table public.push_subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  endpoint        text not null unique,
  p256dh          text not null,
  auth_key        text not null,
  created_at      timestamptz default now()
);

-- ============================================================
-- COMPOSITE INDEXES (critical for RLS + query performance)
-- ============================================================

-- Tenants
create index idx_tenants_slug               on public.tenants(slug);
create index idx_tenants_domain             on public.tenants(domain) where domain is not null;
create index idx_tenants_heartbeat          on public.tenants(last_heartbeat) where last_heartbeat is not null;

-- Admin users
create index idx_admin_users_user_id        on public.admin_users(user_id);
create index idx_admin_users_tenant_id      on public.admin_users(tenant_id);

-- Services
create index idx_services_tenant_active     on public.services(tenant_id, is_active, sort_order);

-- Orders / Appointments (most critical for scheduler + KDS)
create index idx_orders_tenant_slot         on public.orders_appointments(tenant_id, slot_start);
create index idx_orders_tenant_status       on public.orders_appointments(tenant_id, status);
create index idx_orders_slot_window         on public.orders_appointments(tenant_id, slot_start, slot_end);
create index idx_orders_updated_realtime    on public.orders_appointments(tenant_id, updated_at desc);
create index idx_orders_payment_intent      on public.orders_appointments(stripe_payment_intent_id);

-- Push subscriptions
create index idx_push_subs_tenant           on public.push_subscriptions(tenant_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_tenants_updated
  before update on public.tenants
  for each row execute function public.handle_updated_at();

create trigger on_orders_updated
  before update on public.orders_appointments
  for each row execute function public.handle_updated_at();

create trigger on_services_updated
  before update on public.services
  for each row execute function public.handle_updated_at();

-- ============================================================
-- REALTIME PUBLICATION
-- Enable realtime events on the orders table
-- ============================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.orders_appointments,
    public.tenants;
commit;
