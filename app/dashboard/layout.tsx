'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Zap, Users, LogOut, FileText, Calendar,
  Settings, UtensilsCrossed, UserCircle2, Bell
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { initAudio } from '@/hooks/useOrdersRealtime';
import { useImpersonation } from '@/providers/ImpersonationProvider';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const { impersonatedTenantId, setImpersonatedTenantId } = useImpersonation();
  const [tenantType, setTenantType] = useState<'salon' | 'foodtruck' | 'agency' | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [tenantSettings, setTenantSettings] = useState<any>(null);

  // ── Full nav items (sidebar, desktop) ──────────────────────────────
  let navItems: { href: string; icon: React.ElementType; label: string; shortLabel: string }[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Command Center', shortLabel: 'Home' },
  ];

  if (tenantType === 'salon') {
    navItems = [
      { href: '/dashboard',          icon: LayoutDashboard, label: 'Salon Overview',         shortLabel: 'Home' },
      { href: '/dashboard/calendar', icon: Calendar,         label: 'Appointments & Calendar', shortLabel: 'Calendar' },
      { href: '/dashboard/services', icon: Zap,              label: 'Service Menu',           shortLabel: 'Menu' },
      { href: '/dashboard/clients',  icon: Users,            label: 'Customer Log',           shortLabel: 'Clients' },
      { href: '/dashboard/settings', icon: Settings,         label: 'Settings',               shortLabel: 'Settings' },
    ];
  } else if (tenantType === 'foodtruck') {
    navItems = [
      { href: '/dashboard',          icon: LayoutDashboard, label: 'Kitchen Display',  shortLabel: 'KDS' },
      { href: '/dashboard/history',  icon: FileText,        label: 'Order History',    shortLabel: 'History' },
      { href: '/dashboard/services', icon: Zap,             label: 'Menu Manager',     shortLabel: 'Menu' },
      { href: '/dashboard/clients',  icon: Users,           label: 'Customer Log',     shortLabel: 'Clients' },
      { href: '/dashboard/settings', icon: Settings,        label: 'Settings',         shortLabel: 'Settings' },
    ];
    if (tenantSettings?.enable_reservations) {
      navItems.splice(1, 0, { href: '/dashboard/calendar', icon: Calendar, label: 'Reservations', shortLabel: 'Reservations' });
    }
    if (tenantSettings?.enable_catering) {
      navItems.splice(2, 0, { href: '/dashboard/catering', icon: UtensilsCrossed, label: 'Catering', shortLabel: 'Catering' });
    }
  } else if (tenantType === 'agency') {
    navItems = [
      { href: '/dashboard',           icon: LayoutDashboard, label: 'Agency Overview',    shortLabel: 'Home' },
      { href: '/dashboard/clients',   icon: Users,           label: 'Clients',             shortLabel: 'Clients' },
      { href: '/dashboard/invoices',  icon: FileText,        label: 'Invoices & Billing',  shortLabel: 'Invoices' },
      { href: '/dashboard/settings',  icon: Settings,        label: 'Settings',            shortLabel: 'Settings' },
    ];
  }

  // ── Bottom nav: take up to 4 primary items + always show Profile ──
  // We pick the first 4 navItems then tack on a profile slot
  const bottomNavItems = navItems.slice(0, 4);
  const profileItem = { href: '/dashboard/settings', icon: UserCircle2, shortLabel: 'Profile' };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
      if (!session) return;
      supabase
        .from('admin_users')
        .select('is_super_admin, tenants!admin_users_tenant_id_fkey(name, settings)')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }: any) => {
          if (data?.is_super_admin && !impersonatedTenantId) {
            window.location.href = '/admin/valdez';
            return;
          }
          
          if (impersonatedTenantId) {
            supabase.from('tenants').select('name, settings').eq('id', impersonatedTenantId).single().then(({ data: t }: any) => {
              if (t) {
                setTenantName(t.name);
                setTenantSettings(t.settings);
                if (t.settings?.is_foodtruck) setTenantType('foodtruck');
                else if (t.settings?.is_salon) setTenantType('salon');
                else setTenantType('agency');
              }
            });
          } else {
            const t = data?.tenants;
            if (t) {
              setTenantName(t.name);
              setTenantSettings(t.settings);
              if (t.settings?.is_foodtruck) setTenantType('foodtruck');
              else if (t.settings?.is_salon) setTenantType('salon');
              else setTenantType('agency');
            }
          }
        });
    });
  }, [supabase, impersonatedTenantId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ── Desktop sidebar content ────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm gradient-text">SwiftKDS</p>
            <p className="text-xs text-zinc-500 truncate max-w-[140px]">{tenantName || 'Loading...'}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => initAudio()}
            className={`nav-item ${pathname === href ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button className="nav-item w-full text-left">
          <Bell className="w-4 h-4" />
          Notifications
        </button>
        <button onClick={handleSignOut} className="nav-item w-full text-left text-red-500/70 hover:text-red-400">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Branding */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="powered-by text-[10px]">
          Powered by <a href="https://swiftkds.com" target="_blank" rel="noopener noreferrer">SwiftKDS</a>,
          a Valdez &amp; Co. product
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex flex-col w-56 glass-card rounded-none border-y-0 border-l-0 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar: just the logo/title */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 glass-card rounded-none border-x-0 border-t-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="font-display font-semibold text-sm gradient-text">SwiftKDS</span>
          </div>
          <span className="text-xs text-zinc-500 truncate max-w-[140px]">{tenantName}</span>
        </header>

        {/* Page content — pb-20 on mobile to clear the bottom nav */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6"
          onClick={() => initAudio()}
        >
          {impersonatedTenantId && (
            <div className="mb-4 p-3 bg-violet-600/20 border border-violet-500/50 rounded-xl flex items-center justify-between">
              <span className="text-violet-300 text-sm font-medium">
                God Mode Active: Viewing as {tenantName}
              </span>
              <button
                onClick={() => {
                  setImpersonatedTenantId(null);
                  window.location.href = '/admin/valdez';
                }}
                className="text-xs bg-violet-500 hover:bg-violet-600 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Exit
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center px-2 py-2 pb-safe">
          {bottomNavItems.map(({ href, icon: Icon, shortLabel }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => initAudio()}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all active:scale-90"
              >
                <div className={`relative flex items-center justify-center w-10 h-8 rounded-xl transition-all ${
                  isActive
                    ? 'bg-violet-600/20'
                    : ''
                }`}>
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-violet-400' : 'text-zinc-500'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {/* Active dot indicator */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-violet-400' : 'text-zinc-500'
                }`}>
                  {shortLabel}
                </span>
              </Link>
            );
          })}

          {/* Profile / Sign-out slot */}
          <Link
            href={profileItem.href}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all active:scale-90"
          >
            <div className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all ${
              pathname === profileItem.href && !bottomNavItems.find(i => i.href === profileItem.href)
                ? 'bg-violet-600/20'
                : ''
            }`}>
              <UserCircle2
                className={`w-5 h-5 ${
                  !bottomNavItems.find(i => i.href === profileItem.href) && pathname === profileItem.href
                    ? 'text-violet-400'
                    : 'text-zinc-500'
                }`}
                strokeWidth={1.75}
              />
            </div>
            <span className="text-[10px] font-medium text-zinc-500">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
