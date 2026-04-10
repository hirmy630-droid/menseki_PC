const CACHE_VERSION = 'ipad-touchfix1';
const CORE_CACHE = `area-calc-${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html?v=ipad-touchfix1',
  './manifest.json?v=ipad-touchfix1'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CORE_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Cross-origin libraries are left to the network.
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML navigation: network first, cached fallback.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CORE_CACHE);
        cache.put('./index.html?v=ipad-touchfix1', network.clone());
        return network;
      } catch (err) {
        return (await caches.match('./index.html?v=ipad-touchfix1')) || Response.error();
      }
    })());
    return;
  }

  // Same-origin static files: stale-while-revalidate.
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: false }) ||
                   await caches.match(url.pathname, { ignoreSearch: true });
    const fetchPromise = fetch(req).then(async (network) => {
      if (req.method === 'GET' && network && network.ok) {
        const cache = await caches.open(CORE_CACHE);
        cache.put(req, network.clone());
      }
      return network;
    }).catch(() => cached);

    return cached || fetchPromise || Response.error();
  })());
});
