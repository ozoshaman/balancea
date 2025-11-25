// frontend/src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  sendTokenToServer,
  areNotificationsEnabled,
  getNotificationPermissionState
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