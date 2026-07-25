import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KDSBoard } from '@/components/kds/KDSBoard';
import { Calendar, LayoutDashboard } from 'lucide-react';

export default async function DashboardOverviewPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // 1. Fetch user's tenant connection
  const { data: adminUser } = await supabase
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

  // Phase 1: Salon Calendar Placeholder
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 flex-shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-violet-400" />
            Command Center
          </h1>
          <p className="text-sm text-zinc-400">
            {tenant.name}
          </p>
        </div>
      </div>

      <div className="flex-1 glass-card p-8 flex flex-col items-center justify-center border-dashed border-2 border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-violet-400" />
        </div>
        <h2 className="font-display text-xl font-semibold mb-2">Calendar View Coming Soon</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          Your salon calendar is being wired up to the database. Soon you'll be able to see all your appointments right here.
        </p>
      </div>
    </div>
  );
}
