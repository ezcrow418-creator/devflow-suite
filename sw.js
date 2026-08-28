/* =============================================
   DevFlow Suite — Service Worker v4
   Stale-while-revalidate · Background sync
   Stratified caching · Offline support
   ============================================= */

// ── Cache names (stratified) ────────────
const CACHE_STATIC  = 'devflow-static-v4';   // Local assets (JS, CSS, HTML)
const CACHE_CDN     = 'devflow-cdn-v4';      // CDN libraries (Tailwind, Prism, etc.)
const CACHE_DYNAMIC = 'devflow-dynamic-v4';   // Runtime fetched resources
const CACHE_IMAGES  = 'devflow-images-v4';    // Images and large assets

// ── URLs to pre-cache (install time) ────
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/manifest.json',
  '/js/db.js',
  '/js/app.js',
  '/js/templates.js',
  '/js/tools.js',
  '/js/checkout.js',
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/components/prism-core.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/plugins/autoloader/prism-autoloader.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/themes/prism.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/themes/prism-dark.min.css',
  'https://cdn.jsdelivr.net/npm/marked/marked.umd.min.js',
];

// ── Max cache sizes ─────────────────────
const MAX_DYNAMIC = 60;
const MAX_IMAGES  = 30;

// ── CDN domains (for stale-while-revalidate) ──
const CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];


// ═══════════════════════════════════════════
//  INSTALL
// ═══════════════════════════════════════════
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS)),
      caches.open(CACHE_CDN).then(c => c.addAll(CDN_ASSETS)),
    ]).then(() => self.skipWaiting())
  );
});


// ═══════════════════════════════════════════
//  ACTIVATE — clean old caches
// ═══════════════════════════════════════════
self.addEventListener('activate', (event) => {
  const validCaches = new Set([CACHE_STATIC, CACHE_CDN, CACHE_DYNAMIC, CACHE_IMAGES]);
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => !validCaches.has(n)).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});


// ═══════════════════════════════════════════
//  FETCH — stratified caching strategies
// ═══════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // ── Strategy 1: Navigation → Network-first with offline fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Strategy 2: CDN assets → Stale-while-revalidate ──
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_CDN));
    return;
  }

  // ── Strategy 3: Local static assets → Cache-first ──
  if (url.origin === self.location.origin) {
    // Images → image cache
    if (/\.(png|jpg|jpeg|gif|ico|svg|webp|pdf)$/i.test(url.pathname)) {
      event.respondWith(cacheFirst(request, CACHE_IMAGES));
      return;
    }
    // JS/CSS/HTML → static cache
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // ── Strategy 4: Everything else → Stale-while-revalidate ──
  event.respondWith(staleWhileRevalidate(request, CACHE_DYNAMIC));
});


// ═══════════════════════════════════════════
//  STRATEGIES
// ═══════════════════════════════════════════

// ── Cache-first: serve from cache, fallback to network ──
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      trimCache(cacheName, cacheName === CACHE_IMAGES ? MAX_IMAGES : MAX_DYNAMIC);
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ── Stale-while-revalidate: serve cache, update in background ──
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(async (response) => {
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
      trimCache(cacheName, MAX_DYNAMIC);
    }
    return response;
  }).catch(() => cached); // If network fails, return cached

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// ── Network-first: try network, fallback to cache ──
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
}

// ── Trim cache to max size (FIFO) ──
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest entries
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}


// ═══════════════════════════════════════════
//  BACKGROUND SYNC
// ═══════════════════════════════════════════
const SYNC_QUEUE = 'devflow-sync-queue';

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-snippets') {
    event.waitUntil(syncSnippets());
  }
});

self.addEventListener('message', (event) => {
  // Queue action for background sync
  if (event.data && event.data.type === 'QUEUE_SYNC') {
    event.waitUntil(queueForSync(event.data.payload));
  }

  // Force cache update
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function queueForSync(payload) {
  const cache = await caches.open(SYNC_QUEUE);
  const id = Date.now().toString();
  await cache.put(
    new Request(`sync-${id}`),
    new Response(JSON.stringify({ id, ...payload }), {
      headers: { 'Content-Type': 'application/json' }
    })
  );

  // Register for background sync if available
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-snippets');
  }
}

async function syncSnippets() {
  const cache = await caches.open(SYNC_QUEUE);
  const keys = await cache.keys();

  for (const key of keys) {
    try {
      const response = await cache.match(key);
      const data = await response.json();

      // Notify all clients that sync is happening
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_SNIPPET',
          payload: data
        });
      });

      // Remove from queue
      await cache.delete(key);
    } catch (e) {
      console.warn('[SW] Sync failed for:', key, e);
    }
  }
}


// ═══════════════════════════════════════════
//  NOTIFICATION — offline/online status
// ═══════════════════════════════════════════
self.addEventListener('online', () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(c => c.postMessage({ type: 'OFFLINE_STATUS', online: true }));
  });
});

self.addEventListener('offline', () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(c => c.postMessage({ type: 'OFFLINE_STATUS', online: false }));
  });
});
