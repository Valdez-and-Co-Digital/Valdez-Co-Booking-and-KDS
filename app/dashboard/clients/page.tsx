import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientsClientPage from './ClientsClientPage';

import { getAgencyBillingDefaults } from '@/app/actions/billing';
// Re-export existing salon/restaurant clients page for non-agency tenants
import SalonClientsPage from './SalonClientsPage';

export default async function ClientsPage() {
  const supabase = await createServerClient();
  const adminSupabase = createAdminClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Check impersonation cookie
  const cookieStore = await cookies();
  const impersonatedTenantId = cookieStore.get('swiftkds_impersonated_tenant')?.value;

  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('tenant_id, tenant:tenants(settings)')
    .eq('user_id', session.user.id)
    .single();

  let tenantId = adminUser?.tenant_id;
  let settings = (adminUser?.tenant as any)?.settings;

  if (impersonatedTenantId) {
    const { data: impersonatedTenant } = await adminSupabase
      .from('tenants')
      .select('id, settings')
      .eq('id', impersonatedTenantId)
      .single();
    if (impersonatedTenant) {
      tenantId = impersonatedTenant.id;
      settings = impersonatedTenant.settings;
    }
  }

  const isAgency = !settings?.is_foodtruck && !settings?.is_restaurant && !settings?.is_salon;

  if (isAgency && !impersonatedTenantId) {
    // Show the agency billing clients page
    const { data: agencyClients } = await adminSupabase
      .from('agency_clients')
      .select('*')
      .eq('agency_tenant_id', tenantId!)
      .order('created_at', { ascending: false });

    const defaultPrices = await getAgencyBillingDefaults();

    return <ClientsClientPage initialClients={agencyClients || []} defaultPrices={defaultPrices} />;
  }

  // Non-agency: render the existing salon/restaurant clients component
  return <SalonClientsPage />;
}
