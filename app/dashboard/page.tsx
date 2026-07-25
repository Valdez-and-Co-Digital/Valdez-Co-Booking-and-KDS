import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KDSBoard } from '@/components/kds/KDSBoard';
import { CalendarView } from '@/components/calendar/CalendarView';

export default async function DashboardOverviewPage() {
  const supabase = await createServerClient();
  const adminSupabase = createAdminClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // 1. Fetch user's tenant connection using admin client to bypass RLS delay
  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('tenant:tenants(id, name, settings)')
    .eq('user_id', session.user.id)
    .single();

  const tenant = adminUser?.tenant as any;
  if (!tenant) {
    return <div className="p-8 text-center text-zinc-400">Loading your business profile...</div>;
  }

  const isFoodTruck = tenant.settings?.is_foodtruck;
  
  if (isFoodTruck) {
    return (
      <div className="h-[calc(100vh-5rem)]">
        <KDSBoard tenantId={tenant.id} />
      </div>
    );
  }

  // Phase 1: Salon Calendar
  return (
    <div className="h-[calc(100vh-5rem)]">
      <CalendarView tenantId={tenant.id} businessHours={tenant.settings?.business_hours} />
    </div>
  );
}
