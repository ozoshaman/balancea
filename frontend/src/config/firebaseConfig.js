// frontend/src/config/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ============================
// Configuración de Firebase
// ============================
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
// Los obtienes en: Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  
  // Verificar si el navegador soporta notificaciones
  if ('Notification' in window && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging inicializado');
  } else {
    console.warn('⚠️ Notificaciones no soportadas en este navegador');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
}

// ============================
// Funciones de Notificaciones
// ============================

/**
 * Solicitar permiso para notificaciones
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    console.log('Permiso de notificaciones:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Error solicitando permiso:', error);
    return false;
  }
};

/**
 * Obtener token FCM para el dispositivo
 * @param {string} vapidKey - VAPID Key del proyecto Firebase (Web Push certificates)
 */
export const getFCMToken = async (vapidKey) => {
  if (!messaging) {
    console.warn('Messaging no inicializado');
    return null;
  }

  try {
    // Verificar permiso
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    // Nota: dejamos que el SW PWA unificado maneje los mensajes en background.
    // No registrar aquí '/firebase-messaging-sw.js' para evitar conflictos de scope.
    // En su lugar, si existe un ServiceWorker controlando la página, pasamos
    // su `ServiceWorkerRegistration` a `getToken` para que no intente registrar uno nuevo.
    let swRegistration = null;
    try {
      if ('serviceWorker' in navigator) {
        // `navigator.serviceWorker.ready` resuelve cuando un SW controla la página
        swRegistration = await navigator.serviceWorker.ready.catch(() => null);
      }
    } catch (swErr) {
      console.warn('[firebaseConfig] No se pudo obtener serviceWorker.ready:', swErr?.message || swErr);
      swRegistration = null;
    }

    // Obtener token (si tenemos registration, lo pasamos; si no, SDK intentará lo que considere)
    const tokenOptions = {
      vapidKey: vapidKey || process.env.REACT_APP_FIREBASE_VAPID_KEY
    };

    if (swRegistration) {
      tokenOptions.serviceWorkerRegistration = swRegistration;
    }

    const token = await getToken(messaging, tokenOptions);

    if (token) {
      console.log('✅ Token FCM obtenido:', token.substring(0, 50) + '...');
      // Guardar token en localStorage para comparaciones futuras
      try { localStorage.setItem('fcmToken', token); } catch (e) { }
      return token;
    } else {
      console.log('No se pudo obtener token FCM');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error);
    return null;
  }
};

/**
 * Escuchar mensajes cuando la app está en primer plano
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.warn('Messaging no inicializado');
    return () => {};
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Mensaje recibido en primer plano:', payload);
      
      // Callback con los datos del mensaje
      if (callback) {
        callback(payload);
      }

      // Mostrar notificación del navegador
      if (payload.notification) {
        showNotification(
          payload.notification.title,
          payload.notification.body,
          payload.notification.icon
        );
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error configurando listener de mensajes:', error);
    return () => {};
  }
};

/**
 * Mostrar notificación del navegador
 */
const showNotification = (title, body, icon = '/icons/icon-192x192.png') => {
  if (!('Notification' in window)) {
    console.warn('Notificaciones no soportadas');
    return;
  }

  if (Notification.permission === 'granted') {
    const options = {
      body,
      icon,
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'balancea-notification',
      requireInteraction: false,
      data: {
        url: window.location.origin
      }
    };

    const notification = new Notification(title, options);

    notification.onclick = function(event) {
      event.preventDefault();
      window.focus();
      notification.close();
    };
  }
};

/**
 * Enviar token al backend
 */
export const sendTokenToServer = async (token) => {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { default: api } = await import('./axiosConfig');
    console.log('📤 Enviando token al servidor', { token: token?.substring(0,24) + '...' });

    const response = await api.post('/notifications/register-token', {
      token,
      platform: 'web'
    });

    console.log('✅ Token enviado al servidor:', response?.data);
    return true;
  } catch (error) {
    console.error('❌ Error enviando token al servidor:', error?.message || error, error?.data || 'no-data');
    return false;
  }
};

/**
 * Forzar refresco del token: obtener token actual y reenviarlo al servidor si cambió
 */
export const refreshFCMToken = async (vapidKey) => {
  try {
    const token = await getFCMToken(vapidKey);
    if (!token) return null;
    const previous = localStorage.getItem('fcmToken');
    if (previous !== token) {
      console.log('[firebaseConfig] Token cambiado o nuevo, reenviando al servidor');
      await sendTokenToServer(token);
    }
    return token;
  } catch (err) {
    console.error('Error en refreshFCMToken:', err);
    return null;
  }
};

/**
 * Eliminar token del servidor (cuando el usuario cierra sesión)
 */
export const removeTokenFromServer = async (token) => {
  try {
    const { default: api } = await import('./axiosConfig');
    console.log('📤 Solicitando eliminación de token al servidor', { token: token?.substring(0,24) + '...' });

    const resp = await api.post('/notifications/remove-token', { token });
    console.log('✅ Token eliminado del servidor', resp?.data);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando token:', error?.message || error, error?.data || 'no-data');
    return false;
  }
};

/**
 * Verificar si las notificaciones están habilitadas
 */
export const areNotificationsEnabled = () => {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

/**
 * Obtener estado del permiso de notificaciones
 */
export const getNotificationPermissionState = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'default', 'granted', 'denied'
};

// Exportar instancias
export { app, messaging };
export default firebaseConfig;