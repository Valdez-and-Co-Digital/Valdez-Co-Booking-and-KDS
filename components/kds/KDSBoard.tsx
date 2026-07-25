'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useOrdersStore, useOrdersByStatus } from '@/lib/store/orders';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { KDSTicket } from '@/components/kds/KDSTicket';
import { WifiOff, Zap } from 'lucide-react';
import type { Order } from '@/types/database';

interface KDSBoardProps {
  tenantId: string;
}

const MOCK_PREVIEW_ORDERS: Order[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    tenant_id: 'b0000000-0000-0000-0000-000000000002',
    customer_name: 'Marcus Johnson',
    customer_email: 'marcus@example.com',
    customer_phone: '512-555-0192',
    slot_start: new Date().toISOString(),
    slot_end: new Date(Date.now() + 15 * 60000).toISOString(),
    cart_items: [
      { service_id: 'f1', name: 'Birria Tacos (3)', price_cents: 1299, prep_time_minutes: 8, quantity: 2 },
      { service_id: 'f5', name: 'Fresh Horchata (L)', price_cents: 499, prep_time_minutes: 1, quantity: 1 },
    ],
    total_cents: 3097,
    status: 'confirmed',
    notes: 'Extra consommé please!',
    stripe_payment_intent_id: 'pi_mock_001',
    stripe_transfer_id: null,
    payment_status: 'paid',
    stripe_terminal_payment_id: null,
    ordered_at: new Date(Date.now() - 3 * 60000).toISOString(), // 3 mins ago
    updated_at: new Date().toISOString(),
    completed_at: null,
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    tenant_id: 'b0000000-0000-0000-0000-000000000002',
    customer_name: 'Sarah Lopez',
    customer_email: 'sarah@example.com',
    customer_phone: '512-555-0144',
    slot_start: new Date().toISOString(),
    slot_end: new Date(Date.now() + 15 * 60000).toISOString(),
    cart_items: [
      { service_id: 'f3', name: 'Quesabirria Special', price_cents: 1499, prep_time_minutes: 10, quantity: 1 },
    ],
    total_cents: 1499,
    status: 'in_progress',
    notes: 'No cilantro on quesabirria',
    stripe_payment_intent_id: 'pi_mock_002',
    stripe_transfer_id: null,
    payment_status: 'paid',
    stripe_terminal_payment_id: null,
    ordered_at: new Date(Date.now() - 12 * 60000).toISOString(), // 12 mins ago
    updated_at: new Date().toISOString(),
    completed_at: null,
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    tenant_id: 'b0000000-0000-0000-0000-000000000003',
    customer_name: 'David Wright',
    customer_email: 'david@example.com',
    customer_phone: '512-555-0177',
    slot_start: new Date().toISOString(),
    slot_end: new Date(Date.now() + 15 * 60000).toISOString(),
    cart_items: [
      { service_id: 'f2', name: 'Al Pastor Tacos (3)', price_cents: 1099, prep_time_minutes: 5, quantity: 2 },
      { service_id: 'f4', name: 'Loaded Nachos', price_cents: 1099, prep_time_minutes: 7, quantity: 1 },
    ],
    total_cents: 3297,
    status: 'ready',
    notes: null,
    stripe_payment_intent_id: 'pi_mock_003',
    stripe_transfer_id: null,
    payment_status: 'paid',
    stripe_terminal_payment_id: null,
    ordered_at: new Date(Date.now() - 21 * 60000).toISOString(), // 21 mins ago
    updated_at: new Date().toISOString(),
    completed_at: null,
  },
];

const COLUMNS: { status: Order['status']; label: string; color: string }[] = [
  { status: 'confirmed',   label: 'New Orders',  color: 'border-blue-500/30' },
  { status: 'in_progress', label: 'In Progress', color: 'border-violet-500/30' },
  { status: 'ready',       label: 'Ready',       color: 'border-emerald-500/30' },
];

export function KDSBoard({ tenantId }: KDSBoardProps) {
  const supabase = createBrowserClient();
  const { setOrders, updateOrder, setLoading } = useOrdersStore();
  const [isConnected, setIsConnected] = useState(false);

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
        if (data && data.length > 0) {
          setOrders(data);
        } else {
          // Preview fallback mode with interactive mock tickets
          setOrders(MOCK_PREVIEW_ORDERS);
        }
        setLoading(false);
        setIsConnected(true);
      })
      .catch(() => {
        setOrders(MOCK_PREVIEW_ORDERS);
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
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Kitchen Display System</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Live order queue & prep timers</p>
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
          />
        ))}
      </div>
    </div>
  );
}

function KDSColumn({
  status, label, color, onStatusChange,
}: {
  status: Order['status'];
  label: string;
  color: string;
  onStatusChange: (id: string, s: Order['status']) => void;
}) {
  const orders = useOrdersByStatus(status);

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
            />
          ))
        )}
      </div>
    </div>
  );
}
