'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useOrdersStore, useOrdersByStatus } from '@/lib/store/orders';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { KDSTicket } from '@/components/kds/KDSTicket';
import { NewOrderForm } from '@/components/kds/NewOrderForm';
import { WifiOff, History, Zap } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/types/database';

interface KDSBoardProps {
  tenantId: string;
  requireConfirmation?: boolean;
}

type TabStatus = 'confirmed' | 'in_progress' | 'ready';

export function KDSBoard({ tenantId, requireConfirmation = false }: KDSBoardProps) {
  const supabase = createBrowserClient();
  const { setOrders, updateOrder, setLoading } = useOrdersStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<any>(null);
  const [diningFilter, setDiningFilter] = useState<'all' | 'dine_in' | 'take_out'>('all');
  const [activeTab, setActiveTab] = useState<TabStatus>(
    requireConfirmation ? 'confirmed' : 'in_progress'
  );

  useEffect(() => {
    supabase.from('tenants').select('settings').eq('id', tenantId).single().then(({ data }) => {
      if (data?.settings) setTenantSettings(data.settings);
    });
  }, [tenantId, supabase]);

  useEffect(() => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    supabase
      .from('orders_appointments')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('slot_start', today.toISOString())
      .not('status', 'in', '("completed","cancelled","no_show")')
      .order('ordered_at', { ascending: false })
      .then(({ data }: { data: Order[] | null }) => {
        setOrders(data || []);
        setLoading(false);
        setIsConnected(true);
      })
      .catch(() => { setOrders([]); setLoading(false); setIsConnected(true); });
  }, [tenantId, supabase, setOrders, setLoading]);

  useOrdersRealtime(tenantId);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    updateOrder({ id: orderId, status: newStatus });
    try {
      await supabase.from('orders_appointments').update({ status: newStatus }).eq('id', orderId);
    } catch { /* handled */ }
  };

  const handleDelayAll = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const minutes = parseInt(e.target.value);
    if (!minutes || isNaN(minutes)) return;
    e.target.value = '';
    const newSettings = { ...(tenantSettings || {}), kds_active_delay_mins: minutes };
    setTenantSettings(newSettings);
    try { await supabase.from('tenants').update({ settings: newSettings }).eq('id', tenantId); } catch { /* */ }
  };

  const clearDelay = async () => {
    const newSettings = { ...(tenantSettings || {}), kds_active_delay_mins: 0 };
    setTenantSettings(newSettings);
    try { await supabase.from('tenants').update({ settings: newSettings }).eq('id', tenantId); } catch { /* */ }
  };

  const activeDelayMins = tenantSettings?.kds_active_delay_mins || 0;
  const warningMins = (tenantSettings?.kds_warning_mins || 15) + activeDelayMins;
  const overdueMins = (tenantSettings?.kds_overdue_mins || 30) + activeDelayMins;

  const confirmedOrders = useOrdersByStatusFiltered('confirmed', diningFilter);
  const inProgressOrders = useOrdersByStatusFiltered('in_progress', diningFilter);
  const readyOrders = useOrdersByStatusFiltered('ready', diningFilter);

  const totalActive = confirmedOrders.length + inProgressOrders.length + readyOrders.length;

  // Tabs — only show "Pending" tab if require_order_confirmation is enabled
  const tabs: { status: TabStatus; label: string; count: number }[] = [
    ...(requireConfirmation
      ? [{ status: 'confirmed' as TabStatus, label: 'Pending', count: confirmedOrders.length }]
      : []),
    { status: 'in_progress', label: 'Active',  count: inProgressOrders.length },
    { status: 'ready',       label: 'Ready',   count: readyOrders.length },
  ];

  const activeOrders =
    activeTab === 'confirmed'   ? confirmedOrders :
    activeTab === 'in_progress' ? inProgressOrders :
    readyOrders;

  return (
    <>
      {/* ── Mobile Layout ─────────────────────────────────────── */}
      <div className="md:hidden flex flex-col h-full -mx-4 -mt-4">
        {/* Top bar */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Active Orders</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {totalActive} ticket{totalActive !== 1 ? 's' : ''} in queue
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isConnected ? (
              <div className="bg-zinc-800 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">LIVE: {warningMins}m avg.</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <WifiOff className="w-3.5 h-3.5" /> Connecting…
              </div>
            )}
            {activeDelayMins > 0 ? (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-400 font-semibold">+{activeDelayMins}m delay</span>
                <button onClick={clearDelay} className="text-[10px] text-zinc-400 border border-white/10 rounded px-1.5 bg-black/20 ml-1">✕</button>
              </div>
            ) : (
              <select onChange={handleDelayAll} className="bg-zinc-800/60 border border-white/10 rounded-lg text-xs font-semibold text-zinc-300 px-2 py-1 focus:outline-none cursor-pointer">
                <option value="">Delay…</option>
                <option value="5">+5 Min</option>
                <option value="10">+10 Min</option>
                <option value="15">+15 Min</option>
                <option value="30">+30 Min</option>
              </select>
            )}
          </div>
        </div>

        {/* Dining filter + Status tabs */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5 w-fit gap-0.5">
            {(['all', 'dine_in', 'take_out'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDiningFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${diningFilter === f ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                {f === 'all' ? 'All' : f === 'dine_in' ? 'Dine-In' : 'Take-Out'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.status
                    ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                    : 'bg-zinc-900 text-zinc-400 border border-white/5 hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Order cards — scrollable area */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Zap className="w-8 h-8 mb-3 opacity-20 text-violet-400" />
              <p className="text-sm">No orders in queue</p>
            </div>
          ) : (
            activeOrders.map(order => (
              <KDSTicket
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                warningMins={warningMins}
                overdueMins={overdueMins}
                isMobile
                requireConfirmation={requireConfirmation}
              />
            ))
          )}
        </div>

        {/* Bottom action bar — fixed to bottom of this container */}
        <div className="flex-shrink-0 flex gap-3 px-4 py-3 border-t border-white/5 bg-zinc-950">
          <Link
            href="/dashboard/history"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 border border-white/10 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </Link>
          <button
            onClick={() => setIsNewOrderOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Zap className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {/* ── Desktop Layout ────────────────────────────────────── */}
      <div className="hidden md:flex flex-col h-full gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Kitchen Display System</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Live order queue &amp; prep timers</p>
            </div>
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 ml-6">
              {(['all', 'dine_in', 'take_out'] as const).map(f => (
                <button key={f} onClick={() => setDiningFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${diningFilter === f ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>
                  {f === 'all' ? 'All' : f === 'dine_in' ? 'Dine-In' : 'Take-Out'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)] ml-2"
            >
              <Zap className="w-3.5 h-3.5" /> New Order
            </button>
          </div>
          <div className="flex items-center gap-3">
            {activeDelayMins > 0 ? (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-400 font-semibold">+{activeDelayMins}m delay</span>
                <button onClick={clearDelay} className="text-xs text-zinc-400 border border-white/10 rounded px-1.5 py-0.5 bg-black/20">✕</button>
              </div>
            ) : (
              <select onChange={handleDelayAll} className="bg-zinc-800/50 border border-white/10 rounded-lg text-xs font-semibold text-zinc-300 px-2 py-1.5 focus:outline-none cursor-pointer">
                <option value="">Delay...</option>
                <option value="5">+5 Min</option>
                <option value="10">+10 Min</option>
                <option value="15">+15 Min</option>
                <option value="30">+30 Min</option>
              </select>
            )}
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Live Sync
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <WifiOff className="w-3.5 h-3.5" /> Connecting…
              </span>
            )}
          </div>
        </div>

        {/* Desktop 3-column grid (always shows all statuses) */}
        <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
          {([
            { status: 'confirmed' as const,   label: requireConfirmation ? 'Pending Confirmation' : 'New Orders', color: 'border-blue-500/30',    orders: confirmedOrders },
            { status: 'in_progress' as const, label: 'In Progress', color: 'border-violet-500/30',  orders: inProgressOrders },
            { status: 'ready' as const,       label: 'Ready',       color: 'border-emerald-500/30', orders: readyOrders },
          ]).map(({ status, label, color, orders }) => (
            <div key={status} className={`glass-card flex flex-col border ${color} overflow-hidden`}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="font-display font-semibold text-sm text-zinc-200">{label}</h2>
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-violet-300">{orders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-zinc-600 text-sm">
                    <Zap className="w-5 h-5 mb-1.5 opacity-30 text-violet-400" />
                    <p>No orders in queue</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <KDSTicket key={order.id} order={order} onStatusChange={handleStatusChange} warningMins={warningMins} overdueMins={overdueMins} requireConfirmation={requireConfirmation} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewOrderForm tenantId={tenantId} isOpen={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} onSuccess={() => {}} requireConfirmation={requireConfirmation} />
    </>
  );
}

function useOrdersByStatusFiltered(status: Order['status'], diningFilter: 'all' | 'dine_in' | 'take_out') {
  const rawOrders = useOrdersByStatus(status);
  return rawOrders.filter(o => {
    if (diningFilter === 'all') return true;
    const opt = (o as any).dining_option || 'take_out';
    if (diningFilter === 'dine_in') return opt === 'dine_in';
    return opt === 'take_out' || opt === 'delivery';
  });
}
