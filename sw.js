// Minimal service worker for caching app shell on GH Pages
const CACHE_NAME = 'myagent-shell-v1';
const FILES_TO_CACHE = [
'/agent-pwa/',
'/agent-pwa/index.html',
'/agent-pwa/manifest.json',
'/agent-pwa/icons/192.png',
'/agent-pwa/icons/512.png'
];


self.addEventListener('install', event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
);
self.skipWaiting();
});


self.addEventListener('activate', event => {
event.waitUntil(
caches.keys().then(keys => Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
))
);
self.clients.claim();
});


self.addEventListener('fetch', event => {
// network first for navigation requests, cache fallback for assets
if (event.request.mode === 'navigate') {
event.respondWith(
fetch(event.request).then(resp => {
const copy = resp.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
return resp;
}).catch(() => caches.match('/agent-pwa/index.html'))
);
return;
}


event.respondWith(
caches.match(event.request).then(cached => cached || fetch(event.request))
);
});