// Versão do cache – altere este número a cada deploy
const CACHE_NAME = 'matriculas-v12';

// Arquivos estáticos que serão cacheados (apenas recursos locais)
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './fundos/default.png'
];

// Instalação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Ativa o novo SW imediatamente
});

// Ativação – limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // Assume controle das páginas
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 🔥 NUNCA cacheia chamadas à API do Google Scripts
  if (url.hostname === 'script.google.com') {
    return; // Deixa a requisição seguir normalmente (network only)
  }

  // Para outros recursos, tenta rede primeiro, cache como fallback
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
        // Se offline, tenta servir do cache
        return caches.match(event.request);
      })
  );
});
