const CACHE_NAME = 'matriculas-v3'; // 🔥 Aumente a versão (v3)

// Apenas arquivos essenciais que nunca bloqueiam a API
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './fundos/default.png'
];

// ============================
// INSTALAÇÃO
// ============================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // ativa imediatamente
});

// ============================
// ATIVAÇÃO – LIMPEZA TOTAL DE CACHES ANTIGOS
// ============================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // assume controle das páginas abertas
});

// ============================
// FETCH – NUNCA CACHEIA A API
// ============================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1️⃣ Ignora completamente requisições ao Google Scripts
  if (url.hostname === 'script.google.com') {
    return; // deixa o navegador buscar normalmente
  }

  // 2️⃣ Para outras requisições, tenta rede primeiro, cache depois
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Se for resposta válida, atualiza o cache em segundo plano
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Se falhar (offline), tenta o cache
        return caches.match(event.request);
      })
  );
});
