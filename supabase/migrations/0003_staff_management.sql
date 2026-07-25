-- ============================================================
-- SwiftKDS — Staff Management Schema
-- Supports both individual and shared calendars per tenant
-- ============================================================

-- STAFF MEMBERS
-- Each admin_user can optionally have a staff profile with their own calendar
create table public.staff_members (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  admin_user_id   uuid references public.admin_users(id) on delete set null,
  name            text not null,
  role_title      text,                -- e.g. "Senior Stylist", "Line Cook"
  avatar_url      text,
  color           text default '#7c3aed', -- Calendar color for this staff member
  is_active       boolean not null default true,
  -- Calendar preference: null = uses tenant shared calendar
  has_own_calendar boolean not null default false,
  -- Working hours (overrides tenant business_hours if set)
  custom_hours    jsonb,
  created_at      timestamptz default now()
);

-- Link services to specific staff members (optional)
-- If no staff is assigned, any available staff member handles the service
create table public.staff_services (
  staff_id    uuid not null references public.staff_members(id) on delete cascade,
  service_id  uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- Add staff_id to orders/appointments (nullable = shared/any staff)
alter table public.orders_appointments
  add column if not exists staff_member_id uuid references public.staff_members(id) on delete set null;

-- Indexes
create index idx_staff_members_tenant     on public.staff_members(tenant_id, is_active);
create index idx_staff_services_staff     on public.staff_services(staff_id);
create index idx_orders_staff_member      on public.orders_appointments(staff_member_id);
create index idx_orders_tenant_staff_slot on public.orders_appointments(tenant_id, staff_member_id, slot_start);

-- ============================================================
-- RLS for Staff
-- ============================================================
alter table public.staff_members enable row level security;

create policy "Public can view active staff"
  on public.staff_members for select
  to anon
  using (is_active = true);

create policy "Admins can manage their staff"
  on public.staff_members for all
  to authenticated
  using (tenant_id = auth.tenant_id());

alter table public.staff_services enable row level security;

create policy "Anyone can view staff services"
  on public.staff_services for select
  using (true);

create policy "Admins can manage staff services"
  on public.staff_services for all
  to authenticated
  using (
    exists (
      select 1 from public.staff_members sm
      where sm.id = staff_id and sm.tenant_id = auth.tenant_id()
    )
  );

-- ============================================================
-- Seed: Add staff to demo salon
-- ============================================================
insert into public.staff_members (tenant_id, name, role_title, color, has_own_calendar)
values
  ('a0000000-0000-0000-0000-000000000001', 'Aria Lopez', 'Senior Stylist', '#7c3aed', true),
  ('a0000000-0000-0000-0000-000000000001', 'James Kim', 'Color Specialist', '#0ea5e9', true),
  ('a0000000-0000-0000-0000-000000000001', 'Sofia Reyes', 'Nail Technician', '#10b981', false);
