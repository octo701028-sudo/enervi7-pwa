// Enervi7 PWA Service Worker — auto version
const VERSION = (new URL(self.location)).searchParams.get('v') || 'v1';
const CACHE_NAME = `enervi7-cache-${VERSION}`;
const CORE = [
  './',
  './index.html',
  './style.css',
  './app.js?v=' + VERSION,
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.includes(VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  event.respondWith((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      const res = await fetch(req);
      if (req.method === 'GET' && res.status === 200 && res.type !== 'opaque') {
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      if (req.headers.get('accept')?.includes('text/html')) {
        return new Response('<!doctype html><meta charset="utf-8"><title>離線</title><body><h3>目前離線</h3><p>請稍後重新整理。</p>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      return Response.error();
    }
  })());
});
