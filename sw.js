// Türkçe Açıklama:
// Service Worker - PWA için offline çalışma ve cache yönetimi
// Bu dosya uygulamanın ana kaynaklarını cache'ler ve offline erişim sağlar

// Her sürüm için ayrı cache; sürüm artarsa eski cache otomatik silinir.
const CACHE_NAME = 'spendme-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

// Bu pattern'lere uyan istekler HİÇ cache'lenmez, her zaman network'ten okunur.
// version.json sürüm kontrolü için kritik — cache'lenirse kullanıcı eski
// sürümde takılır. JS bundle'lar hash'li isimlerde zaten deterministik ama
// index.html ve version.json mutlaka fresh olmalı.
const NO_CACHE_PATTERNS = [
  /version\.json/,
  /\/assets\/index-[^/]*\.js$/,
  /githubusercontent\.com/,
  /api\./,
  /supabase/,
];

const shouldBypassCache = (url) => NO_CACHE_PATTERNS.some(p => p.test(url));

// Service Worker kurulumu - cache'leme
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
  );
  // Hemen aktif et
  self.skipWaiting();
});

// Eski cache'leri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tüm client'ları kontrol et
  return self.clients.claim();
});

// Fetch stratejisi: Network First, Cache Fallback
// NO_CACHE_PATTERNS'a uyan istekler hiç cache'lenmez (version.json, bundle).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;

  // Bypass: version kontrolü, bundle, API — her zaman network
  if (shouldBypassCache(url)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() =>
        caches.match(event.request).then(r => r || Response.error())
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/');
        });
      })
  );
});

// Push bildirimleri için (gelecekte kullanılabilir)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni bildirim',
    icon: 'https://img.icons8.com/fluency/192/budget.png',
    badge: 'https://img.icons8.com/fluency/96/budget.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('SpendMe', options)
  );
});

