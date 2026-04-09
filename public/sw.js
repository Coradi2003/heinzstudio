const CACHE_NAME = 'heinz-studio-v5';
const OFFLINE_URL = '/offline.html';

// Só guardamos o que é 100% estático e necessário para o app abrir
const ASSETS_TO_CACHE = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo.jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

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

// ESTRATÉGIA DE REDE PURA PARA DADOS E PÁGINAS DINÂMICAS
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // Se for qualquer coisa que não seja GET (Salvar, Editar, Deletar), sai da frente.
  if (event.request.method !== 'GET') return;

  // Para navegação de páginas: SEMPRE REDE. 
  // Só mostra o 'offline.html' se a rede falhar de verdade.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Para outros arquivos (imagens do sistema, manifest, etc)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});
