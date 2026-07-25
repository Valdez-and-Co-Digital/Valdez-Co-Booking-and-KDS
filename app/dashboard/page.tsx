'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Users, DollarSign, Clock, ArrowUpRight,
  ClipboardList, CreditCard, MapPin, Zap, CheckCircle2,
  FileText, Briefcase
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [tenantType, setTenantType] = useState<'foodtruck' | 'salon' | 'agency'>('foodtruck');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Business Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Mission Control</h1>
          <p className="text-sm text-zinc-400">
            {tenantType === 'foodtruck' ? 'Tacos El Rey (Food Truck Mode)' : tenantType === 'salon' ? 'Glamour Studio (Salon Mode)' : 'Valdez & Co. Digital (Agency Mode)'}
          </p>
        </div>

        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/5 self-start sm:self-auto flex-wrap">
          <span className="text-xs text-zinc-400 px-2 font-medium">Demo Mode:</span>
          <button
            onClick={() => setTenantType('foodtruck')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tenantType === 'foodtruck'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🚚 Food Truck
          </button>
          <button
            onClick={() => setTenantType('salon')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tenantType === 'salon'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ✂️ Salon
          </button>
          <button
            onClick={() => setTenantType('agency')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tenantType === 'agency'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            💻 Agency
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: tenantType === 'agency' ? 'MRR / Retainers' : "Today's Gross Sales",
            value: tenantType === 'agency' ? '$12,500' : '$1,847.00',
            change: tenantType === 'agency' ? '+5.2%' : '+14.2%',
            icon: DollarSign,
            color: 'text-emerald-400',
          },
          {
            label: tenantType === 'foodtruck' ? 'Active KDS Tickets' : tenantType === 'salon' ? 'Today Appointments' : 'Active Projects',
            value: tenantType === 'agency' ? '4' : '24',
            change: tenantType === 'agency' ? '+1 project' : '+6 orders',
            icon: tenantType === 'agency' ? Briefcase : ClipboardList,
            color: 'text-violet-400',
          },
          {
            label: tenantType === 'foodtruck' ? 'Avg Ticket Prep Time' : tenantType === 'salon' ? 'Avg Slot Duration' : 'Unpaid Invoices',
            value: tenantType === 'foodtruck' ? '6.4 min' : tenantType === 'salon' ? '45 min' : '3',
            change: tenantType === 'agency' ? 'Action required' : '-1.2 min',
            icon: tenantType === 'agency' ? FileText : Clock,
            color: 'text-amber-400',
          },
          {
            label: tenantType === 'agency' ? 'Total Clients' : 'Total Customers',
            value: tenantType === 'agency' ? '12' : '19',
            change: tenantType === 'agency' ? '+2 this month' : '85% repeat',
            icon: Users,
            color: 'text-blue-400',
          },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{stat.label}</span>
              <div className="p-2 rounded-lg bg-white/5">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-bold">{stat.value}</span>
              <span className={`text-xs font-medium ${stat.change.includes('Action') ? 'text-amber-400' : 'text-emerald-400'} flex items-center gap-0.5`}>
                {!stat.change.includes('Action') && <TrendingUp className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launchpad */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg">Quick Launchpad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tenantType === 'agency' ? (
            <>
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
            </>
          ) : (
            <>
              <Link
                href="/dashboard/kds"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all group flex flex-col justify-between h-32"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm">Open KDS Board</p>
                  <p className="text-xs text-zinc-400">Real-time ticket display with countdown chime</p>
                </div>
              </Link>

              <Link
                href="/dashboard/location"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all group flex flex-col justify-between h-32"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm">Food Truck Geo Sync</p>
                  <p className="text-xs text-zinc-400">Broadcast live location & open status</p>
                </div>
              </Link>
            </>
          )}

          <Link
            href="/dashboard/quick-charge"
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm">Tap to Pay (Terminal)</p>
              <p className="text-xs text-zinc-400">Manual quick charge or pull from ticket/invoice</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Mode Specific Feature Preview */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">
            {tenantType === 'foodtruck' ? '🚚 Food Truck Order Queue' : tenantType === 'salon' ? '✂️ Salon Appointment Timeline' : '💻 Recent Invoices'}
          </h2>
          {tenantType !== 'agency' && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync Active
            </span>
          )}
        </div>

        <div className="divide-y divide-white/5">
          {tenantType === 'agency' ? [
            {
              id: 'INV-1042',
              customer: 'Acme Corp',
              details: 'Website Build - Phase 2',
              time: 'Due in 3 days',
              status: 'open',
              total: '$4,500.00',
            },
            {
              id: 'INV-1041',
              customer: 'TechStart Inc',
              details: 'Monthly SEO Retainer',
              time: 'Overdue',
              status: 'pending',
              total: '$1,200.00',
            },
            {
              id: 'INV-1040',
              customer: 'Smith & Co',
              details: 'Brand Identity Design',
              time: 'Paid on Jul 20',
              status: 'paid',
              total: '$2,500.00',
            }
          ].map((invoice) => (
             <div key={invoice.id} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-violet-400">
                  {invoice.id.split('-')[1]}
                </div>
                <div>
                  <p className="font-medium text-zinc-200">{invoice.customer}</p>
                  <p className="text-xs text-zinc-500">{invoice.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400">{invoice.time}</span>
                <span className={`status-badge status-${invoice.status === 'open' ? 'in_progress' : invoice.status === 'paid' ? 'ready' : 'pending'}`}>
                  {invoice.status}
                </span>
                <span className="font-mono font-semibold text-zinc-200">{invoice.total}</span>
              </div>
            </div>
          )) : [
            {
              id: 'ORD-9401',
              customer: 'Marcus Johnson',
              details: tenantType === 'foodtruck' ? '2x Birria Tacos, 1x Horchata' : 'Women Haircut + Highlights',
              time: '12:15 PM',
              status: 'in_progress',
              total: '$24.98',
            },
            {
              id: 'ORD-9402',
              customer: 'Sarah Lopez',
              details: tenantType === 'foodtruck' ? '1x Quesabirria, 1x Agua Fresca' : 'Blowout & Styling',
              time: '12:22 PM',
              status: 'confirmed',
              total: '$18.98',
            },
            {
              id: 'ORD-9403',
              customer: 'David Wright',
              details: tenantType === 'foodtruck' ? '3x Al Pastor Tacos' : 'Men Haircut',
              time: '12:30 PM',
              status: 'ready',
              total: '$10.99',
            },
          ].map((order) => (
            <div key={order.id} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-violet-400">
                  {order.id.slice(-4)}
                </div>
                <div>
                  <p className="font-medium text-zinc-200">{order.customer}</p>
                  <p className="text-xs text-zinc-500">{order.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400 font-mono">{order.time}</span>
                <span className={`status-badge status-${order.status}`}>
                  {order.status.replace('_', ' ')}
                </span>
                <span className="font-mono font-semibold text-zinc-200">{order.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
