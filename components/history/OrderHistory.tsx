'use client';

import { useState } from 'react';
import { format } from 'date-fns';
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
    <div className="space-y-6">
      {/* Search & Filter Area */}
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          </div>
          <input 
            type="text" 
            placeholder="Search order ID or customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-body-md font-body-md focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-outline/50"
          />
          <div className="absolute inset-y-0 right-4 flex items-center">
            <button className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Horizontal Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2 rounded-full font-label-caps text-label-caps whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'bg-white/5 backdrop-blur-md text-on-surface-variant hover:bg-white/10'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setStatusFilter('completed')}
            className={`px-5 py-2 rounded-full font-label-caps text-label-caps whitespace-nowrap transition-all ${
              statusFilter === 'completed'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'bg-white/5 backdrop-blur-md text-on-surface-variant hover:bg-white/10'
            }`}
          >
            Completed
          </button>
          <button 
            onClick={() => setStatusFilter('cancelled')}
            className={`px-5 py-2 rounded-full font-label-caps text-label-caps whitespace-nowrap transition-all ${
              statusFilter === 'cancelled'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'bg-white/5 backdrop-blur-md text-on-surface-variant hover:bg-white/10'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Vertical Order List */}
      <div className="space-y-4 pb-8">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant border border-dashed border-white/10 rounded-xl">
            No orders found.
          </div>
        ) : (
          filteredOrders.map(order => {
            // Determine status badge colors
            let badgeBg = 'bg-secondary-container/10 border-secondary-container/20';
            let badgeDot = 'bg-secondary';
            let badgeText = 'text-secondary';
            let statusLabel = 'Completed';

            if (order.status === 'cancelled') {
              badgeBg = 'bg-error-container/10 border-error-container/20';
              badgeDot = 'bg-error';
              badgeText = 'text-error';
              statusLabel = 'Cancelled';
            } else if (order.status === 'no_show') {
              badgeBg = 'bg-error-container/10 border-error-container/20';
              badgeDot = 'bg-error';
              badgeText = 'text-error';
              statusLabel = 'No Show';
            }

            return (
              <div key={order.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col gap-3 transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-mono-data text-mono-data text-primary">#{order.id.slice(0, 8).toUpperCase()} {order.customer_name}</span>
                    <span className="font-body-md text-body-md text-on-surface-variant/60">{order.cart_items?.length || 0} Items</span>
                  </div>
                  <span className="font-mono-data text-mono-data text-on-surface-variant">{format(new Date(order.ordered_at), 'h:mm a')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Total: {formatAmount(order.total_cents)}</span>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeBg}`}>
                    <div className={`w-[6px] h-[6px] rounded-full ${badgeDot}`}></div>
                    <span className={`font-label-caps text-label-caps ${badgeText}`}>{statusLabel}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
