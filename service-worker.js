const CACHE_NAME = 'matriculas-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './fundos/default.png',
  './fundos/CEEFMTI_Afonso_Cláudio.png',
  './fundos/CEEFMTI_Elisa_Paiva.png',
  './fundos/EEEF_Ivana_Casagrande_Scabelo.png',
  './fundos/EEEF_Severino_Paste.png',
  './fundos/EEEFM_Alto_Rio_Possmoser.png',
  './fundos/EEEFM_Álvaro_Castelo.png',
  './fundos/EEEFM_Domingos_Perim.png',
  './fundos/EEEFM_Elvira_Barros.png',
  './fundos/EEEFM_Fazenda_Camporês.png',
  './fundos/EEEFM_Fazenda_Emílio_Schroeder.png',
  './fundos/EEEFM_Fioravante_Caliman.png',
  './fundos/EEEFM_Frederico_Boldt.png',
  './fundos/EEEFM_Gisela_Salloker_Fayet.png',
  './fundos/EEEFM_Graça_Aranha.png',
  './fundos/EEEFM_Joaquim_Caetano_de_Paiva.png',
  './fundos/EEEFM_José_Cupertino.png',
  './fundos/EEEFM_José_Giestas.png',
  './fundos/EEEFM_José_Roberto_Christo.png',
  './fundos/EEEFM_Leogildo_Severiano_de_Souza.png',
  './fundos/EEEFM_Luiz_Jouffroy.png',
  './fundos/EEEFM_Maria_de_Abreu_Alvim.png',
  './fundos/EEEFM_Mário_Bergamin.png',
  './fundos/EEEFM_Marlene_Brandão.png',
  './fundos/EEEFM_Pedra_Azul.png',
  './fundos/EEEFM_Ponto_do_Alto.png',
  './fundos/EEEFM_Prof_Hermman_Berger.png',
  './fundos/EEEFM_Profª_Aldy_Soares_Merçon_Vargas.png',
  './fundos/EEEFM_São_Jorge.png',
  './fundos/EEEFM_São_Luís.png',
  './fundos/EEEFM_Teófilo_Paulino.png',
  './fundos/EEEM_Francisco_Guilherme.png',
  './fundos/EEEM_Mata_Fria.png',
  './fundos/EEEM_Sobreiro.png'
];

// Instala o service worker e armazena os arquivos no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Ativa e remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Intercepta requisições: tenta buscar da rede, se falhar usa o cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
