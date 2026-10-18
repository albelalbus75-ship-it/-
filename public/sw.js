/* Service Worker - نظام الحوافز والمكافآت - مجموعة البحري */
const CACHE_NAME = 'albahri-incentives-pwa-v2';
const RUNTIME_CACHE = 'albahri-runtime-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icon.svg',
  '/icon-48x48.png',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-180x180.png',
  '/pwa-192x192.png',
  '/icon-384x384.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            // Ignore individual precache failures in dev environments
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Skip browser extensions or non-http schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip Vite HMR / internal dev websocket polls
  if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/__vite')) {
    return;
  }

  // 1. Navigation requests (HTML pages: login & main app) -> Network-First with Offline Fallback to '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) ||
            (await caches.match('/index.html')) ||
            (await caches.match('/'));
          return cached || Response.error();
        })
    );
    return;
  }

  // 2. Static icons, manifest & Google Fonts -> Cache-First with Network Fallback
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Refresh in background
          fetch(request)
            .then((netRes) => {
              if (netRes && netRes.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, netRes));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(request)
          .then((netRes) => {
            if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
              const copy = netRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return netRes;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // 3. JS, CSS & App Assets -> Network-First with Cache Fallback for speed and offline support
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return Response.error();
      })
  );
});

// Background Sync & Periodic Sync handlers for PWABuilder rich capabilities
self.addEventListener('sync', (event) => {
  if (event.tag === 'albahri-sync-data') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'albahri-periodic-sync') {
    event.waitUntil(Promise.resolve());
  }
});
