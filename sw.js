// Basic Service Worker for offline caching
const CACHE_NAME = 'accounts-toolkit-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Yahan aap apni doosri files (CSS, JS) bhi jod sakte hain agar woh alag hain
  '/assets/icon.png',
  '/assets/icon-512.png',
  '/assets/click-sound.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});