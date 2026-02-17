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
  '/bevute.html',
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

// 🔔 PUSH - Ricevi notifiche
self.addEventListener('push', function(event) {
  console.log('🔔 Push ricevuto:', event);
  
  if (!event.data) {
    console.warn('Push senza dati');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('📦 Dati notifica:', data);
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.data?.tipo || 'default',
      requireInteraction: false,
      data: data.data,
      actions: [
        { action: 'open', title: '👀 Apri', icon: '/icon-192.png' },
        { action: 'close', title: '❌ Chiudi' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch(e) {
    console.error('Errore parsing notifica:', e);
  }
});

// 🖱️ CLICK su notifica
self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Click su notifica:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return; // Chiudi e basta
  }
  
  // Apri l'app
  const urlToOpen = new URL('/', self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUnattached: true })
      .then(windowClients => {
        // Se c'è già una finestra aperta, focusla
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Altrimenti apri nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
