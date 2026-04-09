// Service Worker minimal para permitir instalação como PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Apenas passa as requisições, necessário para o Chrome habilitar a instalação
});
