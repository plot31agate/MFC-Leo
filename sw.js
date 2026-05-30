// Simple offline cache for the app shell. Bump CACHE when files change.
const CACHE = 'mfc-leo-v12';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.webmanifest',
  './data/plan.json',
  './icons/icon.svg',
  './icons/crest.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/util.js',
  './js/plan.js',
  './js/storage.js',
  './js/ics.js',
  './js/views/components.js',
  './js/views/diagrams.js',
  './js/views/nudges.js',
  './js/views/proteinbar.js',
  './js/views/today.js',
  './js/views/plan.js',
  './js/views/progress.js',
  './js/views/reference.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;

  if (sameOrigin) {
    // Network-first: always try the latest deploy, fall back to cache offline.
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Cross-origin (e.g. Google Fonts): cache-first.
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
