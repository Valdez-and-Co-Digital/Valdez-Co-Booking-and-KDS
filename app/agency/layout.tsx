import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { LayoutDashboard, Users, Settings, Zap, Building2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export const metadata = {
  title: 'Agency Dashboard - SwiftKDS',
};

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Check if the user is a super admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('is_super_admin')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser?.is_super_admin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-[#131315] text-[#e5e1e4] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[72px] hover:w-[240px] transition-all duration-300 flex flex-col glass-card border-y-0 border-l-0 rounded-none z-20 group relative">
        <div className="px-4 py-6 border-b border-white/10 flex items-center gap-4 whitespace-nowrap overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold tracking-tight text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Valdez & Co.
          </span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-2 overflow-x-hidden">
          <Link href="/agency" className="flex items-center gap-4 px-3 py-3 rounded-lg bg-white/5 border border-white/10 text-white transition-colors relative whitespace-nowrap group/item">
            <div className="absolute inset-0 rounded-lg bg-[#7c3aed]/20 blur-md -z-10 opacity-50" />
            <Building2 className="w-5 h-5 shrink-0 text-[#d2bbff]" />
            <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity">Tenants</span>
          </Link>
          
          <Link href="/agency/users" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-white/5 text-[#ccc3d8] hover:text-white transition-colors whitespace-nowrap opacity-50 cursor-not-allowed">
            <Users className="w-5 h-5 shrink-0" />
            <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity">Users</span>
          </Link>
          
          <Link href="/agency/settings" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-white/5 text-[#ccc3d8] hover:text-white transition-colors whitespace-nowrap opacity-50 cursor-not-allowed">
            <Settings className="w-5 h-5 shrink-0" />
            <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity">Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
