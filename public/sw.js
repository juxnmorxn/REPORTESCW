const CACHE_NAME = 'isp-pwa-v3';
const ASSETS_TO_PRECACHE = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/favicon.ico',
];

// 1. Evento Install: Pre-guardar las rutas críticas inmediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('⚡ [SW] Precachando archivos principales de la PWA...');
      try {
        await cache.addAll(ASSETS_TO_PRECACHE);
      } catch (err) {
        console.warn('⚡ [SW] Pre-caching parcial completado');
      }
    })
  );
  self.skipWaiting();
});

// 2. Evento Activate: Limpiar cachés antiguas inmediatamente y tomar control de los clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('⚡ [SW] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Evento Fetch: Estrategia Caché Primero para Assets Estáticos y Red con Caída Instantánea a Caché para Navegación (Cold Start)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar API en vivo para no interferir con la cola offline
  if (url.pathname.startsWith('/api/')) return;

  // ESTRATEGIA 1: Archivos estáticos de Next.js (_next/static/*, imágenes, fuentes, CSS, JS) -> CACHÉ PRIMERO INSTANTÁNEO
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // ESTRATEGIA 2: Navegación de Páginas (/dashboard, /login, etc.) -> INTENTAR RED PERO CAER INSTANTÁNEAMENTE A CACHÉ SI NO HAY SEÑAL O AL ARRANCAR FRÍO
  if (event.request.mode === 'navigate' || url.pathname === '/dashboard') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(async () => {
          console.warn('⚡ [SW] Sin conexión o arranque en frío offline. Sirviendo shell desde caché local...');
          
          // Intentar coincidencia exacta (/dashboard)
          const cachedDashboard = await caches.match('/dashboard');
          if (cachedDashboard) return cachedDashboard;

          // Intentar coincidencia con la petición exacta
          const cachedExact = await caches.match(event.request);
          if (cachedExact) return cachedExact;

          // Intentar coincidencia con raíz /
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;

          return new Response('PWA Modo Offline Activo', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // ESTRATEGIA 3: Genérica Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
