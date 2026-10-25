/* GAIA · service worker: abre rápido y funciona aunque la señal sea débil. Los datos siempre vienen del servidor. */
const CACHE = 'gaia-v5';
const SHELL = ['admin.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  // Páginas: primero la red (siempre la última versión); sin señal, la copia guardada.
  if (r.mode === 'navigate' || r.destination === 'document') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('admin.html'))));
    return;
  }
  // Íconos y archivos: la copia guardada y se actualiza por detrás.
  e.respondWith(caches.match(r).then(m => { const f = fetch(r).then(res => { caches.open(CACHE).then(k => k.put(r, res.clone())); return res; }).catch(() => m); return m || f; }));
});
