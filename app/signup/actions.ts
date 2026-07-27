'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const businessName = formData.get('businessName') as string;
  const businessType = formData.get('businessType') as string;
  
  if (!email || !password || !businessName || !businessType) {
    return { error: 'All fields are required.' };
  }

  // Generate a URL-friendly unique slug from the business name
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

  const supabase = await createServerClient();
  const adminSupabase = createAdminClient();

  // 1. Sign up the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: 'Failed to create user.' };
  }

  // 2. Bypass RLS to create the Tenant and AdminUser link
  const tenantId = crypto.randomUUID();

  // Create Tenant
  const { error: tenantError } = await adminSupabase
    .from('tenants')
    .insert({
      id: tenantId,
      name: businessName,
      slug: slug,
      settings: {
        is_salon: businessType === 'salon',
        is_foodtruck: businessType === 'foodtruck',
        is_agency: businessType === 'agency',
      },
    });

  if (tenantError) {
    console.error('Tenant creation failed:', tenantError);
    return { error: `Workspace setup failed: ${tenantError.message}` };
  }

  // Create Admin User link
  const { error: adminError } = await adminSupabase
    .from('admin_users')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      role: 'owner',
      display_name: email.split('@')[0],
    });

  if (adminError) {
    console.error('Admin link creation failed:', adminError);
    return { error: 'Account created, but failed to link to business.' };
  }

  // Force a JWT refresh so the custom Auth Hook sees the new admin_users record
  // and stamps the tenant_id onto the user's token immediately.
  await supabase.auth.refreshSession();

  revalidatePath('/onboarding');
  redirect('/onboarding');
}
