-- ============================================================
-- SwiftKDS — Custom Domain Support
-- Enables tenants to use their own domains (e.g., bookings.salon.com)
-- ============================================================

-- Add Vercel-compatible custom domain fields
-- Vercel API handles DNS verification; we track the state here.
create table public.custom_domains (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  domain          text not null unique,
  -- Vercel domain verification
  vercel_domain_id text,
  verified        boolean not null default false,
  verification_token text,
  -- Status
  status          text not null default 'pending'
                  check (status in ('pending', 'verifying', 'active', 'error')),
  error_message   text,
  created_at      timestamptz default now(),
  verified_at     timestamptz
);

create index idx_custom_domains_domain    on public.custom_domains(domain);
create index idx_custom_domains_tenant    on public.custom_domains(tenant_id);
create index idx_custom_domains_active    on public.custom_domains(domain) where verified = true;

-- RLS
alter table public.custom_domains enable row level security;

create policy "Admins can manage their domains"
  on public.custom_domains for all
  to authenticated
  using (tenant_id = auth.tenant_id());

-- Function: resolve tenant from custom domain (used in middleware/layout)
create or replace function public.get_tenant_by_domain(p_domain text)
returns setof public.tenants
language sql stable as $$
  select t.* from public.tenants t
  join public.custom_domains cd on cd.tenant_id = t.id
  where cd.domain = p_domain and cd.verified = true
  limit 1;
$$;

-- Also support wildcard subdomain via tenants.slug directly
-- This view provides a fast lookup for both patterns
create or replace view public.tenant_routing as
  select
    t.id,
    t.slug,
    t.name,
    t.settings,
    t.business_hours,
    t.stripe_account_id,
    t.brand_color,
    t.logo_url,
    t.slug as resolved_via,
    null::text as domain
  from public.tenants t
  union all
  select
    t.id,
    t.slug,
    t.name,
    t.settings,
    t.business_hours,
    t.stripe_account_id,
    t.brand_color,
    t.logo_url,
    'custom_domain' as resolved_via,
    cd.domain
  from public.tenants t
  join public.custom_domains cd on cd.tenant_id = t.id
  where cd.verified = true;
