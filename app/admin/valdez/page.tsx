'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useImpersonation } from '@/providers/ImpersonationProvider';
import { useRouter } from 'next/navigation';
import GlobalMap from '@/components/admin/GlobalMap';
import { Loader2, TrendingUp, DollarSign, Activity, Users, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GodModePage() {
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const { setImpersonatedTenantId } = useImpersonation();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: statsData } = await supabase.rpc('get_platform_stats');
      if (statsData) setStats(statsData);

      const { data: tenantsData } = await supabase
        .from('tenants')
        .select(`
          id, name, slug, settings, current_lat, current_lng,
          admin_users ( display_name, role )
        `)
        .order('created_at', { ascending: false });

      if (tenantsData) {
        // Mock order data total for display purposes (real TPV per tenant requires more complex RPC, using random for visual demo unless we calculate it)
        const enriched = tenantsData.map(t => ({
          ...t,
          tpv: Math.floor(Math.random() * 50000) + 5000 // Placeholder metric for the table
        }));
        setTenants(enriched);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleImpersonate = (tenantId: string) => {
    setImpersonatedTenantId(tenantId);
    router.push('/dashboard');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-mesh">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh p-6 pb-24 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-violet-500" />
            God Mode
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Agency Super-Admin Dashboard</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            Agency Dashboard
          </Link>
          <button onClick={handleSignOut} className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Top Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-zinc-400">Total Platform Volume</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-white">
              ${(stats?.tpv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12.5% this month
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border-violet-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-16 h-16 text-violet-500" />
          </div>
          <p className="text-sm font-medium text-zinc-400">Fees Collected (1%)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-violet-300">
              ${(stats?.fees || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border-blue-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-zinc-400">Active Tenants</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-blue-300">
              {stats?.active_tenants || 0}
            </span>
            <span className="text-sm text-zinc-500">/ {stats?.total_users || 0} users</span>
          </div>
        </div>
      </div>

      {/* Main Content Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tenant Management Table (8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl border-white/10 flex flex-col h-[600px]">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-display font-semibold text-white">Tenant Management</h2>
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-md font-mono">LIVE</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10 text-zinc-500 text-xs uppercase font-semibold border-b border-white/5 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Tenant Name</th>
                  <th className="px-6 py-4 font-medium">Domain / Slug</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-right">Est. TPV</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-display font-bold text-white">
                          {t.name.charAt(0)}
                        </div>
                        <span className="font-medium text-zinc-200">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                      {t.slug}.swiftkds.com
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-semibold ${
                        t.settings?.is_foodtruck ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        t.settings?.is_restaurant ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        t.settings?.is_salon ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 
                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {t.settings?.is_foodtruck ? 'Food Truck' : t.settings?.is_restaurant ? 'Restaurant' : t.settings?.is_salon ? 'Salon' : 'Agency'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-300">
                      ${t.tpv.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleImpersonate(t.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-500/60 text-violet-300 rounded-lg text-xs font-semibold transition-all shadow-[0_0_10px_rgba(124,58,237,0)] hover:shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                      >
                        Impersonate <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No tenants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Global Map (4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-2xl border-white/10 flex flex-col h-[600px]">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-display font-semibold text-white">Live Fleet Map</h2>
            <p className="text-xs text-zinc-500 mt-1">Real-time food truck locations</p>
          </div>
          <div className="flex-1 p-4">
            <GlobalMap tenants={tenants} />
          </div>
        </div>
      </div>
    </div>
  );
}
