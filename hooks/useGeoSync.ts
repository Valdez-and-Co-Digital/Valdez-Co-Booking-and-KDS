'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

const GEO_UPDATE_INTERVAL_MS = 60_000; // 60 seconds throttle

/** Checks if a food truck is considered "online" based on last heartbeat */
export function isTruckOnline(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  const ageMs = Date.now() - new Date(lastHeartbeat).getTime();
  return ageMs < 30 * 60 * 1000; // 30 minutes
}

/** Returns human-readable online status */
export function getTruckStatus(lastHeartbeat: string | null): {
  online: boolean;
  label: string;
  minutesAgo: number | null;
} {
  if (!lastHeartbeat) {
    return { online: false, label: 'Offline', minutesAgo: null };
  }
  const ageMs = Date.now() - new Date(lastHeartbeat).getTime();
  const minutesAgo = Math.floor(ageMs / 60000);

  if (ageMs < 30 * 60 * 1000) {
    return { online: true, label: minutesAgo < 2 ? 'Live' : `Updated ${minutesAgo}m ago`, minutesAgo };
  }
  return { online: false, label: `Offline (${minutesAgo}m ago)`, minutesAgo };
}

/**
 * Hook: Watches the device GPS and syncs location to Supabase every 60 seconds.
 * Throttled to avoid excessive DB writes and battery drain.
 *
 * Usage:
 * ```tsx
 * const { isTracking, error } = useGeoSync(tenantId, isLive);
 * ```
 */
export function useGeoSync(tenantId: string | null, isLive: boolean) {
  const supabase = createBrowserClient();
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const errorRef = useRef<string | null>(null);

  const updateLocation = useCallback(
    async (position: GeolocationPosition) => {
      const now = Date.now();
      // Throttle: only update if enough time has passed
      if (now - lastUpdateRef.current < GEO_UPDATE_INTERVAL_MS) return;
      lastUpdateRef.current = now;

      if (!tenantId) return;

      const { error } = await supabase
        .from('tenants')
        .update({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          last_heartbeat: new Date().toISOString(),
        })
        .eq('id', tenantId);

      if (error) {
        console.error('[geo-sync] Failed to update location:', error);
      } else {
        console.log('[geo-sync] Location updated:', {
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5),
        });
      }
    },
    [supabase, tenantId]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    errorRef.current = err.message;
    console.error('[geo-sync] Geolocation error:', err.message);
  }, []);

  useEffect(() => {
    if (!isLive || !tenantId) {
      // Clear watch when going offline
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        // Mark as offline in DB
        supabase
          .from('tenants')
          .update({ last_heartbeat: null })
          .eq('id', tenantId ?? '');
      }
      return;
    }

    if (!navigator.geolocation) {
      errorRef.current = 'Geolocation is not supported by this device';
      return;
    }

    // Get position immediately on go-live
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      timeout: 10_000,
    });

    // Then watch for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 30_000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isLive, tenantId, updateLocation, handleError, supabase]);

  return {
    isTracking: isLive && watchIdRef.current !== null,
    error: errorRef.current,
  };
}
