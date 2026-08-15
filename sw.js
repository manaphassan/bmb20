/**
 * ==============================================================================
 * MEENA // TAKAHARA ACADEMY (高原学園) - SERVICE WORKER (PWA RUNTIME)
 * Offline Shell Caching, Background Sync, and Notification Dispatching
 * ==============================================================================
 */

const CACHE_NAME = 'meena-lcars-v3.3.4';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/settings',
  '/index.html',
  '/settings.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/config.js',
  '/assets/js/audio.js',
  '/assets/js/telemetry.js',
  '/assets/js/calendar.js',
  '/assets/js/globe.js',
  '/assets/js/layout-manager.js',
  '/assets/js/settings.js',
  '/assets/js/main.js',
  '/assets/js/routine-scheduler.js',
  '/assets/js/camera-recon.js',
  '/assets/images/screen.png'
];

// 1. Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first for JS, CSS, and dynamic API routes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always Network-First for APIs and JS assets
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.includes('action=')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
      })
    );
    return;
  }

  // Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Push Notification Event
self.addEventListener('push', (event) => {
  let data = { title: 'MEENA // Alert', body: 'New tactical notification received.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/images/screen.png',
    badge: '/assets/images/screen.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});
