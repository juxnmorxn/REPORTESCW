const CACHE_NAME = 'isp-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // No interceptar directamente llamadas API
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Buscar coincidencia exacta en caché local
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // Si es navegación de ruta sin internet, entregar /dashboard o / de la caché
        if (event.request.mode === 'navigate') {
          const dashboardFallback = await caches.match('/dashboard');
          if (dashboardFallback) return dashboardFallback;
          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;
        }

        return new Response('Modo Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
