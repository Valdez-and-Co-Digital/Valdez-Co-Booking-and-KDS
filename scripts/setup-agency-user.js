const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🚀 Setting up Agency Admin User...');

  // 1. Fetch the valdez-co tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', 'valdez-co')
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Could not find "valdez-co" tenant. Ensure you ran the SQL schema to create it.');
    process.exit(1);
  }
  console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

  // 2. Create Auth User
  const email = 'admin@valdez.co';
  const password = 'Password123!';

  console.log(`⏳ Creating user: ${email}...`);
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId;

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log(`⚠️ User ${email} already exists. Fetching...`);
      const { data: usersData } = await supabase.auth.admin.listUsers();
      userId = usersData.users.find((u) => u.email === email)?.id;
    } else {
      console.error('❌ Failed to create user:', authError.message);
      process.exit(1);
    }
  } else {
    userId = authUser.user.id;
    console.log(`✅ Created user ${email} (${userId})`);
  }

  // 3. Link user to tenant in admin_users
  console.log(`⏳ Linking user to tenant...`);
  const { error: linkError } = await supabase
    .from('admin_users')
    .upsert(
      {
        user_id: userId,
        tenant_id: tenant.id,
        role: 'owner',
        display_name: 'Agency Admin',
      },
      { onConflict: 'user_id' }
    );

  if (linkError) {
    console.error('❌ Failed to link user:', linkError.message);
    process.exit(1);
  }

  console.log(`✅ User successfully linked to ${tenant.name} as Owner!`);
  console.log('\n=============================================');
  console.log('🎉 SUCCESS! You can now log in locally.');
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('=============================================\n');
}

main();
