-- ============================================================
-- SwiftKDS — Row Level Security Policies
-- A Valdez & Co. Product
-- ============================================================

-- ============================================================
-- STEP 1: Custom Access Token Hook
-- Automatically injects tenant_id + role into every JWT
-- at token issuance time — zero per-query DB lookups in policies.
--
-- REQUIRED SETUP:
--   Supabase Dashboard → Authentication → Hooks
--   → Custom Access Token → Select function: public.custom_access_token_hook
-- ============================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql security definer as $$
declare
  claims        jsonb;
  v_tenant_id   uuid;
  v_role        text;
begin
  select au.tenant_id, au.role
    into v_tenant_id, v_role
    from public.admin_users au
    where au.user_id = (event->>'user_id')::uuid
    order by au.created_at asc
    limit 1;

  claims := event->'claims';

  if v_tenant_id is not null then
    claims := jsonb_set(claims, '{app_metadata,tenant_id}', to_jsonb(v_tenant_id::text));
    claims := jsonb_set(claims, '{app_metadata,role}',      to_jsonb(coalesce(v_role, 'staff')));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Grant ONLY supabase_auth_admin can execute this hook
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ============================================================
-- STEP 2: JWT Helper Functions
-- Called inside RLS policies — reads from the already-issued JWT
-- ============================================================
create or replace function auth.tenant_id()
returns uuid language sql stable security definer as $$
  select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;

create or replace function auth.user_role()
returns text language sql stable security definer as $$
  select (auth.jwt() -> 'app_metadata' ->> 'role')::text;
$$;

-- ============================================================
-- RLS: TENANTS
-- Public read (needed for slug/domain resolution on booking page)
-- Admins can only update their own tenant
-- ============================================================
alter table public.tenants enable row level security;

create policy "Public can view tenants"
  on public.tenants for select
  to anon, authenticated
  using (true);

create policy "Admins can update their own tenant"
  on public.tenants for update
  to authenticated
  using (id = auth.tenant_id())
  with check (id = auth.tenant_id());

-- ============================================================
-- RLS: ADMIN_USERS
-- Only authenticated admins can see members of their own tenant
-- Only owners can manage (insert/update/delete) admin users
-- ============================================================
alter table public.admin_users enable row level security;

create policy "Admins can view their tenant members"
  on public.admin_users for select
  to authenticated
  using (tenant_id = auth.tenant_id());

create policy "Owners can insert admin users"
  on public.admin_users for insert
  to authenticated
  with check (tenant_id = auth.tenant_id() and auth.user_role() = 'owner');

create policy "Owners can update admin users"
  on public.admin_users for update
  to authenticated
  using (tenant_id = auth.tenant_id() and auth.user_role() = 'owner');

create policy "Owners can delete admin users"
  on public.admin_users for delete
  to authenticated
  using (tenant_id = auth.tenant_id() and auth.user_role() = 'owner');

-- ============================================================
-- RLS: SERVICES
-- Public (anon) can read active services for booking widget
-- Admins (authenticated) can CRUD their own tenant's services
-- ============================================================
alter table public.services enable row level security;

create policy "Public can view active services"
  on public.services for select
  to anon
  using (is_active = true);

create policy "Admins can view all their services"
  on public.services for select
  to authenticated
  using (tenant_id = auth.tenant_id());

create policy "Admins can create services"
  on public.services for insert
  to authenticated
  with check (tenant_id = auth.tenant_id());

create policy "Admins can update services"
  on public.services for update
  to authenticated
  using (tenant_id = auth.tenant_id())
  with check (tenant_id = auth.tenant_id());

create policy "Admins can delete services"
  on public.services for delete
  to authenticated
  using (tenant_id = auth.tenant_id());

-- ============================================================
-- RLS: ORDERS_APPOINTMENTS
-- Anonymous users can INSERT (booking widget) — validated server-side
-- Admins can SELECT/UPDATE only their tenant's orders
-- No direct DELETE — use status='cancelled' instead
-- ============================================================
alter table public.orders_appointments enable row level security;

create policy "Anyone can create an order"
  on public.orders_appointments for insert
  to anon, authenticated
  with check (true); -- Server-side API route validates tenant_id before insert

create policy "Admins can view their tenant's orders"
  on public.orders_appointments for select
  to authenticated
  using (tenant_id = auth.tenant_id());

create policy "Admins can update their tenant's orders"
  on public.orders_appointments for update
  to authenticated
  using (tenant_id = auth.tenant_id())
  with check (tenant_id = auth.tenant_id());

-- ============================================================
-- RLS: PUSH_SUBSCRIPTIONS
-- Users can manage only their own push subscriptions
-- ============================================================
alter table public.push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view tenant push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (tenant_id = auth.tenant_id());
