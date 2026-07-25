'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Clock, ChevronRight, User, Package } from 'lucide-react';
import type { Order } from '@/types/database';

// ============================================================
// COUNTDOWN TIMER (updates every second)
// ============================================================
function useCountdown(startTime: string) {
  const [elapsed, setElapsed] = useState({ minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const update = () => {
      const start = new Date(startTime);
      const now = new Date();
      const totalSecs = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
      setElapsed({
        minutes: Math.floor(totalSecs / 60),
        seconds: totalSecs % 60,
        total: totalSecs,
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

// Urgency level based on minutes elapsed
function getUrgencyClass(minutes: number): string {
  if (minutes < 10) return 'countdown-normal';
  if (minutes < 20) return 'countdown-warning';
  return 'countdown-urgent';
}

// ============================================================
// KDS TICKET CARD
// ============================================================
interface KDSTicketProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
}

export function KDSTicket({ order, onStatusChange }: KDSTicketProps) {
  const elapsed = useCountdown(order.ordered_at);
  const urgencyClass = getUrgencyClass(elapsed.minutes);

  const cartItems = order.cart_items as Array<{
    name: string;
    quantity: number;
    prep_time_minutes?: number;
  }>;

  const maxPrepTime = Math.max(0, ...cartItems.map(i => i.prep_time_minutes ?? 0));

  const nextStatus: Partial<Record<Order['status'], Order['status']>> = {
    pending: 'confirmed',
    confirmed: 'in_progress',
    in_progress: 'ready',
    ready: 'completed',
  };

  const nextStatusLabel: Partial<Record<Order['status'], string>> = {
    pending: 'Confirm',
    confirmed: 'Start',
    in_progress: 'Ready!',
    ready: 'Done',
  };

  return (
    <div className="kds-ticket animate-ticket-drop">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <User className="w-3 h-3 text-zinc-500" />
            <p className="text-sm font-semibold">{order.customer_name}</p>
          </div>
          <p className="text-xs text-zinc-500">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        {/* Elapsed timer */}
        <div className={`flex items-center gap-1 text-xs font-mono font-semibold ${urgencyClass}`}>
          <Clock className="w-3 h-3" />
          {elapsed.minutes}:{elapsed.seconds.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {cartItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {item.quantity}
            </span>
            <span className="text-zinc-200">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Prep time indicator */}
      {maxPrepTime > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-zinc-500">
          <Package className="w-3 h-3" />
          <span>Est. {maxPrepTime} min prep</span>
          {/* Progress bar */}
          <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden ml-1">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (elapsed.minutes / maxPrepTime) * 100)}%`,
                backgroundColor: elapsed.minutes > maxPrepTime ? '#ef4444' : undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-amber-400/80 italic mb-3 line-clamp-2">
          ⚠️ {order.notes}
        </p>
      )}

      {/* Status badge + action button */}
      <div className="flex items-center justify-between">
        <span className={`status-badge status-${order.status}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {order.status.replace('_', ' ')}
        </span>

        {nextStatus[order.status] && (
          <button
            onClick={() => onStatusChange(order.id, nextStatus[order.status]!)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-violet-600/20 hover:bg-violet-600/40 text-violet-300
                       border border-violet-500/30 hover:border-violet-400/50
                       transition-all duration-150 active:scale-95"
          >
            {nextStatusLabel[order.status]}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
