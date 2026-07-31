// Vangcur service worker — section 37 (37-pwa-service-worker.html).
//
// NOTE for the owner: only the *registration* script (navigator.serviceWorker
// .register('/sw.js')) was ever captured in the legacy HTML exports — sw.js
// itself is a separate static file that lived outside index.html, so none of
// the 42 sections contained its actual contents. This is a fresh, conservative
// implementation (network-first, same-origin GET only, small cache) rather
// than a port of lost code. Replace/extend it once real requirements
// (offline product browsing, etc.) are decided.

const CACHE_NAME = 'vangcur-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only same-origin GET requests — never intercept Supabase/Google Apps
  // Script calls or POSTs (orders, leads, etc. must always hit the network).
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
