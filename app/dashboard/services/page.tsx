import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Zap, Plus, Settings } from 'lucide-react';
import { ServiceList } from './ServiceList';

export default async function ServicesPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // 1. Fetch user's tenant connection and settings
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant:tenants(id, name, settings)')
    .eq('user_id', session.user.id)
    .single();

  const tenant = adminUser?.tenant as any;
  if (!tenant) {
    return <div className="p-8 text-center text-zinc-400">Loading your business profile...</div>;
  }

  const isSalon = tenant.settings?.is_salon;

  // 2. Fetch services for this tenant
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  const safeServices = services || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            <Settings className="w-6 h-6 text-violet-400" />
            {isSalon ? 'Service Manager' : 'Menu Manager'}
          </h1>
          <p className="text-sm text-zinc-400">
            Create and manage your offerings and pricing.
          </p>
        </div>
      </div>

      <ServiceList initialServices={safeServices} isSalon={isSalon} />
    </div>
  );
}
