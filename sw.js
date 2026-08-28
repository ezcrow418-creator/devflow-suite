const CACHE_NAME = 'devflow-suite-v2';
const OFFLINE_URL = 'offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/manifest.json',
  '/js/app.js',
  '/js/tools.js',
  '/js/checkout.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/components/prism-core.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/plugins/autoloader/prism-autoloader.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/themes/prism.min.css',
  'https://cdn.jsdelivr.net/npm/marked/marked.umd.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
      .catch(() => caches.match('/index.html'))
  );
});
