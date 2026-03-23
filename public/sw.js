const CACHE_NAME='zodibuddy-v44';
const CDN_ASSETS=[
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CDN_ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  const scope=new URL(self.registration.scope);
  const indexUrl=new URL('index.html',scope).href;
  if(e.request.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname===scope.pathname){
    e.respondWith(fetch(e.request).then(r=>{const cl=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cl));return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match(indexUrl))));
    return;
  }
  e.respondWith(caches.match(e.request).then(c=>{if(c)return c;return fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,cl));}return r;});}));
});
