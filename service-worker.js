// service-worker.js (versão final otimizada)
const CACHE_NAME = 'matriculas-v1';

// Arquivos que serão pré-cacheados na instalação
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
    caches.open(CACHE_NAME).then(cache => {
      // Tenta adicionar cada arquivo, mas ignora os que falharem
      return Promise.allSettled(
        urlsToCache.map(url =>
          cache.add(url).catch(err => {
            console.warn('Falha ao cachear (será ignorado):', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
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

  // 🔥 NUNCA cacheia chamadas ao Google Apps Script
  if (url.hostname === 'script.google.com') {
    return; // Deixa a requisição seguir normalmente (network only)
  }

  // Para outros recursos, SEMPRE tenta a rede primeiro (ignorando cache HTTP)
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then(networkResponse => {
        // Se a resposta for válida, atualiza o cache em segundo plano
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Se offline, serve do cache (fallback)
        return caches.match(event.request);
      })
  );
});
