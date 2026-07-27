'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createServiceAction(formData: FormData) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated.' };

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant_id')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser) return { error: 'Tenant not found.' };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const isSalon = formData.get('isSalon') === 'true';
  const timeValue = parseInt(formData.get('timeValue') as string);

  if (!name || isNaN(price) || isNaN(timeValue)) {
    return { error: 'Please provide all required fields.' };
  }

  const { error } = await supabase.from('services').insert({
    tenant_id: adminUser.tenant_id,
    name,
    description,
    price_cents: Math.round(price * 100),
    duration_minutes: isSalon ? timeValue : null,
    prep_time_minutes: !isSalon ? timeValue : null,
    is_active: true
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard/services');
  return { success: true };
}

export async function deleteServiceAction(serviceId: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/services');
  return { success: true };
}

export async function toggleServiceAction(serviceId: string, currentStatus: boolean) {
  const supabase = await createServerClient();
  const { error } = await supabase.from('services').update({ is_active: !currentStatus }).eq('id', serviceId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/services');
  return { success: true };
}

export async function updateServiceAction(serviceId: string, formData: FormData) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated.' };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const isSalon = formData.get('isSalon') === 'true';
  const timeValue = parseInt(formData.get('timeValue') as string);

  if (!name || isNaN(price) || isNaN(timeValue)) {
    return { error: 'Please provide all required fields.' };
  }

  const { error } = await supabase.from('services').update({
    name,
    description,
    price_cents: Math.round(price * 100),
    duration_minutes: isSalon ? timeValue : null,
    prep_time_minutes: !isSalon ? timeValue : null,
  }).eq('id', serviceId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/services');
  return { success: true };
}
