// Enervi7 PWA SW v9
const CACHE_NAME = 'enervi7-cache-v9';
const CORE = [
  './',
  './index.html',
  './style.css',
  './app.js?v=v9',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreVary:true, ignoreSearch:false });
    if (cached) return cached;
    try{
      const res = await fetch(req);
      if (req.method === 'GET' && res.status === 200 && res.type !== 'opaque') {
        cache.put(req, res.clone());
      }
      return res;
    }catch(err){
      const offline = await cache.match('./index.html');
      return offline || Response.error();
    }
  })());
});