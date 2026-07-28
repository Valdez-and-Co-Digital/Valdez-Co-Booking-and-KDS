'use client';

import { LogOut } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const supabase = createBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <button onClick={handleSignOut} className="flex items-center gap-4 px-3 py-3 w-full rounded-lg hover:bg-white/5 text-red-500/80 hover:text-red-400 transition-colors whitespace-nowrap group/item">
      <LogOut className="w-5 h-5 shrink-0" />
      <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity">Sign Out</span>
    </button>
  );
}
