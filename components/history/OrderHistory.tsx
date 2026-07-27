'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { Order } from '@/types/database';

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

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
    <div className="space-y-5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search order ID or customer..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-sm focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-500"
        />
        <div className="absolute inset-y-0 right-3 flex items-center">
          <button className="text-violet-400 hover:bg-violet-500/10 p-1.5 rounded-lg transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === opt.value
                ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      <div className="space-y-3 pb-8">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-xl">
            No orders found.
          </div>
        ) : (
          filteredOrders.map(order => {
            const isCompleted = order.status === 'completed';
            const isCancelled = order.status === 'cancelled' || order.status === 'no_show';

            return (
              <div
                key={order.id}
                className="bg-white/[0.04] border border-white/8 rounded-xl p-4 flex flex-col gap-2.5 transition-transform active:scale-[0.98]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-mono font-semibold text-violet-300">
                      #{order.id.slice(0, 8).toUpperCase()} {order.customer_name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {order.cart_items?.length || 0} Item{(order.cart_items?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono tabular-nums">
                    {format(new Date(order.ordered_at), 'h:mm a')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    Total: {formatAmount(order.total_cents)}
                  </span>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Completed
                    </span>
                  )}
                  {isCancelled && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {order.status === 'no_show' ? 'No Show' : 'Cancelled'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
