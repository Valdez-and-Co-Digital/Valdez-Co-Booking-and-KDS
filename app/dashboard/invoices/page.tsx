import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import InvoicesClientPage from './InvoicesClientPage';
import { getAgencyBillingDefaults } from '@/app/actions/billing';

export default async function InvoicesPage() {
  const supabase = await createServerClient();
  const adminSupabase = createAdminClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('tenant_id')
    .eq('user_id', session.user.id)
    .single();

  const tenantId = adminUser?.tenant_id;
  if (!tenantId) return <div className="p-8 text-zinc-400 text-center">No tenant found.</div>;

  const [{ data: invoices }, { data: clients }] = await Promise.all([
    adminSupabase
      .from('agency_invoices')
      .select('*, client:agency_clients(name, business_name, email)')
      .eq('agency_tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('agency_clients')
      .select('id, name, business_name, email, service_tier, custom_price_cents, status')
      .eq('agency_tenant_id', tenantId)
      .order('business_name'),
  ]);

    const defaultPrices = await getAgencyBillingDefaults();

  return (
    <InvoicesClientPage
      initialInvoices={invoices || []}
      clients={clients || []}
      defaultPrices={defaultPrices}
    />
  );
}
