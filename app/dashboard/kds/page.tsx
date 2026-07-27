import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KDSBoard } from '@/components/kds/KDSBoard';

export default async function KDSPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant_id, tenants(settings)')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser) {
    return <div className="p-8 text-center text-zinc-400">Loading your profile...</div>;
  }

  const settings = (adminUser as any).tenants?.settings || {};

  return (
    <div className="h-[calc(100vh-5rem)]">
      <KDSBoard
        tenantId={adminUser.tenant_id}
        requireConfirmation={!!settings.require_order_confirmation}
      />
    </div>
  );
}
