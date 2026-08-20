const CACHE_NAME = 'olyushinvv-site-v20260621d';
const APP_SHELL = [
  '/',
  '/index.html',
  '/pages/education.html',
  '/pages/work-experience.html',
  '/pages/student-works.html',
  '/pages/achievements/index.html',
  '/pages/achievements/students.html',
  '/pages/achievements/teacher.html',
  '/assets/css/styles.css?v=20260626a',
  '/assets/js/main.js?v=20260626a',
  '/assets/img/favicon.ico',
  '/assets/img/portrait.jpg',
];

const CACHEABLE_EXTENSIONS = /\.(?:html?|css|js|mjs|json|ico|png|jpe?g|webp|gif|avif|svg|pdf|zip|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key === CACHE_NAME) return null;
          return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (!shouldCacheRequest(url, event.request)) return;

  event.respondWith(staleWhileRevalidate(event.request));
});

function shouldCacheRequest(url, request) {
  if (url.origin === self.location.origin) return true;
  if (CACHEABLE_EXTENSIONS.test(url.pathname)) return true;
  if (request.destination === 'style' || request.destination === 'script') return true;
  if (request.destination === 'image' || request.destination === 'font') return true;
  if (url.hostname === 'api.github.com') return true;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return true;
  return false;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || new Response('', { status: 504, statusText: 'Gateway Timeout' }));

  return cached || fetchPromise;
}

function isCacheableResponse(response) {
  return response && (response.ok || response.type === 'opaque');
}
