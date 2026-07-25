'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation2, Clock } from 'lucide-react';
import { getTruckStatus } from '@/hooks/useGeoSync';

// Leaflet must be dynamically imported (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

interface FindUsMapProps {
  latitude: number | null;
  longitude: number | null;
  lastHeartbeat: string | null;
  tenantName: string;
  brandColor?: string;
}

/** Converts lat/lng to a human-readable address using OpenStreetMap Nominatim */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'SwiftKDS/1.0 (support@swiftkds.com)' } }
    );
    const data = await res.json();
    // Build street-level address: "123 Main St, Austin, TX"
    const parts = [
      data.address?.house_number,
      data.address?.road,
      data.address?.city || data.address?.town || data.address?.village,
      data.address?.state,
    ].filter(Boolean);
    return parts.join(', ');
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export function FindUsMap({
  latitude, longitude, lastHeartbeat, tenantName, brandColor = '#7c3aed',
}: FindUsMapProps) {
  const [address, setAddress] = useState<string>('Locating…');
  const [mapLoaded, setMapLoaded] = useState(false);
  const status = getTruckStatus(lastHeartbeat);

  useEffect(() => {
    if (latitude && longitude) {
      reverseGeocode(latitude, longitude).then(setAddress);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    // Import Leaflet CSS client-side only
    import('leaflet/dist/leaflet.css').catch(() => {});
    setMapLoaded(true);
  }, []);

  if (!latitude || !longitude) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
        <MapPin className="w-10 h-10 text-zinc-600" />
        <p className="font-display font-semibold text-lg">{tenantName}</p>
        <p className="text-sm text-zinc-500">Location not available yet.</p>
        <p className="text-xs text-zinc-600">The truck hasn't gone live today.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Status header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${status.online ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}
          />
          <p className="font-display font-semibold text-sm">{tenantName}</p>
          <span className={`text-xs ${status.online ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock className="w-3 h-3" />
          {status.minutesAgo !== null ? `${status.minutesAgo}m ago` : 'Never'}
        </div>
      </div>

      {/* Address */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
        <Navigation2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <p className="text-sm text-zinc-300 truncate">📍 {address}</p>
      </div>

      {/* Map */}
      <div className="h-64 md:h-80">
        {mapLoaded && (
          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
            />
            <Marker position={[latitude, longitude]}>
              <Popup>
                <div className="text-sm font-semibold">{tenantName}</div>
                <div className="text-xs text-gray-500">{address}</div>
              </Popup>
            </Marker>
          </MapContainer>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 text-xs text-center powered-by border-t border-white/5">
        Find us on the map — Powered by <a href="https://swiftkds.com">SwiftKDS</a>,
        a Valdez & Co. product
      </div>
    </div>
  );
}
