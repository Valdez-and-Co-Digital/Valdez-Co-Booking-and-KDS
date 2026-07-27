'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useOrdersStore, useOrdersByStatus } from '@/lib/store/orders';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { KDSTicket } from '@/components/kds/KDSTicket';
import { NewOrderForm } from '@/components/kds/NewOrderForm';
import { WifiOff, Zap, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { Order } from '@/types/database';

interface KDSBoardProps {
  tenantId: string;
}

const COLUMNS: { status: Order['status']; label: string; color: string; dotColor: string }[] = [
  { status: 'confirmed',   label: 'New Orders',  color: 'border-blue-500/30',    dotColor: 'bg-blue-400' },
  { status: 'in_progress', label: 'In Progress', color: 'border-violet-500/30',  dotColor: 'bg-violet-400' },
  { status: 'ready',       label: 'Ready',       color: 'border-emerald-500/30', dotColor: 'bg-emerald-400' },
];

export function KDSBoard({ tenantId }: KDSBoardProps) {
  const supabase = createBrowserClient();
  const { setOrders, updateOrder, setLoading } = useOrdersStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<any>(null);
  const [diningFilter, setDiningFilter] = useState<'all' | 'dine_in' | 'take_out'>('all');

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
      .catch(() => {
        setOrders([]);
        setLoading(false);
        setIsConnected(true);
      });
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
    try {
      await supabase.from('tenants').update({ settings: newSettings }).eq('id', tenantId);
    } catch (err) { console.error('Failed to apply delay', err); }
  };

  const clearDelay = async () => {
    const newSettings = { ...(tenantSettings || {}), kds_active_delay_mins: 0 };
    setTenantSettings(newSettings);
    try {
      await supabase.from('tenants').update({ settings: newSettings }).eq('id', tenantId);
    } catch (err) { console.error('Failed to clear delay', err); }
  };

  const activeDelayMins = tenantSettings?.kds_active_delay_mins || 0;

  return (
    <>
      <div className="h-full flex flex-col gap-3">
        {/* ── Header ── */}
        <div className="flex flex-col gap-2">
          {/* Row 1: Title + Live badge */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold leading-tight">Kitchen Display System</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Live order queue &amp; prep timers</p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Live</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <WifiOff className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Filters + Delay + New Order */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dining filter pills */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
              {(['all', 'dine_in', 'take_out'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDiningFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${diningFilter === f ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  {f === 'all' ? 'All' : f === 'dine_in' ? 'Dine-In' : 'Take-Out'}
                </button>
              ))}
            </div>

            {/* Delay badge or dropdown */}
            {activeDelayMins > 0 ? (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-400 font-semibold">+{activeDelayMins}m delay</span>
                <button onClick={clearDelay} className="text-xs text-zinc-400 hover:text-white border border-white/10 rounded px-1.5 py-0.5 bg-black/20">✕</button>
              </div>
            ) : (
              <select
                onChange={handleDelayAll}
                className="bg-zinc-800/50 border border-white/10 rounded-lg text-xs font-semibold text-zinc-300 px-2 py-1.5 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="">Delay...</option>
                <option value="5">+5 Min</option>
                <option value="10">+10 Min</option>
                <option value="15">+15 Min</option>
                <option value="30">+30 Min</option>
              </select>
            )}

            {/* New Order button — pushed to right on large screens */}
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              New Order
            </button>
          </div>
        </div>

        {/* ── Kanban Columns ──
            Mobile: stacked vertically, each collapsible
            Desktop: 3-column grid filling height
        */}
        <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-3 overflow-y-auto md:overflow-hidden">
          {COLUMNS.map(({ status, label, color, dotColor }) => (
            <KDSColumn
              key={status}
              status={status}
              label={label}
              color={color}
              dotColor={dotColor}
              onStatusChange={handleStatusChange}
              diningFilter={diningFilter}
              warningMins={(tenantSettings?.kds_warning_mins || 15) + activeDelayMins}
              overdueMins={(tenantSettings?.kds_overdue_mins || 30) + activeDelayMins}
            />
          ))}
        </div>
      </div>

      <NewOrderForm
        tenantId={tenantId}
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
}

function KDSColumn({
  status, label, color, dotColor, onStatusChange, diningFilter, warningMins, overdueMins
}: {
  status: Order['status'];
  label: string;
  color: string;
  dotColor: string;
  onStatusChange: (id: string, s: Order['status']) => void;
  diningFilter: 'all' | 'dine_in' | 'take_out';
  warningMins?: number;
  overdueMins?: number;
}) {
  const rawOrders = useOrdersByStatus(status);
  const [collapsed, setCollapsed] = useState(false);

  const orders = rawOrders.filter(o => {
    if (diningFilter === 'all') return true;
    const opt = (o as any).dining_option || 'take_out';
    if (diningFilter === 'dine_in') return opt === 'dine_in';
    return opt === 'take_out' || opt === 'delivery';
  });

  return (
    <div className={`glass-card flex flex-col border ${color} overflow-hidden md:min-h-0`}>
      {/* Column Header — tappable on mobile to collapse */}
      <button
        className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02] w-full text-left"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h2 className="font-display font-semibold text-sm text-zinc-200">{label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-violet-300">
            {orders.length}
          </span>
          <span className="md:hidden text-zinc-500">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Column Body — hidden when collapsed on mobile */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 md:max-h-none max-h-72">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-zinc-600 text-sm">
              <Zap className="w-5 h-5 mb-1.5 opacity-30 text-violet-400" />
              <p>No orders in queue</p>
            </div>
          ) : (
            orders.map(order => (
              <KDSTicket
                key={order.id}
                order={order}
                onStatusChange={onStatusChange}
                warningMins={warningMins}
                overdueMins={overdueMins}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
