const CACHE_NAME = 'matriculas-v2'; // 🔥 aumente a versão a cada deploy

// Arquivos estáticos que podem ser cacheados com segurança
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  // ícones e imagens comuns
  './icons/icon-192.png',
  './fundos/default.png'
  // Não liste todos os JS aqui – eles serão cacheados sob demanda
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
// ATIVAÇÃO (limpa caches antigos)
// ============================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // assume controle das páginas abertas
});

// ============================
// INTERCEPTAÇÃO DE REQUISIÇÕES
// ============================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1️⃣ NUNCA cacheia chamadas à API do Google Scripts
  if (url.hostname === 'script.google.com') {
    // Apenas deixa a requisição seguir normalmente (network only)
    return;
  }

  // 2️⃣ Para arquivos estáticos (HTML, CSS, JS, imagens, fontes)
  //    usamos Cache First com atualização em segundo plano.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Atualiza o cache em segundo plano (stale-while-revalidate)
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);
        // Retorna imediatamente o cache
        return cachedResponse;
      }
      // Se não está em cache, busca da rede e armazena
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      });
    })
  );
});
