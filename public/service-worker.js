// Service Worker para Modo Offline
// Versão: 1.0.0

const CACHE_NAME = 'localconnect-v1';
const OFFLINE_CACHE = 'localconnect-offline-v1';
const CRITICAL_CACHE = 'localconnect-critical-v1';

// Recursos críticos que SEMPRE devem estar disponíveis offline
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico'
];

// Dados críticos que devem ser cacheados (números de emergência, avisos importantes)
const CRITICAL_DATA_ENDPOINTS = [
  '/api/emergency-contacts',
  '/api/important-alerts',
  '/api/building-info'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// =====================================================
// INSTALAÇÃO DO SERVICE WORKER
// =====================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache de recursos críticos
      caches.open(CRITICAL_CACHE).then((cache) => {
        console.log('[SW] Cacheando recursos críticos');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Pular espera e ativar imediatamente
      self.skipWaiting()
    ])
  );
});

// =====================================================
// ATIVAÇÃO DO SERVICE WORKER
// =====================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== CRITICAL_CACHE) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar controle de todas as páginas
      self.clients.claim()
    ])
  );
});

// =====================================================
// INTERCEPTAÇÃO DE REQUISIÇÕES
// =====================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de outros domínios (exceto Supabase)
  if (url.origin !== location.origin && !url.origin.includes('supabase.co')) {
    return;
  }

  // Estratégia baseada no tipo de recurso
  if (isCriticalData(url.pathname)) {
    // Dados críticos: Cache First (disponível offline)
    event.respondWith(cacheFirst(request));
  } else if (isStaticAsset(url.pathname)) {
    // Assets estáticos: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else if (isAPIRequest(url.pathname)) {
    // API: Network First com fallback
    event.respondWith(networkFirst(request));
  } else {
    // Páginas HTML: Network First
    event.respondWith(networkFirst(request));
  }
});

// =====================================================
// ESTRATÉGIAS DE CACHE
// =====================================================

// Network First: Tenta rede, fallback para cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cachear resposta bem-sucedida
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Rede falhou, buscando no cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se for navegação, retornar página offline
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // Retornar resposta offline genérica
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Você está offline. Alguns dados podem estar desatualizados.' 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

// Cache First: Busca no cache primeiro, fallback para rede
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Servindo do cache:', request.url);
    
    // Atualizar cache em background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(CRITICAL_CACHE).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    }).catch(() => {
      // Ignorar erros de rede em background
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CRITICAL_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Dados não disponíveis offline' 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

// Stale While Revalidate: Retorna cache imediatamente, atualiza em background
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  }).catch(() => {
    // Ignorar erros se já temos cache
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// =====================================================
// HELPERS
// =====================================================

function isCriticalData(pathname) {
  return CRITICAL_DATA_ENDPOINTS.some(endpoint => pathname.includes(endpoint));
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/.test(pathname);
}

function isAPIRequest(pathname) {
  return pathname.includes('/api/') || pathname.includes('supabase.co');
}

// =====================================================
// SINCRONIZAÇÃO EM BACKGROUND
// =====================================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Buscar dados pendentes do IndexedDB
    const db = await openDB();
    const pendingData = await db.getAll('pending-sync');
    
    // Enviar dados pendentes
    for (const item of pendingData) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        
        // Remover do IndexedDB após sucesso
        await db.delete('pending-sync', item.id);
      } catch (error) {
        console.error('[SW] Erro ao sincronizar:', error);
      }
    }
    
    console.log('[SW] Sincronização concluída');
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

// =====================================================
// MENSAGENS DO CLIENTE
// =====================================================
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_CRITICAL_DATA') {
    event.waitUntil(cacheCriticalData(event.data.data));
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function cacheCriticalData(data) {
  const cache = await caches.open(CRITICAL_CACHE);
  
  for (const [key, value] of Object.entries(data)) {
    const response = new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/offline-data/${key}`, response);
  }
  
  console.log('[SW] Dados críticos cacheados');
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] Todos os caches limpos');
}

// =====================================================
// INDEXEDDB HELPER
// =====================================================
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('localconnect-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-sync')) {
        db.createObjectStore('pending-sync', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('critical-data')) {
        db.createObjectStore('critical-data', { keyPath: 'key' });
      }
    };
  });
}

console.log('[SW] Service Worker carregado');
