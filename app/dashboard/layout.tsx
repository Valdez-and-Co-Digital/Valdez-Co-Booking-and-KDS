'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Zap, Users, LogOut, Menu, Bell, FileText, Calendar, Settings, UtensilsCrossed
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { initAudio } from '@/hooks/useOrdersRealtime';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [tenantType, setTenantType] = useState<'salon' | 'foodtruck' | 'agency' | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [tenantSettings, setTenantSettings] = useState<any>(null);

  let navItems = [{ href: '/dashboard', icon: LayoutDashboard, label: 'Command Center' }];
  if (tenantType === 'salon') {
    navItems = [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Salon Overview' },
      { href: '/dashboard/calendar', icon: Calendar, label: 'Appointments & Calendar' },
      { href: '/dashboard/services', icon: Zap, label: 'Service Menu' },
      { href: '/dashboard/clients', icon: Users, label: 'Customer Log' },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];
  } else if (tenantType === 'foodtruck') {
    navItems = [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Kitchen Display' },
      { href: '/dashboard/history', icon: FileText, label: 'Order History' },
      { href: '/dashboard/services', icon: Zap, label: 'Menu Manager' },
      { href: '/dashboard/clients', icon: Users, label: 'Customer Log' },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];
    if (tenantSettings?.enable_reservations) {
      navItems.splice(1, 0, { href: '/dashboard/calendar', icon: Calendar, label: 'Reservations' });
    }
    if (tenantSettings?.enable_catering) {
      navItems.splice(2, 0, { href: '/dashboard/catering', icon: UtensilsCrossed, label: 'Catering' });
    }
  } else if (tenantType === 'agency') {
    navItems = [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Agency Overview' },
      { href: '/dashboard/clients', icon: Users, label: 'Clients' },
      { href: '/dashboard/invoices', icon: FileText, label: 'Invoices & Billing' },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];
  }

  useEffect(() => {
    // Load tenant context
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
      if (!session) return;
      supabase
        .from('admin_users')
        .select('tenants(name, settings)')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }: { data: { tenants: { name: string; settings: Record<string, unknown> } | null } | null }) => {
          const t = data?.tenants;
          if (t) {
            setTenantName(t.name);
            setTenantSettings(t.settings);
            if (t.settings?.is_foodtruck) {
              setTenantType('foodtruck');
            } else if (t.settings?.is_salon) {
              setTenantType('salon');
            } else {
              setTenantType('agency');
            }
          }
        });
    });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const NavContent = () => (
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => {
              setIsMobileOpen(false);
              initAudio(); // Unlock AudioContext on navigation click
            }}
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
          a Valdez & Co. product
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 glass-card rounded-none border-y-0 border-l-0 flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative z-10 flex flex-col w-56 glass-card rounded-none border-y-0 border-l-0 animate-slide-right">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 glass-card rounded-none border-x-0 border-t-0">
          <button
            onClick={() => { setIsMobileOpen(true); initAudio(); }}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="font-display font-semibold text-sm gradient-text">SwiftKDS</span>
          </div>
          <div className="w-9" /> {/* spacer */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
