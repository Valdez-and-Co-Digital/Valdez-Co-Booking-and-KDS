'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useImpersonation } from '@/providers/ImpersonationProvider';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, Zap, Users, ArrowRight, Shield, Download, Filter, Search, Store, Scissors, Briefcase } from 'lucide-react';

export default function AgencyOverview() {
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
        // Mock order data total for display purposes
        const enriched = tenantsData.map(t => ({
          ...t,
          tpv: Math.floor(Math.random() * 2000000) + 100000 
        }));
        setTenants(enriched);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleImpersonate = (tenantId: string) => {
    setImpersonatedTenantId(tenantId);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const getTenantIcon = (settings: any) => {
    if (settings?.is_foodtruck) return <Store className="w-4 h-4 text-emerald-400" />;
    if (settings?.is_salon) return <Scissors className="w-4 h-4 text-amber-400" />;
    return <Briefcase className="w-4 h-4 text-violet-400" />;
  };

  const getTenantTypeLabel = (settings: any) => {
    if (settings?.is_foodtruck) return 'Food Truck';
    if (settings?.is_salon) return 'Salon';
    if (settings?.is_restaurant) return 'Restaurant';
    return 'Agency';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Tenant Management
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Oversee system-wide tenants, revenue throughput, and direct impersonation tools.</p>
        </div>
        <button className="hidden md:flex bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold items-center gap-2 transition-colors text-sm">
          + Provision New Tenant
        </button>
      </div>

      {/* ── Top Metrics Grid (OmniTruck Style) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-card p-4 md:p-6 rounded-2xl border-white/5 bg-[#131315]/80 hover:bg-[#131315] transition-colors relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Revenue</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-display font-bold text-white">
              ${((stats?.tpv || 0) / 1000).toFixed(1)}M
            </span>
            <span className="text-[10px] md:text-xs text-emerald-400 font-medium flex items-center">
              ↑ 12%
            </span>
          </div>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-2xl border-white/5 bg-[#131315]/80 hover:bg-[#131315] transition-colors relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Tenants</p>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-display font-bold text-white">
              {stats?.active_tenants?.toLocaleString() || '1,284'}
            </span>
            <span className="text-[10px] md:text-xs text-zinc-400 font-medium">
              ↑ 4
            </span>
          </div>
        </div>

        <div className="hidden md:block glass-card p-4 md:p-6 rounded-2xl border-white/5 bg-[#131315]/80 hover:bg-[#131315] transition-colors relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg. Latency</p>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-display font-bold text-white">
              42ms
            </span>
            <span className="text-[10px] md:text-xs text-amber-400 font-medium">
              ↓ 8ms
            </span>
          </div>
        </div>

        <div className="hidden md:block glass-card p-4 md:p-6 rounded-2xl border-white/5 bg-[#131315]/80 hover:bg-[#131315] transition-colors relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wider">System Status</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-sm font-display font-semibold text-white tracking-wide">
              OPTIMAL_READY
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Directory Section ── */}
      <div className="glass-card rounded-2xl border-white/5 bg-[#131315]/60 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Mobile Search */}
            <div className="md:hidden relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search tenants, TPV, or type..." 
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            
            <div className="hidden md:flex bg-black/40 p-1 rounded-xl border border-white/5">
              <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white">All Tenants</button>
              <button className="px-4 py-1.5 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition-colors">Premium Only</button>
            </div>
            <span className="hidden md:inline text-xs text-zinc-500">Showing {tenants.length} of {stats?.active_tenants || 1284}</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button className="p-2 border border-white/5 bg-black/40 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 border border-white/5 bg-black/40 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 md:hidden">
           <h2 className="text-lg font-display font-bold text-white mb-4">Global Directory</h2>
        </div>

        {/* ── Desktop Table View ── */}
        <div className="hidden md:block overflow-x-auto w-full pb-8">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
            <thead className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tenant Name</th>
                <th className="px-6 py-4">Domain / Slug</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Est. TPV (Annual)</th>
                <th className="px-6 py-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-900/40 border border-violet-500/20 flex items-center justify-center font-display font-bold text-violet-300 text-xs">
                        {t.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">{t.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">ID: {t.id.split('-')[0].toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-violet-400/70 font-mono text-xs">
                    {t.slug}.swiftkds.com
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase px-2.5 py-1 rounded-full font-bold border ${
                      t.settings?.is_foodtruck ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      t.settings?.is_salon ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${t.settings?.is_foodtruck ? 'bg-emerald-400' : t.settings?.is_salon ? 'bg-amber-400' : 'bg-zinc-400'}`} />
                      {getTenantTypeLabel(t.settings)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-200 font-medium">
                    ${(t.tpv / 1000).toFixed(1)}k
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleImpersonate(t.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/30 text-zinc-300 hover:text-violet-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      <ArrowRight className="w-3 h-3" /> Impersonate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Card View (Global Directory) ── */}
        <div className="md:hidden flex flex-col gap-4 px-4 pb-8">
          {tenants.map((t) => (
            <div key={t.id} className="glass-card rounded-2xl border-white/5 p-4 flex flex-col gap-4 bg-[#131315]/80">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-900/40 border border-violet-500/20 flex items-center justify-center font-display font-bold text-violet-300 text-sm">
                    {getTenantIcon(t.settings)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-base">{t.name}</h3>
                    <span className={`mt-1 inline-flex items-center gap-1 text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                      t.settings?.is_foodtruck ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      t.settings?.is_salon ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${t.settings?.is_foodtruck ? 'bg-emerald-400' : t.settings?.is_salon ? 'bg-amber-400' : 'bg-zinc-400'}`} />
                      {getTenantTypeLabel(t.settings)}
                    </span>
                  </div>
                </div>
                <button className="text-zinc-500 p-1">
                  <div className="w-1 h-1 rounded-full bg-current mb-0.5" />
                  <div className="w-1 h-1 rounded-full bg-current mb-0.5" />
                  <div className="w-1 h-1 rounded-full bg-current" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Estimated TPV</div>
                  <div className="font-mono text-zinc-100 text-lg">${(t.tpv / 1000).toFixed(1)}k</div>
                </div>
                <button
                  onClick={() => handleImpersonate(t.id)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 rounded-xl text-sm font-semibold transition-all"
                >
                  <ArrowRight className="w-4 h-4" /> Impersonate
                </button>
              </div>
            </div>
          ))}

          <div className="py-8 flex flex-col items-center justify-center text-zinc-500 opacity-50">
            <div className="w-12 h-12 rounded-full border border-dashed border-zinc-500 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs">End of directory. Use filters to narrow results.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
