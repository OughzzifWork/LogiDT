// LogiTrack Service Worker - Production & Offline Support
const CACHE_NAME = 'logitrack-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache strategy:
// API requests (/api/*) are NETWORK ONLY or NETWORK FIRST (never stale critical logistics actions)
// Static assets (js, css, svg, images) are STALE-WHILE-REVALIDATE
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Non-GET requests (POST, PUT, DELETE) pass directly to network
  if (event.request.method !== 'GET') {
    return;
  }

  // Do not cache API requests in Service Worker (managed with live online/offline queue)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for HTML documents when offline
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
