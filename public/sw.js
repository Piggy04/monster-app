const CACHE_NAME = 'monster-v1';
const urlsToCache = [
  '/',
  '/collezione.html',
  '/amici.html',
  '/statistiche.html',
  '/attivita.html',
  '/impostazioni.html',
  '/admin.html',
  '/users.html',
  '/chi-siamo.html',
  '/style.css',
  '/config.js',
  '/theme.js',
  '/collezione.js',
  '/amici.js'
];

// Installazione - cache i file
self.addEventListener('install', event => {
  console.log('✅ SW: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache aperta');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Attivazione
self.addEventListener('activate', event => {
  console.log('✅ SW: Activate');
  event.waitUntil(
    clients.claim()
  );
});

// Fetch - cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
