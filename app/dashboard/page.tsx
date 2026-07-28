import { cookies } from 'next/headers';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KDSBoard } from '@/components/kds/KDSBoard';
import { CalendarView } from '@/components/calendar/CalendarView';
import AgencyOverview from '@/components/admin/AgencyOverview';

export default async function DashboardOverviewPage() {
  const supabase = await createServerClient();
  const adminSupabase = createAdminClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Check if we are impersonating
  const cookieStore = await cookies();
  const impersonatedTenantId = cookieStore.get('swiftkds_impersonated_tenant')?.value;

  let tenant: any = null;

  if (impersonatedTenantId) {
    // If impersonating, load that tenant specifically
    const { data: impersonatedTenant } = await adminSupabase
      .from('tenants')
      .select('id, name, settings, business_hours')
      .eq('id', impersonatedTenantId)
      .single();
    
    tenant = impersonatedTenant;
  } else {
    // Fetch user's normal tenant connection
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('tenant:tenants(id, name, settings, business_hours)')
      .eq('user_id', session.user.id)
      .single();

    tenant = adminUser?.tenant;
  }

  if (!tenant) {
    return <div className="p-8 text-center text-zinc-400">Loading your business profile...</div>;
  }

  // If the user doesn't belong to a specific restaurant/salon, they are the agency admin.
  // The AgencyOverview is the new God Mode.
  const isAgency = !tenant.settings?.is_foodtruck && !tenant.settings?.is_restaurant && !tenant.settings?.is_salon;

  return (
    <div className={isAgency ? "" : "h-[calc(100vh-5rem)]"}>
      {tenant.settings?.is_foodtruck || tenant.settings?.is_restaurant ? (
        <KDSBoard tenantId={tenant.id} />
      ) : isAgency ? (
        <AgencyOverview />
      ) : (
        <CalendarView tenantId={tenant.id} businessHours={tenant.business_hours} />
      )}
    </div>
  );
}
