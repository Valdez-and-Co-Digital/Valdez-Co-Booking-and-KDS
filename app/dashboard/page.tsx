import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KDSBoard } from '@/components/kds/KDSBoard';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LayoutDashboard } from 'lucide-react';

function AgencyOverview() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 p-8 space-y-4">
      <LayoutDashboard className="w-12 h-12 text-violet-400/50" />
      <div>
        <h2 className="text-xl font-display font-semibold text-zinc-200">Agency Dashboard</h2>
        <p className="mt-2 text-sm max-w-sm mx-auto">
          Welcome to your web design agency overview. Use the sidebar to manage your clients and track high-ticket invoices.
        </p>
      </div>
    </div>
  );
}

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

  return (
    <div className="h-[calc(100vh-5rem)]">
      {tenant.settings?.is_foodtruck ? (
        <KDSBoard tenantId={tenant.id} />
      ) : tenant.settings?.is_agency ? (
        <AgencyOverview />
      ) : (
        <CalendarView tenantId={tenant.id} businessHours={tenant.business_hours} />
      )}
    </div>
  );
}
