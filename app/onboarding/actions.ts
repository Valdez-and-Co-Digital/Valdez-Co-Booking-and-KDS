'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase/server';
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
  const adminSupabase = createAdminClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated.' };
  }

  // 1. Fetch user's tenant ID and current settings using admin client to bypass RLS delay
  const { data: adminUser } = await adminSupabase
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

  // 2. Update the tenant settings using admin client
  const { error: updateError } = await adminSupabase
    .from('tenants')
    .update({ settings: updatedSettings })
    .eq('id', adminUser.tenant_id);

  if (updateError) {
    console.error('Failed to update tenant settings:', updateError);
    return { error: 'Failed to save business settings.' };
  }

  // Double-check the token is refreshed so the user enters the dashboard with full RLS permissions
  await supabase.auth.refreshSession();

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
