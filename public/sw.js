const CACHE_NAME = 'heinz-studio-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// O Chrome exige que haja um listener de fetch para habilitar o PWA
self.addEventListener('fetch', (event) => {
  // Por enquanto apenas servimos a requisição normal
  event.respondWith(fetch(event.request).catch(() => {
    // Fallback básico se estiver totalmente offline (opcional no futuro)
  }));
});
