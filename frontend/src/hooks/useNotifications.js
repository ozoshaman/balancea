// frontend/src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  sendTokenToServer,
  areNotificationsEnabled,
  getNotificationPermissionState,
  refreshFCMToken
} from '../config/firebaseConfig';

/**
 * Hook personalizado para manejar notificaciones push
 */
const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Inicializar notificaciones
  // ============================
  useEffect(() => {
    // Verificar estado inicial
    const enabled = areNotificationsEnabled();
    const state = getNotificationPermissionState();
    
    setNotificationsEnabled(enabled);
    setPermissionState(state);

    console.log('📬 Estado inicial de notificaciones:', { enabled, state });
  }, []);

  // ============================
  // Escuchar mensajes en primer plano
  // ============================
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📩 Mensaje recibido:', payload);
      
      // Emitir evento personalizado para que otros componentes lo escuchen
      window.dispatchEvent(new CustomEvent('fcmMessage', {
        detail: payload
      }));
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // ============================
  // Escuchar mensajes desde el Service Worker (ej: pushsubscriptionchange)
  // ============================
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = async (event) => {
      try {
        const data = event.data && event.data.type ? event.data : null;
        if (!data) return;
        if (data.type === 'PUSH_SUBSCRIPTION_CHANGED') {
          console.log('[useNotifications] SW notifica cambio de suscripción, refrescando token');
          try { await refreshFCMToken(); } catch (e) { console.warn('Error refrescando token por mensaje SW', e); }
        }
      } catch (e) { console.warn('Error manejando mensaje SW', e); }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => {
      try { navigator.serviceWorker.removeEventListener('message', handler); } catch (e) { }
    };
  }, []);

  // ============================
  // Solicitar permisos e inicializar
  // ============================
  const initializeNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Solicitar permiso
      const granted = await requestNotificationPermission();
      
      if (!granted) {
        setPermissionState('denied');
        setNotificationsEnabled(false);
        setError('Permiso de notificaciones denegado');
        setLoading(false);
        return { success: false, error: 'Permission denied' };
      }

      setPermissionState('granted');

      // 2. Obtener token FCM
      const token = await getFCMToken();
      
      if (!token) {
        setError('No se pudo obtener el token FCM');
        setLoading(false);
        return { success: false, error: 'Failed to get FCM token' };
      }

      setFcmToken(token);

      // 3. Enviar token al backend
      const sent = await sendTokenToServer(token);
      
      if (!sent) {
        console.warn('⚠️ No se pudo enviar el token al servidor');
      }

      // 4. Guardar en localStorage
      localStorage.setItem('fcmToken', token);

      setNotificationsEnabled(true);
      setLoading(false);

      // Programar refresco periódico del token (cada 6 horas)
      try {
        // Usar localStorage para persistir el id del interval dentro de la sesión
        const existing = localStorage.getItem('fcm_refresh_interval') ||
          (typeof window !== 'undefined' && window.__fcm_refresh_interval ? String(window.__fcm_refresh_interval) : null);
        if (!existing) {
          const iv = setInterval(async () => {
            console.log('[useNotifications] refrescando token FCM periódicamente');
            try {
              // Import dinamico para evitar ciclos
              const mod = await import('../config/firebaseConfig');
              if (mod && typeof mod.refreshFCMToken === 'function') {
                await mod.refreshFCMToken();
              }
            } catch (e) {
              console.warn('Error refrescando token FCM periódico', e?.message || e);
            }
          }, 1000 * 60 * 60 * 6); // 6 horas

          try {
            localStorage.setItem('fcm_refresh_interval', String(iv));
          } catch (err) {
            // Si no se puede escribir en localStorage, guardar en window para fallback
            // (no ideal, pero evita crear múltiples intervals en el mismo proceso)
            // eslint-disable-next-line no-undef
            if (typeof window !== 'undefined') window.__fcm_refresh_interval = iv;
          }
        }
      } catch (e) { console.warn('No se pudo programar refresco FCM', e); }

      console.log('✅ Notificaciones inicializadas correctamente');
      return { success: true, token };
    } catch (err) {
      console.error('❌ Error inicializando notificaciones:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // ============================
  // Deshabilitar notificaciones
  // ============================
  const disableNotifications = useCallback(() => {
    // No se puede revocar programáticamente el permiso
    // Solo limpiar estado local
    setFcmToken(null);
    setNotificationsEnabled(false);
    localStorage.removeItem('fcmToken');
    // Limpiar intervalo de refresco si existe
    try {
      const existing = localStorage.getItem('fcm_refresh_interval');
      if (existing) {
        clearInterval(Number(existing));
        localStorage.removeItem('fcm_refresh_interval');
      } else if (typeof window !== 'undefined' && window.__fcm_refresh_interval) {
        clearInterval(window.__fcm_refresh_interval);
        try { delete window.__fcm_refresh_interval; } catch (e) { window.__fcm_refresh_interval = null; }
      }
    } catch (e) {
      // ignore
    }

    console.log('🔕 Notificaciones deshabilitadas localmente');
  }, []);

  // ============================
  // Verificar si se puede solicitar permiso
  // ============================
  const canRequestPermission = useCallback(() => {
    return permissionState !== 'denied' && 
           'Notification' in window && 
           'serviceWorker' in navigator;
  }, [permissionState]);

  // ============================
  // Escuchar evento de notificación
  // ============================
  const onNotification = useCallback((callback) => {
    const handler = (event) => {
      callback(event.detail);
    };

    window.addEventListener('fcmMessage', handler);

    // Cleanup
    return () => {
      window.removeEventListener('fcmMessage', handler);
    };
  }, []);

  return {
    // Estado
    fcmToken,
    notificationsEnabled,
    permissionState,
    loading,
    error,

    // Acciones
    initializeNotifications,
    disableNotifications,
    canRequestPermission,
    onNotification
  };
};

export default useNotifications;