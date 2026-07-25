'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useOrdersStore } from '@/lib/store/orders';
import type { Order } from '@/types/database';

let audioCtxSingleton: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtxSingleton) {
    try {
      audioCtxSingleton = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtxSingleton;
}

async function playNewOrderChime() {
  try {
    const audio = new Audio('/sounds/new-order.mp3');
    audio.volume = 1.0;
    await audio.play();
  } catch {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') await ctx.resume();
      if (!ctx) return;

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(880, now, 0.4);
      playTone(660, now + 0.25, 0.5);
    } catch (err) {
      console.warn('[chime] Audio unavailable:', err);
    }
  }
}

export function useOrdersRealtime(tenantId: string | null) {
  const supabase = createBrowserClient();
  const { addOrder, updateOrder } = useOrdersStore();
  const isInitialized = useRef(false);

  const handleNewOrder = useCallback(async (order: Order) => {
    addOrder(order);
    await playNewOrderChime();

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [addOrder]);

  useEffect(() => {
    if (!tenantId) return;
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const channel = supabase
        .channel(`swiftkds:orders:${tenantId}`, {
          config: { broadcast: { self: false } },
        })
        .on<Order>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders_appointments',
            filter: `tenant_id=eq.${tenantId}`,
          },
          async (payload) => {
            console.log('[realtime] New order:', payload.new.id);
            await handleNewOrder(payload.new);
          }
        )
        .on<Order>(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders_appointments',
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            console.log('[realtime] Order updated:', payload.new.id, payload.new.status);
            updateOrder(payload.new);
          }
        )
        .subscribe();

      return () => {
        isInitialized.current = false;
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[realtime] Channel subscription deferred in preview mode:', err);
    }
  }, [tenantId, supabase, handleNewOrder, updateOrder]);
}

export function initAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch {
    // AudioContext not supported
  }
}
