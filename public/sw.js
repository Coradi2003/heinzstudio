const CACHE_NAME = 'heinz-studio-v4';
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

// Estratégia de Fetch
self.addEventListener('fetch', (event) => {
  // 1. Ignora requisições que não sejam HTTP/S (extensões, etc)
  if (!event.request.url.startsWith('http')) return;

  // 2. IMPORTANTE: Só interceptamos requisições GET.
  // Se for POST, PUT, DELETE (salvar dados), o SW NÃO CHAMA event.respondWith.
  // Isso faz com que o navegador lide com a requisição de forma nativa e segura.
  if (event.request.method !== 'GET') return;

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
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Se a rede respondeu e for uma requisição GET válida, guardamos no cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
