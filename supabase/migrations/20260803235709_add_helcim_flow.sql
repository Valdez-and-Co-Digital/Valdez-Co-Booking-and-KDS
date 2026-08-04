-- ============================================================
-- SwiftKDS — Helcim Flow & Tier Configs
-- ============================================================

create table if not exists public.tier_configs (
  id text primary key,
  name text not null,
  description text,
  price_cents integer not null
);

insert into public.tier_configs (id, name, description, price_cents) values
  ('digital_foundation', 'Digital Foundation', 'Digital Foundation — Setup', 50000),
  ('connected_ordering', 'Connected Ordering', 'Connected Ordering — Setup', 100000),
  ('complete_kitchen_suite', 'Complete Kitchen Suite', 'Complete Kitchen Suite — Setup', 150000)
on conflict (id) do nothing;

alter table public.invoices 
  add column if not exists checkout_token text,
  add column if not exists helcim_transaction_id text,
  add column if not exists tier_id text references public.tier_configs(id),
  add column if not exists prospect_id uuid; -- We assume prospects table exists with id uuid

-- Relax client_id since invoices can be for prospects
alter table public.invoices alter column client_id drop not null;

-- It's possible prospects table doesn't have a PK named id, but assuming it does based on previous files.
alter table public.prospects add column if not exists converted_invoice_id uuid references public.invoices(id);
