// sw.js — BUP PWA (patrón de MdT sw_v11.js)
// Se entrega como sw_bup_v1_1_0.js y se sube al repo "bup" renombrado a sw.js.
// Cache: bup-v1.1.0 — cambiar CACHE_NAME en cada versión nueva del index.
//
// Diferencia con MdT: la página (index.html) va "red primero" y usa la
// caché solo sin conexión. Como en el repo el archivo siempre se llama
// index.html, así una versión nueva se ve al recargar, sin quedar pegada
// a la vieja. Íconos y manifest siguen "caché primero", igual que MdT.

const CACHE_NAME = 'bup-v1.1.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/bup_icon.svg',
  './icons/bup_icon_32.png',
  './icons/bup_icon_192.png',
  './icons/bup_icon_512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Solo GET; nunca el GAS ni Google (datos siempre en vivo)
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('accounts.google.com')) return;
  if (e.request.url.includes('googleapis.com')) return;

  // Página: red primero, caché si no hay conexión
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(response => {
        const copia = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copia));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto: caché primero (igual que MdT)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, respClone));
        return response;
      });
    })
  );
});
