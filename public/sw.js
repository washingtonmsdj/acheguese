/**
 * Service Worker - Push Notifications + Caching
 *
 * Handles:
 * - Push notifications
 * - Asset caching (Cache-First)
 * - API caching (Network-First)
 * - Image caching (Stale-While-Revalidate)
 * - Offline fallback
 *
 * @version 2.0.9
 */

const SW_VERSION = '2.0.9';
const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '::1';
const OFFLINE_FALLBACK_URL = '/offline.html';

const CACHE_NAMES = {
  static: `static-v${SW_VERSION}`,
  images: `images-v${SW_VERSION}`,
  api: `api-v${SW_VERSION}`,
  fonts: `fonts-v${SW_VERSION}`,
};

const CACHE_LIMITS = {
  images: 100,
  api: 50,
};

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  OFFLINE_FALLBACK_URL,
  '/offline.js',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/badge-72x72.png',
];

self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);

  if (IS_LOCALHOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);

  if (IS_LOCALHOST) {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
    return;
  }

  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !Object.values(CACHE_NAMES).includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const title = data.title || 'Nova Notificação';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      image: data.image,
      data: data.data || {},
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('[SW] Error processing push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
    const actionUrl = getActionUrl(event.action, event.notification.data);
    if (actionUrl) event.waitUntil(clients.openWindow(actionUrl));
    return;
  }

  const urlToOpen = getNotificationUrl(event.notification.data);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  const data = event.notification.data;
  if (data && data.trackDismissal) {
    console.log('[SW] Tracking dismissal for:', data);
  }
});

/**
 * Push payloads can outlive a product release. Messaging and Notifications are
 * horizontal platform capabilities and must remain reachable independently of
 * product verticals. Destinations owned by paused product modules fail closed
 * to the active Notifications inbox instead of reopening those modules.
 */
const PAUSED_NOTIFICATION_ROUTE_PATTERN =
  /^\/(?:community|comunidade|gastronomia|servicos|services|classificados|classifieds|pontos-turisticos|tourist-points|educacao|education|vagas|jobs|eventos|events|comunicacao|communication|mobility|mobilidade|track|cupons|coupons|ranking|gamificacao|gamification|analytics|alertas|achados-perdidos|achados-e-perdidos|problemas|planos|checkout)(?:\/|$)|^\/settings\/subscription(?:\/|$)/i;

function getLaunchSafeNotificationUrl(url, fallback = '/notificacoes') {
  if (!url) return fallback;
  const value = String(url);
  return PAUSED_NOTIFICATION_ROUTE_PATTERN.test(value) ? fallback : value;
}

function getNotificationUrl(data) {
  if (!data) return '/notificacoes';

  switch (data.type) {
    case 'message':
      return getLaunchSafeNotificationUrl(data.url, '/mensagens');

    case 'ride':
      return getLaunchSafeNotificationUrl('/mobilidade');

    case 'order':
      return getLaunchSafeNotificationUrl(
        `/gastronomia/pedidos/${data.orderId || ''}`
      );

    case 'payment':
      return getLaunchSafeNotificationUrl('/settings/subscription');

    case 'security':
      return '/conta/seguranca';

    case 'social':
    case 'system':
      return getLaunchSafeNotificationUrl(data.url);

    default:
      return getLaunchSafeNotificationUrl(data.url);
  }
}

function getActionUrl(action, data) {
  switch (action) {
    case 'view':
      return getNotificationUrl(data);

    case 'reply':
      return getLaunchSafeNotificationUrl(data?.url, '/mensagens');

    case 'accept':
      return getLaunchSafeNotificationUrl(data.acceptUrl);

    case 'decline':
      return getLaunchSafeNotificationUrl(data.declineUrl);

    case 'settings':
      return '/conta/notificacoes';

    default:
      return '/notificacoes';
  }
}

function sendMessageToClients(message) {
  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage(message);
      });
    });
}

self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  console.log('[SW] Syncing notifications...');
}

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  console.log('[SW] Checking for new notifications...');
}

console.log(`[SW ${SW_VERSION}] Loaded`);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (IS_LOCALHOST) return;
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.includes('/vite/dist/client/') ||
    request.destination === 'websocket'
  ) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  } else if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.images));
  } else if (isFont(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.fonts));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
  } else {
    event.respondWith(networkFirst(request, CACHE_NAMES.static));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  console.log('[SW] Cache miss, fetching:', request.url);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const offlineFallback = await caches.match(OFFLINE_FALLBACK_URL);
      if (offlineFallback) return offlineFallback;
    }

    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        limitCacheSize(cacheName, CACHE_LIMITS.images);
      }
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf)$/i.test(url.pathname);
}

function isImage(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i.test(url.pathname);
}

function isFont(url) {
  return /\.(woff2?|ttf|otf)$/i.test(url.pathname);
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('supabase.co') ||
         url.hostname.includes('supabase.in');
}

async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    console.log(`[SW] Cache ${cacheName} exceeded limit, cleaning up`);
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}
