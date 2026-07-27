'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { FileText, RotateCcw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { Order } from '@/types/database';

export default function OrderHistoryPage() {
  const supabase = createBrowserClient();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reopening, setReopening] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from('admin_users')
        .select('tenant_id')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setTenantId(data.tenant_id);
          }
        });
    });
  }, [supabase]);

  useEffect(() => {
    if (!tenantId) return;

    supabase
      .from('orders_appointments')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['completed', 'cancelled', 'no_show'])
      .order('updated_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setOrders(data as Order[]);
        }
        setLoading(false);
      });
  }, [tenantId, supabase]);

  const handleReopen = async (orderId: string) => {
    setReopening(orderId);
    
    // Default to 'in_progress' so it jumps back to the middle KDS column
    const { error } = await supabase
      .from('orders_appointments')
      .update({ status: 'in_progress' })
      .eq('id', orderId);
      
    if (error) {
      alert('Failed to reopen order');
    } else {
      setOrders(orders.filter(o => o.id !== orderId));
    }
    setReopening(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Loading history...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between glass-card p-5">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-400" />
            Order History
          </h1>
          <p className="text-sm text-zinc-400 mt-1">View completed or cancelled orders</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-4 font-semibold text-zinc-300">Order ID</th>
                  <th className="p-4 font-semibold text-zinc-300">Customer</th>
                  <th className="p-4 font-semibold text-zinc-300">Total</th>
                  <th className="p-4 font-semibold text-zinc-300">Status</th>
                  <th className="p-4 font-semibold text-zinc-300">Date</th>
                  <th className="p-4 font-semibold text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono text-sm text-zinc-400">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-zinc-200">{order.customer_name}</div>
                      {(order as any).dining_option && (
                        <div className="text-xs text-zinc-500 uppercase mt-0.5">
                          {(order as any).dining_option.replace('_', '-')}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-emerald-400">
                      ${(order.total_cents / 100).toFixed(2)}
                    </td>
                    <td className="p-4">
                      {order.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-sm text-emerald-400">
                          <CheckCircle className="w-4 h-4" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-red-400">
                          <XCircle className="w-4 h-4" /> {order.status === 'cancelled' ? 'Cancelled' : 'No Show'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-zinc-400">
                      {new Date(order.updated_at || order.ordered_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleReopen(order.id)}
                        disabled={reopening === order.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors disabled:opacity-50"
                      >
                        {reopening === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Reopen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
