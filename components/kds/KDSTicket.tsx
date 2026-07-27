'use client';

import { useState, useEffect, useRef } from 'react';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import type { Order } from '@/types/database';

// ── Countdown timer ───────────────────────────────────────────────
function useCountdown(startTime: string) {
  const [elapsed, setElapsed] = useState({ minutes: 0, seconds: 0, total: 0 });
  useEffect(() => {
    const update = () => {
      const start = new Date(startTime);
      const now = new Date();
      const totalSecs = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
      setElapsed({ minutes: Math.floor(totalSecs / 60), seconds: totalSecs % 60, total: totalSecs });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return elapsed;
}

// ── Dining label helper ───────────────────────────────────────────
function diningLabel(option?: string) {
  if (option === 'dine_in') return { text: 'DINE-IN', color: 'text-violet-400' };
  if (option === 'delivery') return { text: 'DELIVERY', color: 'text-amber-400' };
  return { text: 'TAKE-OUT', color: 'text-zinc-400' };
}

// ── Status transitions ────────────────────────────────────────────
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

// ── Props ─────────────────────────────────────────────────────────
interface KDSTicketProps {
  order: Order & { dining_option?: string; table_number?: string; source?: string };
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  warningMins?: number;
  overdueMins?: number;
  isMobile?: boolean;
  requireConfirmation?: boolean;
}

export function KDSTicket({ order, onStatusChange, warningMins = 15, overdueMins = 30, isMobile = false, requireConfirmation = false }: KDSTicketProps) {
  const isReady = order.status === 'ready';
  const elapsed = useCountdown(isReady ? (order as any).updated_at || order.ordered_at : order.ordered_at);

  const isUrgent  = elapsed.minutes >= overdueMins;
  const isWarning = !isUrgent && elapsed.minutes >= warningMins;

  const timerBg  = isUrgent ? 'bg-red-600' : isWarning ? 'bg-amber-600' : 'bg-zinc-800';
  const timerText = isUrgent || isWarning ? 'text-white' : 'text-white';

  const cartItems = (order.cart_items || []) as Array<{
    name: string;
    quantity: number;
    modifiers?: string[];
    notes?: string;
    prep_time_minutes?: number;
  }>;

  const dining = diningLabel((order as any).dining_option);
  const orderNum = `#${order.id.slice(0, 4).toUpperCase()}`;
  const source = (order as any).source || (order as any).dining_option === 'delivery' ? 'UBEREATS' : null;
  const tableNum = (order as any).table_number;

  const next = nextStatus[order.status];
  const nextLabel = nextStatusLabel[order.status];

  // ── Mobile card ─────────────────────────────────────────────────
  if (isMobile) {
    // When confirmation mode is on: confirmed = needs manual accept
    // When off: confirmed orders are auto-started, show as active
    const isPending = requireConfirmation && order.status === 'confirmed';
    const isCompleteAction = order.status === 'in_progress';
    const btnLabel =
      isPending                      ? 'ACCEPT ORDER' :
      order.status === 'confirmed'   ? 'COMPLETE' :
      order.status === 'in_progress' ? 'COMPLETE' :
      order.status === 'ready'       ? 'DONE ✓' : '';
    const btnColor = isPending
      ? 'bg-blue-600 hover:bg-blue-500 text-white'
      : isCompleteAction
        ? 'bg-violet-600 hover:bg-violet-500 text-white'
        : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200';

    return (
      <div className="bg-zinc-900 border border-white/8 rounded-2xl overflow-hidden">
        {/* Ticket header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${dining.color}`}>
                {dining.text}
                {tableNum && ` • TABLE ${tableNum}`}
                {source && ` • ${source}`}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-mono text-zinc-400">{orderNum}</span>
              <span className="font-bold text-white text-base">{order.customer_name}</span>
            </div>
          </div>
          {/* Timer badge */}
          <div className={`${timerBg} rounded-xl px-3 py-2 flex items-center justify-center min-w-[60px]`}>
            <span className={`font-mono font-bold text-sm ${timerText}`}>
              {String(elapsed.minutes).padStart(2, '0')}:{String(elapsed.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mx-4" />

        {/* Items */}
        <div className="px-4 py-3 space-y-2.5">
          {cartItems.map((item, i) => (
            <div key={i}>
              <div className="flex items-start gap-3">
                <span className="text-violet-400 font-bold text-sm w-6 text-right flex-shrink-0">{item.quantity}x</span>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{item.name}</p>
                  {item.modifiers?.map((mod, mi) => (
                    <p key={mi} className="text-xs text-zinc-400 mt-0.5">• {mod}</p>
                  ))}
                  {item.notes && <p className="text-xs text-amber-400 mt-0.5">• {item.notes}</p>}
                </div>
              </div>
            </div>
          ))}
          {order.notes && (
            <p className="text-xs text-amber-400/80 italic mt-1">⚠️ {order.notes}</p>
          )}
        </div>

        {/* COMPLETE button */}
        {next && (
          <button
            onClick={() => onStatusChange(order.id, next)}
            className={`w-full py-4 font-bold text-sm tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${btnColor}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {btnLabel}
          </button>
        )}
      </div>
    );
  }

  // ── Desktop card (unchanged visual style) ───────────────────────
  return (
    <div className="kds-ticket animate-ticket-drop">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold">{order.customer_name}</p>
          <p className="text-xs text-zinc-500">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            (order as any).dining_option === 'dine_in'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
          }`}>
            {(order as any).dining_option === 'dine_in' ? 'Dine-In' : 'Take-Out'}
          </span>
          <div className={`flex items-center gap-1 text-xs font-mono font-semibold ${
            isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {elapsed.minutes}:{String(elapsed.seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {cartItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{item.quantity}</span>
            <span className="text-zinc-200">{item.name}</span>
          </div>
        ))}
      </div>

      {order.notes && <p className="text-xs text-amber-400/80 italic mb-3 line-clamp-2">⚠️ {order.notes}</p>}

      {/* Action button */}
      <div className="flex items-center justify-between mt-1">
        <span className={`status-badge status-${order.status}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {order.status.replace('_', ' ')}
        </span>
        {next && (
          <button
            onClick={() => onStatusChange(order.id, next)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 hover:border-violet-400/50 transition-all active:scale-95"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}
