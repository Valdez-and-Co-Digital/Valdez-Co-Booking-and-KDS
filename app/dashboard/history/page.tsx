import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrderHistory } from '@/components/history/OrderHistory';

export default async function HistoryPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant_id')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser) {
    return <div className="p-8 text-center text-zinc-400">Loading your profile...</div>;
  }

  // Fetch orders for this tenant that are completed, cancelled, or no_show
  const { data: orders } = await supabase
    .from('orders_appointments')
    .select('*')
    .eq('tenant_id', adminUser.tenant_id)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .order('ordered_at', { ascending: false });

  const safeOrders = orders || [];

  return (
    <div className="py-6">
      <OrderHistory initialOrders={safeOrders} />
    </div>
  );
}
