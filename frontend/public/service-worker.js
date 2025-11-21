/* eslint-disable no-restricted-globals */

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
  '/offline.html'
];

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
        // Activar inmediatamente sin esperar
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
        // Eliminar cachés antiguas
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
        // Tomar control inmediato de todas las páginas
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

  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requests a chrome-extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // ============================
  // ESTRATEGIA 1: Cache First para assets estáticos
  // ============================
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Cache HIT:', request.url);
            return cachedResponse;
          }

          // Si no está en caché, fetch y guardar
          return fetch(request)
            .then((response) => {
              // Solo cachear respuestas válidas
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
              console.error('[SW] Error en fetch de asset:', error);
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // ============================
  // ESTRATEGIA 2: Network First para API calls
  // ============================
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Guardar en caché para uso offline
          const responseToCache = response.clone();
          caches.open(API_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Si falla, intentar devolver desde caché
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[SW] Usando caché API offline:', request.url);
                return cachedResponse;
              }
              // Si no hay caché, devolver respuesta offline
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

  // ============================
  // ESTRATEGIA 3: Stale-While-Revalidate para navegación
  // ============================
  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Actualizar caché en segundo plano
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
              return networkResponse;
            })
            .catch(() => {
              // Si no hay red, devolver offline page
              return caches.match('/offline.html');
            });

          // Devolver caché inmediatamente si existe
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
// EVENTO: SYNC (Background Sync)
// ============================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Función para sincronizar transacciones pendientes
async function syncTransactions() {
  try {
    console.log('[SW] Sincronizando transacciones offline...');
    
    // Aquí irá la lógica de sincronización
    // Por ahora solo un placeholder
    const syncData = await self.clients.matchAll()
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            message: 'Transacciones sincronizadas'
          });
        });
      });
    
    return syncData;
  } catch (error) {
    console.error('[SW] Error en sincronización:', error);
    throw error;
  }
}

// ============================
// EVENTO: PUSH (Notificaciones)
// ============================
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Balancea',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'balancea-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Balancea', options)
  );
});

// ============================
// EVENTO: NOTIFICATION CLICK
// ============================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// ============================
// EVENTO: MESSAGE (Comunicación con el cliente)
// ============================
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});