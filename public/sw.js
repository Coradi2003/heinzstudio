const CACHE_NAME = 'heinz-studio-v2';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo.jpeg'
];

// Instalação e Cache Inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de cache antigo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: NETWORK FIRST com fallback para CACHE e OFFLINE PAGE
self.addEventListener('fetch', (event) => {
  // Ignora requisições de extensões ou outros esquemas
  if (!event.request.url.startsWith('http')) return;

  // Se for uma navegação (mudar de página)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Para outros arquivos (images, scripts, etc)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a rede respondeu, clonamos e guardamos no cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta pegar do cache
        return caches.match(event.request);
      })
  );
});
