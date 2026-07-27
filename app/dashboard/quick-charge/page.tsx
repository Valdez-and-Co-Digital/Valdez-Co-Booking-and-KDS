import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QuickCharge } from '@/components/payments/QuickCharge';

export default async function QuickChargePage() {
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

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', adminUser.tenant_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const safeServices = services || [];

  return (
    <div className="py-6">
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold">Point of Sale</h1>
        <p className="text-sm text-zinc-400">Select items or quick charge an amount</p>
      </div>
      <QuickCharge tenantId={adminUser.tenant_id} initialServices={safeServices} />
    </div>
  );
}
