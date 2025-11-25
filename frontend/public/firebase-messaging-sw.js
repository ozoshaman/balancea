// public/firebase-messaging-sw.js
// Este archivo DEBE estar en la carpeta public/

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ============================
// Configuración de Firebase
// ============================
// IMPORTANTE: Usa las mismas credenciales que en firebaseConfig.js
const firebaseConfig = {
  apiKey: "AIzaSyCLaLQ5e6oSQw5DdEvYXlZhUF9NncxKBVY",
  authDomain: "balancea-pwa.firebaseapp.com",
  projectId: "balancea-pwa",
  storageBucket: "balancea-pwa.firebasestorage.app",
  messagingSenderId: "622887469450",
  appId: "1:622887469450:web:9ccaf9be517fccb7de0873",
  measurementId: "G-GYK97PXRLY"
};

// Obtener instancia de messaging
const messaging = firebase.messaging();

// ============================
// Manejar mensajes en segundo plano
// ============================
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

  // Personalizar notificación
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

  // Mostrar notificación
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================
// Manejar click en notificación
// ============================
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificación clickeada:', event);

  event.notification.close();

  // Abrir URL específica o app
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Verificar si ya hay una ventana abierta
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navegar a la URL y enfocar
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: urlToOpen,
              data: event.notification.data
            });
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================
// Sincronización personalizada
// ============================
self.addEventListener('sync', (event) => {
  console.log('[firebase-messaging-sw.js] Sync event:', event.tag);
  
  if (event.tag === 'sync-fcm-token') {
    event.waitUntil(syncFCMToken());
  }
});

async function syncFCMToken() {
  try {
    // Aquí puedes agregar lógica para re-sincronizar el token si es necesario
    console.log('Sincronizando token FCM...');
  } catch (error) {
    console.error('Error sincronizando token:', error);
  }
}

console.log('[firebase-messaging-sw.js] Service Worker cargado correctamente');