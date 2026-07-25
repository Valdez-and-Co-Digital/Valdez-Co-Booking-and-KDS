import Link from 'next/link';
import {
  TrendingUp, Users, DollarSign, Clock, ArrowUpRight,
  ClipboardList, CreditCard, MapPin, Zap, CheckCircle2,
  FileText, Briefcase, Loader2
} from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardOverviewPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // 1. Fetch user's tenant connection
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant:tenants(id, name, settings)')
    .eq('user_id', session.user.id)
    .single();

  const tenant = adminUser?.tenant as any;
  if (!tenant) {
    return <div className="p-8 text-center text-zinc-400">Loading your business profile...</div>;
  }

  const isFoodTruck = tenant.settings?.is_foodtruck;
  const isSalon = tenant.settings?.is_salon;
  const tenantType = isFoodTruck ? 'foodtruck' : isSalon ? 'salon' : 'agency';

  // 2. Fetch real data
  
  // Clients count
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id);

  // Invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, client:clients(name)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  const safeInvoices = (invoices as any[]) || [];

  const paidInvoices = safeInvoices.filter(i => i.status === 'paid');
  const openInvoices = safeInvoices.filter(i => i.status === 'open' || i.status === 'pending');

  const totalSalesCents = paidInvoices.reduce((acc, curr) => acc + curr.amount_cents, 0);
  const totalSalesFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalSalesCents / 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Mission Control</h1>
          <p className="text-sm text-zinc-400">
            {tenant.name} ({tenantType === 'agency' ? 'Agency Mode' : tenantType === 'salon' ? 'Salon Mode' : 'Food Truck Mode'})
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Collected</span>
            <div className="p-2 rounded-lg bg-white/5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold">{totalSalesFormatted}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Invoices</span>
            <div className="p-2 rounded-lg bg-white/5">
              <Briefcase className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold">{openInvoices.length}</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Paid Invoices</span>
            <div className="p-2 rounded-lg bg-white/5">
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold">{paidInvoices.length}</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Clients</span>
            <div className="p-2 rounded-lg bg-white/5">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold">{totalClients || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg">Quick Launchpad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/clients"
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm">Client CRM</p>
              <p className="text-xs text-zinc-400">Manage clients, notes, and contact info</p>
            </div>
          </Link>
          <Link
            href="/dashboard/invoices"
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 transition-colors" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm">Invoices & Billing</p>
              <p className="text-xs text-zinc-400">Create invoices and payment links</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Recent Invoices</h2>
        </div>

        <div className="divide-y divide-white/5">
          {safeInvoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">No invoices yet. Create one to see it here!</div>
          ) : (
            safeInvoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-violet-400">
                    {invoice.id.split('-')[1] || invoice.id.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200">{invoice.client?.name || 'Unknown Client'}</p>
                    <p className="text-xs text-zinc-500">{invoice.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`status-badge status-${invoice.status === 'open' ? 'in_progress' : invoice.status === 'paid' ? 'ready' : 'pending'}`}>
                    {invoice.status}
                  </span>
                  <span className="font-mono font-semibold text-zinc-200">
                    ${(invoice.amount_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
