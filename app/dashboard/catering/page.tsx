import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CateringForm } from '@/components/catering/CateringForm';

export default async function CateringPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant_id')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser) {
    return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  }

  // Fetch all active services for this tenant — restaurant sets up catering
  // packages directly in Menu Manager under a "Catering" category (or any category)
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, price_cents, category, duration_minutes, prep_time_minutes')
    .eq('tenant_id', adminUser.tenant_id)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  return (
    <CateringForm
      tenantId={adminUser.tenant_id}
      services={services || []}
    />
  );
}
