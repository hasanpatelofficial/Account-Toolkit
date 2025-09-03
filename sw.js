// Final sw.js Code
const CACHE_NAME = 'accounts-toolkit-cache-v2'; // Version badal diya
const urlsToCache = [
  '/',
  'index.html',
  'style.css',      // Nayi file add ki
  'script.js',      // Nayi file add ki
  'ads.js',         // Nayi file add ki
  'manifest.json',  // Nayi file add ki
  'assets/icon.png',
  'assets/icon-512.png',
  'assets/click-sound.mp3'
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
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});