
const CACHE='enervi7-pwa-brand-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./maskable-512.png',
'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;800&display=swap'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin===location.origin){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))} 
  else {e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(net=>{caches.open(CACHE).then(c=>c.put(e.request,net.clone()));return net}).catch(()=>caches.match(e.request))))}
});
