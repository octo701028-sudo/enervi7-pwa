// SW — auto-bust via ?v=timestamp
const VERSION=new URL(self.location).searchParams.get('v')||'v1';
const CACHE_NAME='enervi7-cache-'+VERSION;
const CORE=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>!k.includes(VERSION)).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{const req=e.request; e.respondWith((async()=>{try{const res=await fetch(req); if(req.method==='GET'&&res.status===200){const cache=await caches.open(CACHE_NAME); cache.put(req,res.clone());} return res;}catch(err){const cache=await caches.open(CACHE_NAME); const cached=await cache.match(req,{ignoreSearch:true}); if(cached) return cached; return new Response('Offline',{status:503});}})());});
