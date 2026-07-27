'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Search, Receipt } from 'lucide-react';
import type { Order } from '@/types/database';

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function OrderHistory({ initialOrders }: { initialOrders: Order[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const filteredOrders = initialOrders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && order.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            <Clock className="w-6 h-6 text-violet-400" />
            Order History
          </h1>
          <p className="text-sm text-zinc-400">
            View completed and cancelled orders.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by customer name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-black/20 text-zinc-400">
              <tr>
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-zinc-500">{order.id.slice(0, 8)}...</td>
                    <td className="p-4">{format(new Date(order.ordered_at), 'MMM d, h:mm a')}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{order.customer_name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-300">
                          {order.cart_items?.length || 0} items
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-violet-300">
                      {formatAmount(order.total_cents)}
                    </td>
                    <td className="p-4">
                      {order.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      )}
                      {order.status === 'no_show' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <XCircle className="w-3 h-3" /> No Show
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
