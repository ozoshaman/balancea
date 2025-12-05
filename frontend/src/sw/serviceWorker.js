/* eslint-disable no-restricted-globals */
// ============================================================================
// SERVICE WORKER UNIFICADO - BALANCEA PWA
// ============================================================================
// Versión: 2.1.0 - FIX: Timeout y SSE issues
// ============================================================================

// ============================
// IMPORTS
// ============================
importScripts('https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ============================
// CONFIGURACIÓN
// ============================
const CACHE_NAME = 'balancea-v2.1'; // ⚠️ Cambiar versión para limpiar cachés
const RUNTIME_CACHE = 'balancea-runtime-v2.1';
const API_CACHE = 'balancea-api-v2.1';
const API_BASE = 'http://localhost:5000/api';

// Estado global del SW
const swState = {
  isSyncingTransactions: false,
  isSyncingRecurrings: false,
  isDbReady: false,
  pendingAuthToken: '',
  lastSyncAttempt: 0,
  firebaseInitialized: false
};

// URLs a pre-cachear (App Shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ============================
// CONFIGURAR DEXIE
// ============================
const db = new Dexie('BalanceaDB');

function hasTable(name) {
  try {
    if (!db.isOpen()) return false;
    return Array.isArray(db.tables) && db.tables.some(t => t.name === name);
  } catch (e) {
    return false;
  }
}

async function ensureDbOpen() {
  if (!db.isOpen()) {
    try {
      console.log('[SW] 🔓 Abriendo IndexedDB...');
      await db.open();
      swState.isDbReady = true;
      console.log('[SW] ✅ IndexedDB abierto correctamente');
    } catch (error) {
      if (error.name === 'NoSuchDatabaseError') {
        console.warn('[SW] ⚠️ IndexedDB no existe aún (normal en primera carga)');
        swState.isDbReady = false;
        return false;
      }
      
      console.error('[SW] ❌ Error crítico abriendo IndexedDB:', error);
      swState.isDbReady = false;
      return false;
    }
  }
  return db.isOpen();
}

// ============================
// CONFIGURAR FIREBASE
// ============================
const firebaseConfig = {
  apiKey: "AIzaSyCLaLQ5e6oSQw5DdEvYXlZhUF9NncxKBVY",
  authDomain: "balancea-pwa.firebaseapp.com",
  projectId: "balancea-pwa",
  storageBucket: "balancea-pwa.firebasestorage.app",
  messagingSenderId: "622887469450",
  appId: "1:622887469450:web:9ccaf9be517fccb7de0873",
  measurementId: "G-GYK97PXRLY"
};

// Inicializar Firebase
try {
  if (!swState.firebaseInitialized) {
    firebase.initializeApp(firebaseConfig);
    swState.firebaseInitialized = true;
    console.log('[SW] 🔥 Firebase inicializado correctamente');
  }
} catch (e) {
  console.warn('[SW] ⚠️ Firebase ya inicializado o error:', e?.message || e);
}

const messaging = firebase.messaging();

// ============================
// FIREBASE MESSAGING HANDLERS
// ============================
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📬 Mensaje Firebase en background:', payload);

  const notificationTitle = payload.notification?.title || 'Balancea';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.notification?.tag || 'balancea-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/',
      action: payload.data?.action,
      ...payload.data
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================================================
// EVENTOS DEL SERVICE WORKER
// ============================================================================

// ============================
// INSTALL
// ============================
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Instalando Service Worker v2.1...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(PRECACHE_URLS);
        console.log('[SW] ✅ App Shell cacheado');
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] ❌ Error en instalación:', error);
      }
    })()
  );
});

// ============================
// ACTIVATE
// ============================
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔄 Activando Service Worker v2.1...');
  
  event.waitUntil(
    (async () => {
      // Limpiar cachés antiguos
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => 
            name !== CACHE_NAME && 
            name !== RUNTIME_CACHE && 
            name !== API_CACHE
          )
          .map(name => {
            console.log('[SW] 🗑️ Eliminando caché antigua:', name);
            return caches.delete(name);
          })
      );
      
      // Intentar inicializar IndexedDB
      try {
        await ensureDbOpen();
        console.log('[SW] ✅ IndexedDB inicializado en activate');
      } catch (error) {
        console.warn('[SW] ⚠️ IndexedDB no disponible en activate');
      }
      
      await self.clients.claim();
      console.log('[SW] ✅ Service Worker activado');
    })()
  );
});

// ============================
// FETCH: ESTRATEGIAS DE CACHÉ
// ============================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar métodos no-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar extensiones del navegador
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // ⚠️ CRÍTICO: NO interceptar Firebase ni Google APIs
  if (url.pathname.includes('firebase') || 
      url.pathname.includes('fcmtoken') || 
      url.pathname.includes('google') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com')) {
    return;
  }

  // ⚠️ FIX: NO interceptar SSE (Server-Sent Events)
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/event-stream') || 
      url.pathname.includes('/stream/')) {
    console.log('[SW] 🔴 SSE request, NO interceptando:', url.pathname);
    return;
  }

  // Cache First para assets estáticos
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(handleAssetRequest(request));
    return;
  }

  // Network First para API (con timeout aumentado)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Stale-While-Revalidate para navegación
  if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request));
    return;
  }

  // Por defecto: Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ============================
// HANDLERS DE FETCH
// ============================
async function handleAssetRequest(request) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    
    if (response.ok && !response.bodyUsed) {
      const cache = await caches.open(RUNTIME_CACHE);
      const cloned = response.clone();
      cache.put(request, cloned).catch(err => 
        console.warn('[SW] ⚠️ Error cacheando asset:', err)
      );
    }
    
    return response;
  } catch (error) {
    console.error('[SW] ❌ Error en asset:', error);
    
    if (request.destination === 'script') {
      return new Response('console.warn("offline");', { 
        headers: { 'Content-Type': 'application/javascript' } 
      });
    }
    
    if (request.destination === 'style') {
      return new Response('/* offline */', { 
        headers: { 'Content-Type': 'text/css' } 
      });
    }
    
    if (request.destination === 'image') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
        <rect width="100%" height="100%" fill="#eee"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="14">offline</text>
      </svg>`;
      return new Response(svg, { 
        headers: { 'Content-Type': 'image/svg+xml' } 
      });
    }
    
    return new Response('', { status: 408 });
  }
}

async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  console.log(`[SW] 🌐 API Request: ${url.pathname}`);
  
  try {
    // ⚠️ FIX: Aumentar timeout a 30 segundos y crear nuevo controller por request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[SW] ⏱️ Timeout alcanzado para: ${url.pathname}`);
      controller.abort();
    }, 30000);
    
    const response = await fetch(request, { 
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`[SW] ✅ API Response: ${url.pathname} - Status: ${response.status}`);
    
    // ⚠️ FIX: Solo cachear respuestas exitosas
    if (response.ok && response.status >= 200 && response.status < 300 && !response.bodyUsed) {
      const cache = await caches.open(API_CACHE);
      const cloned = response.clone();
      
      const contentLength = response.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 1024 * 1024) {
        cache.put(request, cloned).catch(err => 
          console.warn('[SW] ⚠️ Error cacheando API:', err)
        );
      }
    }
    
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[SW] ⏱️ Request abortado (timeout): ${url.pathname}`);
      
      try {
        console.log('[SW] 🔄 Reintentando sin timeout...');
        const retryResponse = await fetch(request);
        console.log('[SW] ✅ Retry exitoso');
        return retryResponse;
      } catch (retryError) {
        console.warn('[SW] ❌ Retry falló, usando caché');
      }
    } else {
      console.warn(`[SW] ⚠️ API offline: ${url.pathname} - Error: ${error.name}`);
    }
    
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] ✅ Sirviendo desde caché API');
      return cached;
    }
    
    if (url.pathname === '/api/transactions') {
      return await serveTransactionsFromIndexedDB();
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Sin conexión', 
        offline: true,
        message: 'No hay datos en caché',
        requestUrl: url.pathname
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleDocumentRequest(request) {
  try {
    const cached = await caches.match(request);
    
    const networkPromise = fetch(request)
      .then(async response => {
        if (response.ok && !response.bodyUsed) {
          const cache = await caches.open(CACHE_NAME);
          const cloned = response.clone();
          cache.put(request, cloned).catch(err => 
            console.warn('[SW] ⚠️ Error cacheando documento:', err)
          );
        }
        return response;
      })
      .catch(() => null);
    
    return cached || await networkPromise || await caches.match('/index.html');
  } catch (error) {
    console.error('[SW] ❌ Error en documento:', error);
    return caches.match('/offline.html');
  }
}

async function serveTransactionsFromIndexedDB() {
  try {
    const isOpen = await ensureDbOpen();
    
    if (!isOpen) {
      return new Response(
        JSON.stringify({ 
          error: 'Base de datos local no disponible',
          offline: true
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!hasTable('transactions')) {
      return new Response(
        JSON.stringify({ error: 'Tabla transactions no disponible', offline: true }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const transactions = await db.table('transactions').toArray();
    
    return new Response(
      JSON.stringify(transactions),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Served-From': 'IndexedDB'
        }
      }
    );
  } catch (error) {
    console.error('[SW] ❌ Error leyendo IndexedDB:', error);
    return new Response(
      JSON.stringify({ error: 'Error accediendo a datos locales', offline: true }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background Sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
  
  if (event.tag === 'sync-recurrings') {
    event.waitUntil(syncRecurrings());
  }

  if (event.tag === 'sync-fcm-token') {
    event.waitUntil(syncFCMToken());
  }
});

async function syncTransactions() {
  const now = Date.now();
  if (now - swState.lastSyncAttempt < 2000) {
    console.log('[SW] ⏰ Sync muy reciente, esperando...');
    return;
  }
  
  if (swState.isSyncingTransactions) {
    console.log('[SW] ⏸️ Sync ya en progreso');
    return;
  }

  swState.isSyncingTransactions = true;
  swState.lastSyncAttempt = now;

  try {
    const isOpen = await ensureDbOpen();
    if (!isOpen || !hasTable('pendingTransactions')) {
      await notifyClients({ type: 'SYNC_COMPLETE', synced: 0 });
      return;
    }

    if (hasTable('pendingCategories')) {
      const pendingCats = await db.table('pendingCategories')
        .where('status').notEqual('synced').count();
      
      if (pendingCats > 0) {
        await notifyClients({ type: 'SYNC_PENDING_CATEGORIES', pendingCategories: pendingCats });
        return;
      }
    }

    const pending = await db.table('pendingTransactions')
      .where('status').notEqual('synced').toArray();

    if (pending.length === 0) {
      await notifyClients({ type: 'SYNC_COMPLETE', synced: 0 });
      return;
    }

    let syncedCount = 0;
    let errorCount = 0;

    for (const tx of pending) {
      try {
        if (typeof tx.categoryId === 'string' && /^cat_temp_/.test(tx.categoryId)) {
          continue;
        }

        await db.table('pendingTransactions').update(tx.localId, { status: 'syncing' });
        const response = await syncSingleTransaction(tx);

        if (response.ok) {
          const body = await response.json();
          if (tx.action === 'CREATE' && body?.data && hasTable('transactions')) {
            await db.table('transactions').delete(tx.localId);
            await db.table('transactions').put(body.data);
          }
          await db.table('pendingTransactions').update(tx.localId, { status: 'synced' });
          syncedCount++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        const retries = (tx.retries || 0) + 1;
        await db.table('pendingTransactions').update(tx.localId, {
          status: 'error', retries, error: error.message
        });
        errorCount++;
      }
    }

    const synced = await db.table('pendingTransactions')
      .where('status').equals('synced').toArray();
    await db.table('pendingTransactions').bulkDelete(synced.map(t => t.localId));

    await notifyClients({ type: 'SYNC_COMPLETE', synced: syncedCount, errors: errorCount });
  } catch (error) {
    await notifyClients({ type: 'SYNC_ERROR', error: error.message });
  } finally {
    swState.isSyncingTransactions = false;
  }
}

async function syncSingleTransaction(tx) {
  const token = await getAuthToken();
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  switch (tx.action) {
    case 'CREATE':
      return fetch(`${API_BASE}/transactions`, {
        method: 'POST', headers,
        body: JSON.stringify({
          title: tx.title, type: tx.type, amount: tx.amount,
          date: tx.date, description: tx.description, categoryId: tx.categoryId
        })
      });
    case 'UPDATE':
      return fetch(`${API_BASE}/transactions/${tx.transactionId}`, {
        method: 'PUT', headers, body: JSON.stringify(tx)
      });
    case 'DELETE':
      return fetch(`${API_BASE}/transactions/${tx.transactionId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
    default:
      throw new Error(`Acción desconocida: ${tx.action}`);
  }
}

async function syncRecurrings() {
  if (swState.isSyncingRecurrings) return;
  swState.isSyncingRecurrings = true;

  try {
    const isOpen = await ensureDbOpen();
    if (!isOpen || !hasTable('pendingRecurrings')) {
      await notifyClients({ type: 'SYNC_COMPLETED_RECURRINGS', synced: 0 });
      return;
    }

    const pending = await db.table('pendingRecurrings')
      .where('status').notEqual('synced').toArray();

    if (pending.length === 0) {
      await notifyClients({ type: 'SYNC_COMPLETED_RECURRINGS', synced: 0 });
      return;
    }

    let synced = 0;
    let errors = 0;

    for (const r of pending) {
      try {
        await db.table('pendingRecurrings').update(r.localId, { status: 'syncing' });
        const response = await syncSingleRecurring(r);
        if (response.ok) {
          await db.table('pendingRecurrings').update(r.localId, { status: 'synced' });
          synced++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        const retries = (r.retries || 0) + 1;
        await db.table('pendingRecurrings').update(r.localId, { 
          status: 'error', retries, error: err.message 
        });
        errors++;
      }
    }

    const syncedItems = await db.table('pendingRecurrings')
      .where('status').equals('synced').toArray();
    await db.table('pendingRecurrings').bulkDelete(syncedItems.map(i => i.localId));

    await notifyClients({ type: 'SYNC_COMPLETED_RECURRINGS', synced, errors });
  } catch (error) {
    await notifyClients({ type: 'SYNC_ERROR_RECURRINGS', error: error.message });
  } finally {
    swState.isSyncingRecurrings = false;
  }
}

async function syncSingleRecurring(r) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Client-Request-Id': r.localId
  };

  switch (r.action) {
    case 'CREATE':
      return fetch(`${API_BASE}/recurring-transactions`, {
        method: 'POST', headers,
        body: JSON.stringify({
          title: r.title, type: r.type, amount: r.amount,
          description: r.description, categoryId: r.categoryId,
          frequencyValue: r.frequencyValue, frequencyUnit: r.frequencyUnit,
          startDate: r.startDate, endDate: r.endDate, notifyOnRun: r.notifyOnRun
        })
      });
    case 'UPDATE':
      return fetch(`${API_BASE}/recurring-transactions/${r.transactionId}`, {
        method: 'PUT', headers, body: JSON.stringify(r)
      });
    case 'DELETE':
      return fetch(`${API_BASE}/recurring-transactions/${r.transactionId}`, {
        method: 'DELETE', headers
      });
    default:
      throw new Error(`Acción desconocida: ${r.action}`);
  }
}

async function syncFCMToken() {
  console.log('[SW] 🔄 Sincronizando token FCM...');
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================

self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Balancea',
    body: 'Nueva notificación',
    icon: '/icons/icon-192x192.png'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.notification?.title || 'Balancea',
        body: data.notification?.body || 'Nueva notificación',
        icon: data.notification?.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data.data || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200],
      tag: 'balancea-notification',
      data: notificationData.data,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Cerrar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          for (let client of windowClients) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.postMessage({
                type: 'NOTIFICATION_CLICKED',
                url: urlToOpen,
                data: event.notification.data
              });
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ includeUncontrolled: true });
      allClients.forEach(client => 
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' })
      );
    })()
  );
});

// ============================================================================
// MENSAJES DEL CLIENTE
// ============================================================================

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data?.type === 'SAVE_AUTH_TOKEN') {
    swState.pendingAuthToken = event.data.token;
    if (hasTable('settings')) {
      db.table('settings')
        .put({ key: 'authToken', value: event.data.token })
        .catch(err => console.error('[SW] ❌ Error guardando token:', err));
    }
  }
});

// ============================================================================
// UTILIDADES
// ============================================================================

async function getAuthToken() {
  try {
    const isOpen = await ensureDbOpen();
    if (isOpen && hasTable('settings')) {
      const tokenData = await db.table('settings').get('authToken');
      return tokenData?.value || swState.pendingAuthToken || '';
    }
    return swState.pendingAuthToken || '';
  } catch (error) {
    return swState.pendingAuthToken || '';
  }
}

async function notifyClients(message) {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  allClients.forEach(client => client.postMessage(message));
}

// ============================================================================
console.log('[SW] ✅ Service Worker UNIFICADO v2.1 cargado correctamente');
console.log('[SW] 📦 Maneja: Caché + Sync + IndexedDB + Firebase Messaging');
// ============================================================================