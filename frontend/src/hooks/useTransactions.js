// frontend/src/hooks/useTransactions.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import db from '../services/db';
import syncService from '../services/syncService';
import api from '../config/axiosConfig';

/**
 * Hook personalizado para gestionar transacciones con soporte offline
 */
const useTransactions = () => {
  const { user } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ============================
  // Cargar transacciones
  // ============================
  const loadTransactions = useCallback(async (filters = {}) => {
    if (!user?.id) {
      console.warn('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Online: Obtener del servidor y cachear
        const response = await api.get('/transactions', { params: filters });

        // El backend devuelve { transactions, total } dentro de response.data.data
        let serverPayload = response?.data?.data;
        let serverTransactions = [];

        if (!serverPayload) {
          serverTransactions = [];
        } else if (Array.isArray(serverPayload)) {
          // Caso legacy: el endpoint devolvía directamente un array
          serverTransactions = serverPayload;
        } else if (serverPayload.transactions && Array.isArray(serverPayload.transactions)) {
          serverTransactions = serverPayload.transactions;
        } else {
          // Si viene un objeto inesperado, intentar convertir a array si tiene propiedad data/rows
          serverTransactions = serverPayload.data || serverPayload.rows || [];
        }

        // Guardar en IndexedDB (logueo defensivo para depuración)
        try {
          console.log('Guardando transacciones del servidor en IndexedDB. Count:', Array.isArray(serverTransactions) ? serverTransactions.length : 'no-array');
          if (Array.isArray(serverTransactions) && serverTransactions.length > 0) {
            console.log('Ejemplo transacción:', serverTransactions[0]);
          }
          if (Array.isArray(serverTransactions) && serverTransactions.length > 0) {
            await db.saveTransactions(serverTransactions);
          }
        } catch (dbErr) {
          console.error('Error al guardar transacciones en IndexedDB (capturado en hook):', dbErr);
        }

        // Filtrar las que no están eliminadas localmente
        const localPending = await db.getPendingTransactions(user.id);
        const deletedIds = localPending
          .filter(tx => tx.action === 'DELETE')
          .map(tx => tx.transactionId);

        const filteredTransactions = serverTransactions.filter(
          tx => !deletedIds.includes(tx.id)
        );

        setTransactions(filteredTransactions);
      } else {
        // Offline: Cargar desde IndexedDB
        const localTransactions = filters && Object.keys(filters).length > 0
          ? await db.getFilteredTransactions(user.id, filters)
          : await db.getUserTransactions(user.id);

        // Filtrar eliminadas y pendientes
        const filtered = localTransactions.filter(tx => !tx.isDeleted);
        setTransactions(filtered);
      }
    } catch (err) {
      console.error('Error cargando transacciones:', err);
      
      // Si falla online, intentar cargar desde IndexedDB
      if (isOnline) {
        try {
          const localTransactions = await db.getUserTransactions(user.id);
          setTransactions(localTransactions.filter(tx => !tx.isDeleted));
          setError('No se pudieron cargar las transacciones del servidor. Mostrando datos locales.');
        } catch (localErr) {
          setError('Error cargando transacciones');
        }
      } else {
        setError('No hay conexión y no hay datos locales');
      }
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  // ============================
  // Actualizar contador de pendientes
  // ============================
  const updatePendingCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await syncService.getPendingCount(user.id);
      setPendingCount(count);
    } catch (err) {
      console.error('Error actualizando contador pendientes:', err);
    }
  }, [user]);

  // ============================
  // Sincronizar manualmente
  // ============================
  const syncTransactions = useCallback(async () => {
    if (!user?.id) {
      console.warn('Usuario no autenticado');
      return { success: false };
    }

    if (!isOnline) {
      console.warn('Sin conexión');
      return { success: false, message: 'No internet connection' };
    }

    setSyncing(true);

    try {
      const result = await syncService.syncPendingTransactions(user.id);
      
      if (result.success) {
        await loadTransactions();
        await updatePendingCount();
      }

      return result;
    } finally {
      setSyncing(false);
    }
  }, [user, isOnline, loadTransactions, updatePendingCount]);

  // ============================
  // Detectar cambios de conexión
  // ============================
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      setIsOnline(true);
      
      // Intentar sincronizar automáticamente
      if (user?.id) {
        // First sync pending categories, then transactions to resolve temp IDs
        (async () => {
          try {
            await syncService.syncPendingCategories(user.id);
          } catch (e) {
            console.warn('Error sincronizando categorías al reconectar:', e);
          }

          try {
            await syncTransactions();
          } catch (e) {
            console.warn('Error sincronizando transacciones al reconectar:', e);
          }
        })();
      }
    };

    const handleOffline = () => {
      console.log('📡 Sin conexión');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, syncTransactions]);

  // ============================
  // Escuchar eventos de sincronización
  // ============================
  useEffect(() => {
    const unsubscribe = syncService.onSyncStateChange((event) => {
      console.log('📡 Evento de sincronización:', event);

      switch (event.type) {
        case 'SYNC_STARTED':
          setSyncing(true);
          break;

        case 'SYNC_COMPLETED':
          setSyncing(false);
          if (user?.id) {
            loadTransactions();
            updatePendingCount();
          }
          break;

        case 'SYNC_ERROR':
          setSyncing(false);
          setError(event.error);
          break;

        case 'SYNC_STARTED_CATEGORIES':
          setSyncing(true);
          break;

        case 'SYNC_COMPLETED_CATEGORIES':
          setSyncing(false);
          // After categories are synced, attempt to sync transactions so temp IDs get resolved
          if (user?.id && isOnline) {
            syncTransactions();
          }
          break;

        case 'SYNC_ERROR_CATEGORIES':
          setSyncing(false);
          setError(event.error);
          break;

        case 'TRANSACTION_CREATED':
        case 'TRANSACTION_CREATED_OFFLINE':
        case 'TRANSACTION_UPDATED':
        case 'TRANSACTION_UPDATED_OFFLINE':
          if (user?.id) {
            loadTransactions();
            updatePendingCount();
          }
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, [user, loadTransactions, updatePendingCount, isOnline, syncTransactions]);

  // ============================
  // Cargar al montar y cuando cambie el usuario
  // ============================
  useEffect(() => {
    if (user?.id) {
      loadTransactions();
      updatePendingCount();
    }
  }, [user, loadTransactions, updatePendingCount]);

  // ============================
  // Crear transacción
  // ============================
  const createTransaction = useCallback(async (transactionData) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const result = await syncService.createTransaction(transactionData, user.id);

      if (result.success) {
        // Actualizar lista local inmediatamente
        setTransactions(prev => [result.data, ...prev]);
        
        if (result.offline) {
          await updatePendingCount();
        }
      }

      return result;
    } catch (err) {
      console.error('Error creando transacción:', err);
      throw err;
    }
  }, [user, updatePendingCount]);

  // ============================
  // Actualizar transacción
  // ============================
  const updateTransaction = useCallback(async (transactionId, updateData) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const result = await syncService.updateTransaction(
        transactionId,
        updateData,
        user.id
      );

      if (result.success) {
        // Actualizar en lista local
        setTransactions(prev =>
          prev.map(tx => (tx.id === transactionId ? result.data : tx))
        );

        if (result.offline) {
          await updatePendingCount();
        }
      }

      return result;
    } catch (err) {
      console.error('Error actualizando transacción:', err);
      throw err;
    }
  }, [user, updatePendingCount]);

  // ============================
  // Eliminar transacción
  // ============================
  const deleteTransaction = useCallback(async (transactionId) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const result = await syncService.deleteTransaction(transactionId, user.id);

      if (result.success) {
        // Eliminar de lista local
        setTransactions(prev => prev.filter(tx => tx.id !== transactionId));

        if (result.offline) {
          await updatePendingCount();
        }
      }

      return result;
    } catch (err) {
      console.error('Error eliminando transacción:', err);
      throw err;
    }
  }, [user, updatePendingCount]);


  // ============================
  // Refrescar desde servidor
  // ============================
  const refresh = useCallback(async () => {
    await loadTransactions();
    await updatePendingCount();
  }, [loadTransactions, updatePendingCount]);

  return {
    // Estado
    transactions,
    loading,
    syncing,
    error,
    isOnline,
    pendingCount,

    // Acciones
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loadTransactions,
    syncTransactions,
    refresh
  };
};

export default useTransactions;