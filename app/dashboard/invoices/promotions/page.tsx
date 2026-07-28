import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PromotionsClientPage from './PromotionsClientPage';

export default async function PromotionsPage() {
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
  if (!tenantId) return null;

  const { data: coupons } = await adminSupabase
    .from('agency_coupons')
    .select('*')
    .eq('agency_tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return <PromotionsClientPage initialCoupons={coupons || []} />;
}
