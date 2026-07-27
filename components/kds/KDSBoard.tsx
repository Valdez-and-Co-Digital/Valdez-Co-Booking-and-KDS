'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useOrdersStore, useOrdersByStatus } from '@/lib/store/orders';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { KDSTicket } from '@/components/kds/KDSTicket';
import { NewOrderForm } from '@/components/kds/NewOrderForm';
import { WifiOff, Zap, Plus } from 'lucide-react';
import type { Order } from '@/types/database';

interface KDSBoardProps {
  tenantId: string;
}


const COLUMNS: { status: Order['status']; label: string; color: string }[] = [
  { status: 'confirmed',   label: 'New Orders',  color: 'border-blue-500/30' },
  { status: 'in_progress', label: 'In Progress', color: 'border-violet-500/30' },
  { status: 'ready',       label: 'Ready',       color: 'border-emerald-500/30' },
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
      await supabase
        .from('orders_appointments')
        .update({ status: newStatus })
        .eq('id', orderId);
    } catch {
      // Handled in preview mode
    }
  };

  return (
    <>
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Kitchen Display System</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Live order queue & prep timers</p>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 ml-6">
              <button
                onClick={() => setDiningFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${diningFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
              >All</button>
              <button
                onClick={() => setDiningFilter('dine_in')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${diningFilter === 'dine_in' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
              >Dine-In</button>
              <button
                onClick={() => setDiningFilter('take_out')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${diningFilter === 'take_out' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
              >Take-Out</button>
            </div>

            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] ml-4"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <WifiOff className="w-3.5 h-3.5" />
                Connecting…
              </span>
            )}
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          {COLUMNS.map(({ status, label, color }) => (
            <KDSColumn
              key={status}
              status={status}
              label={label}
              color={color}
              onStatusChange={handleStatusChange}
              diningFilter={diningFilter}
              warningMins={tenantSettings?.kds_warning_mins}
              overdueMins={tenantSettings?.kds_overdue_mins}
            />
          ))}
        </div>
      </div>

      <NewOrderForm 
        tenantId={tenantId}
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSuccess={() => {
          // In a real app we might refetch, but realtime should handle it
        }}
      />
    </>
  );
}

function KDSColumn({
  status, label, color, onStatusChange, diningFilter, warningMins, overdueMins
}: {
  status: Order['status'];
  label: string;
  color: string;
  onStatusChange: (id: string, s: Order['status']) => void;
  diningFilter: 'all' | 'dine_in' | 'take_out';
  warningMins?: number;
  overdueMins?: number;
}) {
  const rawOrders = useOrdersByStatus(status);
  const orders = rawOrders.filter(o => {
    if (diningFilter === 'all') return true;
    // We treat 'delivery' as take out for the KDS, or handle it strictly.
    const opt = (o as any).dining_option || 'take_out';
    if (diningFilter === 'dine_in') return opt === 'dine_in';
    return opt === 'take_out' || opt === 'delivery';
  });

  return (
    <div className={`glass-card flex flex-col border ${color} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h2 className="font-display font-semibold text-sm text-zinc-200">{label}</h2>
        <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-violet-300">
          {orders.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-sm">
            <Zap className="w-6 h-6 mb-2 opacity-30 text-violet-400" />
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
    </div>
  );
}
