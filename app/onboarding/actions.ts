'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function completeOnboardingAction(formData: FormData) {
  const businessName = formData.get('businessName') as string;
  const businessType = formData.get('businessType') as string;
  const experienceLevel = formData.get('experienceLevel') as string;
  const selectedPackage = formData.get('selectedPackage') as string;
  const referralCode = formData.get('referralCode') as string;
  
  if (!businessName || !businessType || !experienceLevel || !selectedPackage) {
    return { error: 'Please complete all steps.' };
  }

  const supabase = await createServerClient();
  const adminSupabase = createAdminClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated.' };
  }

  // Generate a URL-friendly unique slug from the business name
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

  const tenantId = crypto.randomUUID();

  // Create Tenant
  const { error: tenantError } = await adminSupabase
    .from('tenants')
    .insert({
      id: tenantId,
      name: businessName,
      slug: slug,
      referral_code: referralCode ? referralCode.toUpperCase() : null,
      settings: {
        is_salon: businessType === 'salon',
        is_restaurant: businessType === 'restaurant',
        is_foodtruck: businessType === 'foodtruck',
        is_retail: businessType === 'retail',
        experience_level: experienceLevel,
        selected_package: selectedPackage,
        // Default currency and tax rate can be configured later or set to defaults
        currency: 'usd',
        tax_rate: 0.00
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
      user_id: session.user.id,
      tenant_id: tenantId,
      role: 'owner',
      display_name: session.user.email?.split('@')[0] || 'Admin',
    });

  if (adminError) {
    console.error('Admin link creation failed:', adminError);
    return { error: 'Account created, but failed to link to business.' };
  }

  // Force a JWT refresh so the custom Auth Hook sees the new admin_users record
  // and stamps the tenant_id onto the user's token immediately.
  await supabase.auth.refreshSession();

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

