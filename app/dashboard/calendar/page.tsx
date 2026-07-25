import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CalendarView } from '@/components/calendar/CalendarView';

export default async function CalendarPage() {
  const supabase = await createServerClient();
  const adminSupabase = createAdminClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('tenant:tenants(id, name, settings)')
    .eq('user_id', session.user.id)
    .single();

  const tenant = adminUser?.tenant as any;
  if (!tenant) {
    return <div className="p-8 text-center text-zinc-400">Loading your business profile...</div>;
  }

  return (
    <div className="h-[calc(100vh-5rem)]">
      <CalendarView tenantId={tenant.id} businessHours={tenant.settings?.business_hours} />
    </div>
  );
}
