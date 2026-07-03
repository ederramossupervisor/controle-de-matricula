// service-worker.js (versão final definitiva)
const CACHE_NAME = 'matriculas-v2';

// Arquivos que serão pré-cacheados na instalação (apenas essenciais)
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './fundos/default.png'
];

// Instalação – ignora falhas em arquivos ausentes
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
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
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 🚫 NÃO intercepta requisições para domínios externos (CDNs, APIs, etc.)
  if (url.hostname !== 'ederramossupervisor.github.io') {
    return; // Deixa o navegador lidar normalmente
  }

  // 🚫 NUNCA cacheia chamadas ao Google Apps Script
  if (url.hostname === 'script.google.com') {
    return;
  }

  // Para recursos do nosso domínio, SEMPRE busca da rede (ignorando cache HTTP)
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
