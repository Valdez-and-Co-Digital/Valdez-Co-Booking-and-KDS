import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SwiftKDS — Valdez & Co.',
    short_name: 'SwiftKDS',
    description: 'Kitchen Display System & Smart Booking Dashboard',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0f0f11',
    theme_color: '#7c3aed',
    orientation: 'any',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable' as const,
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any' as const,
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable' as const,
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any' as const,
      },
    ],
    shortcuts: [
      {
        name: 'KDS Board',
        short_name: 'KDS',
        description: 'Open the Kitchen Display System',
        url: '/dashboard/kds',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Quick Charge',
        short_name: 'Charge',
        description: 'Process a quick payment',
        url: '/dashboard/quick-charge',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
    ],
  };
}
