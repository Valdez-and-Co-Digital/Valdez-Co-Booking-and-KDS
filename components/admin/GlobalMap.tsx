'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@/lib/supabase/client';

// Map container must be imported dynamically to prevent SSR issues with Leaflet window object
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// We need the CSS for Leaflet
import 'leaflet/dist/leaflet.css';

interface MapProps {
  tenants: any[];
}

export default function GlobalMap({ tenants }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[400px] w-full animate-pulse bg-white/5 rounded-xl"></div>;
  }

  const foodTrucks = tenants.filter(t => t.settings?.is_foodtruck && t.current_lat && t.current_lng);

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-white/10 glass-card">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of US
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#09090b' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {foodTrucks.map((truck) => (
          <CircleMarker
            key={truck.id}
            center={[truck.current_lat, truck.current_lng]}
            radius={6}
            pathOptions={{
              color: '#7c3aed',
              fillColor: '#7c3aed',
              fillOpacity: 0.8,
              weight: 2
            }}
          >
            <Popup className="dark-popup">
              <div className="text-sm font-semibold text-zinc-900">{truck.name}</div>
              <div className="text-xs text-zinc-600">Live Food Truck</div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Global CSS for the popup to match dark theme */}
      <style jsx global>{`
        .leaflet-container {
          background: #09090b !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(20, 20, 25, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 12px;
        }
        .leaflet-popup-tip {
          background: rgba(20, 20, 25, 0.9);
        }
        .dark-popup .text-zinc-900 {
          color: white;
        }
        .dark-popup .text-zinc-600 {
          color: #a1a1aa;
        }
      `}</style>
    </div>
  );
}
