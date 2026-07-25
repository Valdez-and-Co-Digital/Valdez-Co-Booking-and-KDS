-- ============================================================
-- SwiftKDS — Digital Services / Agency Schema Extensions
-- A Valdez & Co. Product
-- ============================================================

-- ============================================================
-- CLIENTS (CRM)
-- Represents long-term customers for digital services
-- ============================================================
create table public.clients (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  name              text not null,
  email             text,
  phone             text,
  company_name      text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- INVOICES
-- High-ticket billing for website builds, retainers, etc.
-- ============================================================
create table public.invoices (
  id                        uuid primary key default uuid_generate_v4(),
  tenant_id                 uuid not null references public.tenants(id) on delete cascade,
  client_id                 uuid not null references public.clients(id) on delete cascade,
  amount_cents              integer not null check (amount_cents >= 0),
  description               text not null,
  status                    text not null default 'draft'
                            check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date                  timestamptz,
  stripe_payment_link_url   text,
  stripe_invoice_id         text,
  notes                     text,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now(),
  paid_at                   timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_clients_tenant on public.clients(tenant_id);
create index idx_invoices_tenant on public.invoices(tenant_id);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create trigger on_clients_updated
  before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger on_invoices_updated
  before update on public.invoices
  for each row execute function public.handle_updated_at();

-- ============================================================
-- RLS POLICIES
-- Admins can CRUD their own tenant's clients and invoices
-- ============================================================
alter table public.clients enable row level security;
alter table public.invoices enable row level security;

-- Clients Policies
create policy "Admins can view their clients"
  on public.clients for select
  to authenticated
  using (tenant_id = auth.tenant_id());

create policy "Admins can insert clients"
  on public.clients for insert
  to authenticated
  with check (tenant_id = auth.tenant_id());

create policy "Admins can update their clients"
  on public.clients for update
  to authenticated
  using (tenant_id = auth.tenant_id())
  with check (tenant_id = auth.tenant_id());

create policy "Admins can delete their clients"
  on public.clients for delete
  to authenticated
  using (tenant_id = auth.tenant_id());

-- Invoices Policies
create policy "Admins can view their invoices"
  on public.invoices for select
  to authenticated
  using (tenant_id = auth.tenant_id());

create policy "Admins can insert invoices"
  on public.invoices for insert
  to authenticated
  with check (tenant_id = auth.tenant_id());

create policy "Admins can update their invoices"
  on public.invoices for update
  to authenticated
  using (tenant_id = auth.tenant_id())
  with check (tenant_id = auth.tenant_id());

create policy "Admins can delete their invoices"
  on public.invoices for delete
  to authenticated
  using (tenant_id = auth.tenant_id());
