import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// This declares the value of `injectionPoint` in the Serwist config
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// ============================================================
// Push Notification Handler
// ============================================================
// Push notification handler — typed with any to satisfy strict SW scope
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {
    title: '🔔 New Order — SwiftKDS',
    body: 'A new order has arrived.',
    url: '/dashboard/kds',
  };

  event.waitUntil(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200], // double pulse for mobile
      tag: 'new-order',         // replace previous notification of same type
      renotify: true,           // always vibrate even if tag matches
      data: { url: data.url ?? '/dashboard/kds' },
      actions: [
        { action: 'view', title: 'View KDS' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// ============================================================
// Notification Click Handler
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url ?? '/dashboard/kds';

  event.waitUntil(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((windowClients: any[]) => {
        // Focus existing window if available
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open new window
        return (self as any).clients.openWindow(targetUrl);
      })
  );
});

serwist.addEventListeners();
