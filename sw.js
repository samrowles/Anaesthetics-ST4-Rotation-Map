/**
 * Legacy Service Worker Cleanup Stub
 * Clears obsolete caches for this retired path and unregisters itself.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = ['st4-explorer-v14', 'st4-map-tiles'];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('st4-') && !keep.includes(k))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});
