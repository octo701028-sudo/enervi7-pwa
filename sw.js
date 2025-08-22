// Enervi7 PWA - Service Worker (自動加版本版)
// 每次部署會自動帶時間戳，避免卡在舊快取

const CACHE_NAME = 'enervi7-cache-' + new Date().getTime();  

const CORE_ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png'
];

// ============ Install ============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// ============ Activate ============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// ============ Fetch ============
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 對 app.js / style.css / index.html 自動加版本戳記
  if (req.url.endsWith('app.js') || req.url.endsWith('style.css') || req.url.endsWith('index.html')) {
    const newUrl = req.url + '?v=' + new Date().getTime();
    event.respondWith(fetch(newUrl).catch(() => caches.match(req)));
    return;
  }

  // 其他資源 → Cache First, Fallback to Network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => cached);
    })
  );
});