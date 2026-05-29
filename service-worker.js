// Service Worker mínimo – não armazena nada em cache
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Apenas busca da rede, sem cache
  event.respondWith(fetch(event.request));
});
