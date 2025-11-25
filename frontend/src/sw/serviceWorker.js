/* eslint-disable no-restricted-globals */
/* Importar Dexie para usar IndexedDB en Service Worker */
importScripts('https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js');

// Nombre de la caché y versión
const CACHE_NAME = 'balancea-v1';
const RUNTIME_CACHE = 'balancea-runtime-v1';
const API_CACHE = 'balancea-api-v1';

// URLs a cachear durante la instalación (App Shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ============================
// Configurar Dexie en Service Worker
// ============================
const db = new Dexie('BalanceaDB');
// NOTE: Do not declare schema version inside the Service Worker. The main app
// manages the IndexedDB schema (via `frontend/src/services/indexedDB/db.js`).
// Declaring a different `version()` here can cause VersionError when the
// native DB version differs. We rely on the app to have created the needed
// object stores; SW operations handle missing stores gracefully via try/catch.

// ============================
// EVENTO: INSTALL
// ============================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-cacheando App Shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Instalación completa');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error en instalación:', error);
      })
  );
});

// ============================
// EVENTO: ACTIVATE
// ============================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME && 
                     name !== RUNTIME_CACHE && 
                     name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Eliminando caché antigua:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activado');
        return self.clients.claim();
      })
  );
});

// ============================
// EVENTO: FETCH
// ============================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Cache First para assets estáticos
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return response;
            })
            .catch((error) => {
              console.error('[SW] Error en fetch de asset:', request.url, error);
              // Fallback según tipo de recurso para evitar servir HTML en lugar de JS/CSS
              if (request.destination === 'script') {
                return new Response('/* offline */', { headers: { 'Content-Type': 'application/javascript' } });
              }

              if (request.destination === 'style') {
                return new Response('/* offline */', { headers: { 'Content-Type': 'text/css' } });
              }

              if (request.destination === 'image') {
                // Devolver un SVG inline como placeholder
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="14">offline</text></svg>`;
                return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
              }

              if (request.destination === 'font') {
                return new Response('', { headers: { 'Content-Type': 'font/woff2' } });
              }

              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Network First para API calls con fallback a IndexedDB
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(API_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[SW] Usando caché API offline:', request.url);
                return cachedResponse;
              }
              
              // Si es GET de transacciones, intentar servir desde IndexedDB
              if (url.pathname === '/api/transactions') {
                return serveTransactionsFromIndexedDB();
              }

              return new Response(
                JSON.stringify({ 
                  error: 'Sin conexión', 
                  offline: true 
                }),
                {
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Stale-While-Revalidate para navegación
  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
              return networkResponse;
            })
            .catch((err) => {
              console.error('[SW] Error fetching document:', request.url, err);
              // Si falló la red, intentar devolver index.html (app shell) desde cache
              return caches.match('/index.html')
                .then((indexCached) => indexCached || caches.match('/offline.html'));
            });

          return cachedResponse || fetchPromise;
        })
    );
    return;
  }

  // Por defecto: Network First
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// ============================
// Servir transacciones desde IndexedDB
// ============================
async function serveTransactionsFromIndexedDB() {
  try {
    const transactions = await db.table('transactions').toArray();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: transactions,
        offline: true,
        message: 'Datos servidos desde IndexedDB'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[SW] Error leyendo IndexedDB:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error accediendo a datos locales',
        offline: true 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}

// ============================
// EVENTO: SYNC (Background Sync)
// ============================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
  
  if (event.tag === 'sync-categories') {
    event.waitUntil(syncCategories());
  }
});

// ============================
// Sincronizar transacciones pendientes
// ============================
async function syncTransactions() {
  try {
    console.log('[SW] 🔄 Sincronizando transacciones offline...');
    // Asegurarse de que la instancia Dexie esté abierta (puede cerrarse si otra conexión pidió upgrade)
    try {
      if (!db.isOpen()) {
        console.log('[SW] Dexie cerrado, reabriendo la base de datos...');
        await db.open();
      }
    } catch (openErr) {
      console.error('[SW] Error reabriendo IndexedDB:', openErr);
      throw openErr;
    }
    
    // Obtener transacciones pendientes
    const pending = await db.table('pendingTransactions')
      .where('status')
      .notEqual('synced')
      .toArray();

    if (pending.length === 0) {
      console.log('[SW] ✅ No hay transacciones pendientes');
      notifyClients({ type: 'SYNC_COMPLETE', synced: 0 });
      return;
    }

    console.log(`[SW] 📤 Sincronizando ${pending.length} transacciones...`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const tx of pending) {
      try {
        // Marcar como sincronizando
          await db.table('pendingTransactions').update(tx.localId, { status: 'syncing' });

        let response;
        const apiUrl = self.location.origin + '/api';

        switch (tx.action) {
          case 'CREATE':
            response = await fetch(`${apiUrl}/transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
              },
              body: JSON.stringify({
                title: tx.title,
                type: tx.type,
                amount: tx.amount,
                date: tx.date,
                description: tx.description,
                categoryId: tx.categoryId
              })
            });
            break;

          case 'UPDATE':
            response = await fetch(`${apiUrl}/transactions/${tx.transactionId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
              },
              body: JSON.stringify({
                title: tx.title,
                type: tx.type,
                amount: tx.amount,
                date: tx.date,
                description: tx.description,
                categoryId: tx.categoryId
              })
            });
            break;

          case 'DELETE':
            response = await fetch(`${apiUrl}/transactions/${tx.transactionId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${await getAuthToken()}`
              }
            });
            break;

          default:
            throw new Error(`Acción desconocida: ${tx.action}`);
        }

        if (response.ok) {
          // Marcar como sincronizada
          await db.pendingTransactions.update(tx.localId, { status: 'synced' });
          syncedCount++;
          console.log(`[SW] ✅ Transacción sincronizada: ${tx.localId}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`[SW] ❌ Error sincronizando ${tx.localId}:`, error);
        
        // Incrementar contador de reintentos
        const retries = (tx.retries || 0) + 1;
              await db.table('pendingTransactions').update(tx.localId, {
                status: 'error',
                retries,
                error: error.message
              });
        
        errorCount++;
      }
    }

    console.log(`[SW] ✅ Sincronización completada: ${syncedCount} exitosas, ${errorCount} errores`);

    // Notificar a los clientes
    notifyClients({
      type: 'SYNC_COMPLETE',
      synced: syncedCount,
      errors: errorCount
    });

  } catch (error) {
    console.error('[SW] ❌ Error general en sincronización:', error);
    notifyClients({ type: 'SYNC_ERROR', error: error.message });
  }
}

  // ============================
  // Sincronizar categorías pendientes
  // ============================
  async function syncCategories() {
    try {
      console.log('[SW] 🔄 Sincronizando categorías offline...');

      try {
        if (!db.isOpen()) {
          console.log('[SW] Dexie cerrado, reabriendo la base de datos...');
          await db.open();
        }
      } catch (openErr) {
        console.error('[SW] Error reabriendo IndexedDB:', openErr);
        throw openErr;
      }

      const pending = await db.table('pendingCategories')
        .where('status')
        .notEqual('synced')
        .toArray();

      if (!pending || pending.length === 0) {
        console.log('[SW] ✅ No hay categorías pendientes');
        notifyClients({ type: 'SYNC_COMPLETE_CATEGORIES', synced: 0 });
        return;
      }

      console.log(`[SW] 📤 Sincronizando ${pending.length} categorías...`);

      let syncedCount = 0;
      let errorCount = 0;

      const apiUrl = self.location.origin + '/api';

      for (const pc of pending) {
        try {
          await db.table('pendingCategories').update(pc.localId, { status: 'syncing' });

          const response = await fetch(`${apiUrl}/categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({ name: pc.name, color: pc.color, icon: pc.icon })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const body = await response.json();
          const created = body?.data;

          if (created) {
            await db.table('categories').put(created);

            // Reconciliar transacciones locales que usen la categoría temporal
            try {
              const txs = await db.table('transactions').where('categoryId').equals(pc.localId).toArray();
              for (const t of txs) {
                await db.table('transactions').update(t.id, { categoryId: created.id });
              }

              const pendingTxs = await db.table('pendingTransactions').where('categoryId').equals(pc.localId).toArray();
              for (const pt of pendingTxs) {
                await db.table('pendingTransactions').update(pt.localId, { categoryId: created.id });
              }
            } catch (mapErr) {
              console.warn('[SW] Warning reconciling txs to new category:', mapErr);
            }

            await db.table('pendingCategories').update(pc.localId, { status: 'synced', serverId: created.id });
            syncedCount++;
          } else {
            throw new Error('No se recibió categoría creada del servidor');
          }
        } catch (error) {
          console.error(`[SW] ❌ Error sincronizando categoría ${pc.localId}:`, error);
          const retries = (pc.retries || 0) + 1;
          await db.pendingCategories.update(pc.localId, { status: 'error', retries, error: error.message });
          errorCount++;
        }
      }

      // Limpiar categorías sincronizadas
      try {
      const synced = await db.table('pendingCategories').where('status').equals('synced').toArray();
      await db.table('pendingCategories').bulkDelete(synced.map(c => c.localId));
    } catch (cleanErr) {
      console.warn('[SW] Error limpiando pendingCategories:', cleanErr);
    }

      console.log(`[SW] ✅ Sincronización categorías completada: ${syncedCount} exitosas, ${errorCount} errores`);
      notifyClients({ type: 'SYNC_COMPLETE_CATEGORIES', synced: syncedCount, errors: errorCount });
    } catch (error) {
      console.error('[SW] ❌ Error en syncCategories:', error);
      notifyClients({ type: 'SYNC_ERROR_CATEGORIES', error: error.message });
    }
  }

// ============================
// Obtener token de autenticación
// ============================
async function getAuthToken() {
  try {
    // El token se guarda en localStorage, que no está accesible desde SW
    // Alternativa: usar IndexedDB para guardar el token
      const tokenSetting = await db.table('settings').get('authToken');
    return tokenSetting?.value || '';
  } catch (error) {
    console.error('[SW] Error obteniendo token:', error);
    return '';
  }
}

// ============================
// Notificar a todos los clientes
// ============================
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

// ============================
// EVENTO: PUSH (Notificaciones)
// ============================
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Push recibido:', event);
  
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
        body: data.notification?.body || data.body || 'Nueva notificación',
        icon: data.notification?.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data.data || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    tag: 'balancea-notification',
    requireInteraction: false,
    data: notificationData.data,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// ============================
// EVENTO: NOTIFICATION CLICK
// ============================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notificación clickeada:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          for (let client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
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

// ============================
// EVENTO: MESSAGE
// ============================
self.addEventListener('message', (event) => {
  console.log('[SW] 💬 Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  // Guardar token de autenticación para uso en sincronización
  if (event.data && event.data.type === 'SAVE_AUTH_TOKEN') {
      db.table('settings').put({ key: 'authToken', value: event.data.token })
      .then(() => console.log('[SW] Token guardado'))
      .catch((err) => console.error('[SW] Error guardando token:', err));
  }
});

console.log('[SW] ✅ Service Worker con Dexie cargado');