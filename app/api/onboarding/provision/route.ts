import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { prospectId, setupData } = await request.json();
    const adminSupabase = createAdminClient();

    // 1. Fetch prospect
    const { data: prospect, error: prospectError } = await adminSupabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (prospectError || !prospect) {
      return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 404 });
    }

    if (prospect.status !== 'converted') {
      return NextResponse.json({ success: false, error: 'Prospect must be in converted state' }, { status: 400 });
    }

    // 2. Generate slug and create tenant
    const slug = prospect.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Check if slug exists
    const { data: existingTenant } = await adminSupabase.from('tenants').select('id').eq('slug', slug).single();
    const finalSlug = existingTenant ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

    const { data: tenant, error: tenantError } = await adminSupabase
      .from('tenants')
      .insert([{
        name: prospect.business_name,
        slug: finalSlug,
        settings: {
          is_restaurant: true,
          helcim_account_id: setupData.helcimAccountId,
          helcim_api_token: setupData.helcimApiToken,
          accounting_software: setupData.accountingSoftware,
          provisioned_from_prospect: prospect.id
        }
      }])
      .select()
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ success: false, error: 'Failed to create tenant record: ' + (tenantError?.message || '') }, { status: 500 });
    }

    // 3. Create Admin User using Supabase Auth Admin
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.inviteUserByEmail(
      prospect.contact_email,
      { data: { name: prospect.contact_name } }
    );

    if (authError && authError.message !== 'User already registered') {
      console.error('Auth invite error:', authError);
    }

    let userId = authUser?.user?.id;
    if (!userId) {
      const { data: existingUser } = await adminSupabase.auth.admin.listUsers();
      const match = existingUser?.users.find(u => u.email === prospect.contact_email);
      if (match) userId = match.id;
    }

    // 4. Link admin_user to tenant
    if (userId) {
      const { data: existingAdminUser } = await adminSupabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingAdminUser) {
        await adminSupabase.from('admin_users').insert([{
          user_id: userId,
          tenant_id: tenant.id,
          role: 'owner',
          display_name: prospect.contact_name
        }]);
      } else {
        await adminSupabase.from('admin_users').update({
          tenant_id: tenant.id,
          role: 'owner'
        }).eq('user_id', userId);
      }
    }

    // 5. Update prospect to mark as fully provisioned
    await adminSupabase.from('prospect_notes').insert([{
      prospect_id: prospect.id,
      note_text: `Tenant provisioned successfully. Slug: ${tenant.slug}. Accounting synced with: ${setupData.accountingSoftware}`
    }]);

    return NextResponse.json({ success: true, tenantId: tenant.id, slug: tenant.slug });

  } catch (error: any) {
    console.error('Provisioning error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
