/**
 * Service Worker - UK Anaesthetics CT1 & ST4 National Rotation & Commute Explorer
 * Provides offline resilience for hospital basements, theatres, and poor connectivity environments.
 */

const CACHE_PREFIX = 'st4-';
const CACHE_NAME = 'st4-explorer-v14';
const TILE_CACHE = 'st4-map-tiles';
const MAX_TILES = 1500;

const SAME_ORIGIN_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './data.js',
  './data-ct1.js',
  './manifest.json'
];

const EXTERNAL_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

let isTrimming = false;
async function trimCache(cacheName, maxItems) {
  if (isTrimming) return;
  isTrimming = true;
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      for (let i = 0; i < keys.length - maxItems; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (e) {
  } finally {
    isTrimming = false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(SAME_ORIGIN_ASSETS);
      await Promise.allSettled(
        EXTERNAL_ASSETS.map((assetUrl) => cache.add(assetUrl))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME && key !== TILE_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For OpenStreetMap and external tiles: Cache-first with bounded LRU trimming
  if (url.hostname.includes('tile.openstreetmap') || url.hostname.includes('hotosm.org')) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
                trimCache(TILE_CACHE, MAX_TILES);
              }
              return networkResponse;
            })
            .catch(() => cachedResponse || Response.error());
        });
      })
    );
    return;
  }

  // Only cache same-origin assets or unpkg libraries (never cache live geocoding API calls)
  if (url.origin !== self.location.origin && !url.hostname.includes('unpkg.com')) {
    return;
  }

  // Network-First (with 3.5s timeout and cache fallback) for core app shell assets (HTML, JS, CSS, data)
  const isCoreAsset = url.pathname.endsWith('index.html') ||
                      url.pathname.endsWith('data.js') ||
                      url.pathname.endsWith('data-ct1.js') ||
                      url.pathname.endsWith('js/app.js') ||
                      url.pathname.endsWith('/app.js') ||
                      url.pathname.endsWith('css/styles.css') ||
                      url.pathname.endsWith('styles.css') ||
                      url.pathname.endsWith('manifest.json') ||
                      url.pathname === '/' ||
                      url.pathname.endsWith('/');

  if (isCoreAsset) {
    event.respondWith(
      (async () => {
        let timeoutId;
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                return cache.put(event.request, resClone);
              }).catch(() => {});
            }
            return networkResponse;
          })
          .finally(() => {
            if (timeoutId !== undefined) {
              clearTimeout(timeoutId);
            }
          });

        const safeFetchPromise = fetchPromise.catch(() => null);

        try {
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('timeout')), 3500);
          });
          const networkResponse = await Promise.race([fetchPromise, timeoutPromise]);
          if (networkResponse) return networkResponse;
        } catch (err) {
          // Timeout or network error: fall back to cache below
        }

        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;

        const lateResponse = await safeFetchPromise;
        if (lateResponse) return lateResponse;

        return new Response('Offline - cached asset unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // Other assets (CSS, icons, vendor libraries): Stale-while-revalidate with cache fallback
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            caches.open(CACHE_NAME).then((cache) => {
              return cache.put(event.request, networkResponse.clone());
            }).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || Response.error());
      return cachedResponse || fetchPromise;
    })
  );
});
