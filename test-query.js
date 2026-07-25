const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function run() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    if (line.includes('=')) {
      const parts = line.split('=');
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });

  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  const supabase = createClient(url, key);

  // Take the most recently created user
  const { data: adminUsers } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false }).limit(1);
  const user = adminUsers[0];

  console.log('Testing single with join...');
  const { data, error } = await supabase
    .from('admin_users')
    .select('tenant_id, tenant:tenants(settings)')
    .eq('user_id', user.user_id)
    .single();

  console.log(JSON.stringify({ data, error }, null, 2));
}
run();
