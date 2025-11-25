// src/components/NotificationSettings.jsx
import React, { useEffect } from 'react';
import useNotifications from '../hooks/useNotifications';
import { Button, Alert, CircularProgress } from '@mui/material';

function NotificationSettings() {
  const {
    notificationsEnabled,
    permissionState,
    loading,
    error,
    initializeNotifications,
    disableNotifications,
    canRequestPermission,
    onNotification
  } = useNotifications();

  useEffect(() => {
    // Escuchar notificaciones
    const unsubscribe = onNotification((payload) => {
      console.log('Nueva notificación:', payload);
      alert(`Notificación: ${payload.notification?.title}`);
    });

    return unsubscribe;
  }, [onNotification]);

  return (
    <div>
      <h2>Configuración de Notificaciones</h2>

      {/* Estado actual */}
      {notificationsEnabled ? (
        <Alert severity="success">✅ Notificaciones habilitadas</Alert>
      ) : (
        <Alert severity="warning">🔕 Notificaciones deshabilitadas</Alert>
      )}

      {/* Error */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Permiso denegado */}
      {permissionState === 'denied' && (
        <Alert severity="error">
          Permiso denegado. Habilita las notificaciones en la configuración del navegador.
        </Alert>
      )}

      {/* Botones */}
      {canRequestPermission() && !notificationsEnabled && (
        <Button 
          onClick={initializeNotifications} 
          disabled={loading}
          variant="contained"
        >
          {loading ? <CircularProgress size={20} /> : 'Habilitar Notificaciones'}
        </Button>
      )}

      {notificationsEnabled && (
        <Button onClick={disableNotifications} variant="outlined">
          Deshabilitar (Local)
        </Button>
      )}
    </div>
  );
}

export default NotificationSettings;