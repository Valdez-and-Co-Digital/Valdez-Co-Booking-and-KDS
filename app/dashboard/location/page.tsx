'use client';

import { useState } from 'react';
import { useGeoSync, getTruckStatus } from '@/hooks/useGeoSync';
import { FindUsMap } from '@/components/map/FindUsMap';
import { MapPin, Navigation, Signal, Radio } from 'lucide-react';

export default function LocationSyncPage() {
  const [isLive, setIsLive] = useState(true);
  const [tenantId] = useState('b0000000-0000-0000-0000-000000000002');
  const [mockHeartbeat] = useState(new Date().toISOString());

  const { isTracking, error } = useGeoSync(tenantId, isLive);
  const status = getTruckStatus(isLive ? mockHeartbeat : null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between glass-card p-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Food Truck Live Location</h1>
          <p className="text-sm text-zinc-400">Broadcast your real-time position to customers</p>
        </div>

        {/* Go Live Toggle */}
        <div className="flex items-center gap-3 bg-zinc-900/90 px-4 py-2.5 rounded-xl border border-white/10">
          <Radio className={`w-4 h-4 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="text-sm font-semibold">{isLive ? 'BROADCASTING LIVE' : 'OFFLINE'}</span>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              isLive ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isLive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Map Preview */}
      <FindUsMap
        latitude={30.2672}
        longitude={-97.7431}
        lastHeartbeat={isLive ? mockHeartbeat : null}
        tenantName="Tacos El Rey (Live Food Truck)"
      />
    </div>
  );
}
