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

  // Fetch user's tenant connection using admin client to bypass RLS delay
  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('tenant:tenants(id, name, settings, business_hours)')
    .eq('user_id', session.user.id)
    .single();

  const tenant = adminUser?.tenant as any;
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
