// Service Worker for MyAgent PWA
const CACHE_NAME = 'myagent-v2'; // Changed version to force update
const PRECACHE_URLS = [
  '/agent-pwa/',
  '/agent-pwa/index.html',
  '/agent-pwa/manifest.json',
  '/agent-pwa/flutter_bootstrap.js', // Fixed: was flutter.js
  '/agent-pwa/favicon.png'
  // Don't precache icons as they might not exist yet
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .catch(err => {
        console.error('[SW] Precache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip Chrome extension requests
  if (event.request.url.includes('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request).then(response => {
          // Only cache successful responses (not 404s or errors)
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(err => {
          console.error('[SW] Fetch failed:', err);
          // Return a basic offline response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/agent-pwa/index.html');
          }
          throw err;
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});