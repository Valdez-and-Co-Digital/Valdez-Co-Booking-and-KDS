'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function completeOnboardingAction(formData: FormData) {
  const currency = formData.get('currency') as string;
  const taxRateStr = formData.get('taxRate') as string;

  if (!currency || !taxRateStr) {
    return { error: 'Please provide both currency and tax rate.' };
  }

  const taxRate = parseFloat(taxRateStr);
  if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    return { error: 'Invalid tax rate.' };
  }

  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated.' };
  }

  // 1. Fetch user's tenant ID and current settings
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant_id, tenant:tenants(settings)')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser || !adminUser.tenant) {
    return { error: 'Business profile not found.' };
  }

  const currentSettings = adminUser.tenant.settings as any;
  const updatedSettings = {
    ...currentSettings,
    currency: currency,
    tax_rate: taxRate
  };

  // 2. Update the tenant settings
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ settings: updatedSettings })
    .eq('id', adminUser.tenant_id);

  if (updateError) {
    console.error('Failed to update tenant settings:', updateError);
    return { error: 'Failed to save business settings.' };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
