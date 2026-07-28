import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ImpersonationProvider } from '@/providers/ImpersonationProvider';

export default async function GodModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

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

  return (
    <ImpersonationProvider>
      {children}
    </ImpersonationProvider>
  );
}
