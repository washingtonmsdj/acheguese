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
 * @version 2.0.2
 */

// Service Worker version
const SW_VERSION = '2.0.2';
const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '::1';
const OFFLINE_FALLBACK_URL = '/offline.html';

// Cache names
const CACHE_NAMES = {
  static: `static-v${SW_VERSION}`,
  images: `images-v${SW_VERSION}`,
  api: `api-v${SW_VERSION}`,
  fonts: `fonts-v${SW_VERSION}`,
};

// Cache size limits (in items)
const CACHE_LIMITS = {
  images: 100,
  api: 50,
};

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  OFFLINE_FALLBACK_URL,
  '/offline.js',
  '/images/logo-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/badge-72x72.png',
];

// Install event
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

// Activate event
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
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete caches that don't match current version
              return !Object.values(CACHE_NAMES).includes(name);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Claim clients
      self.clients.claim(),
    ])
  );
});

// Push event
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

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Error processing push:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  // Handle action clicks
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
    
    // Handle specific actions
    const actionUrl = getActionUrl(event.action, event.notification.data);
    if (actionUrl) {
      event.waitUntil(
        clients.openWindow(actionUrl)
      );
    }
    return;
  }

  // Handle notification click (no action)
  const urlToOpen = getNotificationUrl(event.notification.data);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  // Track notification dismissal (optional)
  const data = event.notification.data;
  if (data && data.trackDismissal) {
    // Could send analytics here
    console.log('[SW] Tracking dismissal for:', data);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get URL for notification click based on notification data
 */
function getNotificationUrl(data) {
  if (!data) return '/';

  // Handle different notification types
  switch (data.type) {
    case 'message':
      return `/messages/${data.conversationId || ''}`;
    
    case 'ride':
      return `/mobility/track/${data.rideId || ''}`;
    
    case 'order':
      return `/orders/${data.orderId || ''}`;
    
    case 'payment':
      return '/settings/subscription';
    
    case 'security':
      return '/settings/sessions';
    
    case 'social':
      return data.url || '/notifications';
    
    case 'system':
      return data.url || '/notifications';
    
    default:
      return data.url || '/notifications';
  }
}

/**
 * Get URL for action click
 */
function getActionUrl(action, data) {
  switch (action) {
    case 'view':
      return getNotificationUrl(data);
    
    case 'reply':
      return `/messages/${data.conversationId || ''}`;
    
    case 'accept':
      return data.acceptUrl || '/';
    
    case 'decline':
      return data.declineUrl || '/';
    
    case 'settings':
      return '/settings/notifications';
    
    default:
      return '/';
  }
}

/**
 * Send message to all clients
 */
function sendMessageToClients(message) {
  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage(message);
      });
    });
}

// Background sync (optional - for offline support)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  console.log('[SW] Syncing notifications...');
  // Could fetch missed notifications here
}

// Periodic sync (optional - requires permission)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  console.log('[SW] Checking for new notifications...');
  // Could check for new notifications here
}

console.log(`[SW ${SW_VERSION}] Loaded`);

// ============================================================================
// FETCH HANDLER - CACHING STRATEGIES
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Never cache/intercept in local dev (avoids breaking Vite HMR/WebSocket)
  if (IS_LOCALHOST) {
    return;
  }

  // Never intercept third-party requests (ads, analytics, CDN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip Vite/HMR internals defensively
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.includes('/vite/dist/client/') ||
    request.destination === 'websocket'
  ) {
    return;
  }

  // Choose caching strategy based on request type
  if (isStaticAsset(url)) {
    // Cache-First for static assets (JS, CSS, fonts)
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  } else if (isImage(url)) {
    // Stale-While-Revalidate for images
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.images));
  } else if (isFont(url)) {
    // Cache-First for fonts
    event.respondWith(cacheFirst(request, CACHE_NAMES.fonts));
  } else if (isApiRequest(url)) {
    // Network-First for API requests
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
  } else {
    // Network-First for everything else
    event.respondWith(networkFirst(request, CACHE_NAMES.static));
  }
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache-First Strategy
 * Try cache first, fallback to network
 * Good for: Static assets that rarely change
 */
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
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-First Strategy
 * Try network first, fallback to cache
 * Good for: API requests, dynamic content
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    if (request.mode === 'navigate') {
      const offlineFallback = await caches.match(OFFLINE_FALLBACK_URL);

      if (offlineFallback) {
        return offlineFallback;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Return cached version immediately, update cache in background
 * Good for: Images, avatars, non-critical assets
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());

        // Enforce cache size limit
        limitCacheSize(cacheName, CACHE_LIMITS.images);
      }
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));

  // Return cached version immediately if available
  return cached || fetchPromise;
}

// ============================================================================
// HELPER FUNCTIONS - REQUEST TYPE DETECTION
// ============================================================================

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

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    console.log(`[SW] Cache ${cacheName} exceeded limit, cleaning up`);
    // Delete oldest entries (first in array)
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}
