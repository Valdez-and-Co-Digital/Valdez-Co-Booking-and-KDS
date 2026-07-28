import { createServerClient } from '@/lib/supabase/server';
import { Building2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function AgencyPage() {
  const supabase = await createServerClient();
  
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, admin_users(count)')
    .order('created_at', { ascending: false });
    
  // Simple aggregate mock math
  const activeTenants = tenants?.length || 0;
  // sum up all admin users across all tenants as a rough "Total Clients" approximation
  const totalClients = tenants?.reduce((sum, t) => sum + ((t.admin_users?.[0]?.count as number) || 1), 0) || 0;
  const totalMRR = activeTenants * 99; // mock $99/mo per tenant

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-2">Agency Super Admin</h1>
        <p className="text-zinc-400 font-sans">Manage all tenants and workspaces across your platform.</p>
      </header>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-white/5 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center border border-[#7c3aed]/30">
              <TrendingUp className="w-5 h-5 text-[#d2bbff]" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Total MRR</h2>
          </div>
          <p className="text-3xl font-display font-bold text-white">${totalMRR.toLocaleString()}</p>
        </div>
        
        <div className="glass-card p-6 border-white/5 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 flex items-center justify-center border border-[#10b981]/30">
              <Building2 className="w-5 h-5 text-[#6ffbbe]" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Active Tenants</h2>
          </div>
          <p className="text-3xl font-display font-bold text-white">{activeTenants}</p>
        </div>

        <div className="glass-card p-6 border-white/5 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0ea5e9]/20 flex items-center justify-center border border-[#0ea5e9]/30">
              <Users className="w-5 h-5 text-[#7dd3fc]" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Total Users</h2>
          </div>
          <p className="text-3xl font-display font-bold text-white">{totalClients}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-display font-semibold text-white">Tenants</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="text-xs uppercase tracking-wider text-zinc-500 bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Business Name</th>
                <th className="px-6 py-4 font-semibold">Domain</th>
                <th className="px-6 py-4 font-semibold">Referral Code</th>
                <th className="px-6 py-4 font-semibold">Sign-up Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants?.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-display font-bold text-[#d2bbff]">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{tenant.name}</p>
                        <p className="text-xs text-zinc-500">
                          {tenant.settings?.is_salon ? 'Salon' : tenant.settings?.is_foodtruck ? 'Restaurant' : 'Agency'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                    {tenant.slug}.kds.io
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tenant.referral_code ? (
                      <span className="px-2 py-1 rounded bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/30 font-mono text-xs">
                        {tenant.referral_code}
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                    {format(new Date(tenant.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#10b981]/10 text-[#6ffbbe] text-xs font-medium border border-[#10b981]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link 
                      href={`/dashboard`} 
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-white font-medium transition-colors text-xs opacity-0 group-hover:opacity-100"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              
              {tenants?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
