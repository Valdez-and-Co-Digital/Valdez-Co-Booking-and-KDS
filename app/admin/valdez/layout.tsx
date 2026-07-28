import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function GodModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Double check super admin status on the server
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('is_super_admin')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser?.is_super_admin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
