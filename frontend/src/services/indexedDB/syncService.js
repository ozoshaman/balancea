// frontend/src/services/syncService.js
import db from './db';
import api from '../../config/axiosConfig';

// Helpers: validar ObjectId Mongo y IDs temporales locales
const isValidMongoId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
const isTempId = (id) => typeof id === 'string' && /^(?:cat_temp_|temp_)/.test(id);

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
  }

  // ============================
  // Event Listeners
  // ============================

  /**
   * Agregar listener para eventos de sincronización
   */
  onSyncStateChange(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  notifyListeners(event) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error en sync listener:', error);
      }
    });
  }

  // ============================
  // Crear Transacción (Online/Offline)
  // ============================

  /**
   * Crear transacción con soporte offline
   */
  async createTransaction(transactionData, userId) {
    const isOnline = navigator.onLine;

    // Validación básica local para evitar encolar datos inválidos
    const validate = (data) => {
      if (!data) throw new Error('Datos de transacción inválidos');
      if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 2) {
        throw new Error('El título es requerido y debe tener al menos 2 caracteres');
      }
      if (!['INCOME', 'EXPENSE'].includes(data.type)) {
        throw new Error('El tipo debe ser INCOME o EXPENSE');
      }
      if (typeof data.amount !== 'number' && typeof data.amount !== 'string') {
        throw new Error('El monto es requerido');
      }
      const amount = Number(data.amount);
      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }
      if (!data.date || isNaN(new Date(data.date).getTime())) {
        throw new Error('La fecha es requerida y debe ser válida');
      }
      if (!data.categoryId || (!isValidMongoId(data.categoryId) && !isTempId(data.categoryId))) {
        throw new Error('La categoría es requerida y debe ser un ID válido');
      }
    };

    // Validar antes de intentar crear
    try {
      validate(transactionData); 
    } catch (validationError) {
      console.error('Validación cliente fallida:', validationError);
      // Si estamos online devolvemos error al caller para que muestre mensaje
      if (isOnline) throw validationError;
      // Si estamos offline, no permitimos encolar datos inválidos
      throw validationError;
    }

    if (isOnline) {
      // Online: Enviar directamente al servidor
      try {
        const response = await api.post('/transactions', transactionData);
        const savedTransaction = response.data.data;

        // Guardar en IndexedDB como respaldo
        await db.transactions.put(savedTransaction);

        this.notifyListeners({
          type: 'TRANSACTION_CREATED',
          transaction: savedTransaction,
          online: true
        });

        return { success: true, data: savedTransaction, offline: false };
      } catch (error) {
        console.error('Error creando transacción online:', error);
        
        // Si falla, guardar offline
        return await this.createTransactionOffline(transactionData, userId);
      }
    } else {
      // Offline: Guardar en cola
      return await this.createTransactionOffline(transactionData, userId);
    }
  }

  /**
   * Crear transacción offline (cola de sincronización)
   */
  async createTransactionOffline(transactionData, userId) {
    try {
      // Validar datos básicos antes de encolar
      if (!transactionData || !transactionData.title || !transactionData.type || !transactionData.amount) {
        throw new Error('Datos incompletos para crear transacción offline');
      }
      if (!transactionData.categoryId || (!isValidMongoId(transactionData.categoryId) && !isTempId(transactionData.categoryId))) {
        throw new Error('La categoría es requerida y debe ser un ID válido para encolar offline');
      }
      const pendingTransaction = {
        ...transactionData,
        userId,
        action: 'CREATE',
        localId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const savedPending = await db.addPendingTransaction(pendingTransaction);

      // También agregar a transacciones locales para mostrar en UI
      const localTransaction = {
        id: savedPending.localId,
        ...transactionData,
        userId,
        isPending: true,
        createdAt: new Date().toISOString()
      };

      await db.transactions.put(localTransaction);

      this.notifyListeners({
        type: 'TRANSACTION_CREATED_OFFLINE',
        transaction: localTransaction,
        online: false
      });

      // Registrar sync en Service Worker
      this.registerBackgroundSync('sync-transactions');

      return { success: true, data: localTransaction, offline: true };
    } catch (error) {
      console.error('Error creando transacción offline:', error);
      throw error;
    }
  }

  // ============================
  // Actualizar Transacción (Online/Offline)
  // ============================

  /**
   * Actualizar transacción con soporte offline
   */
  async updateTransaction(transactionId, updateData, userId) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await api.put(`/transactions/${transactionId}`, updateData);
        const updatedTransaction = response.data.data;

        // Actualizar en IndexedDB
        await db.transactions.put(updatedTransaction);

        this.notifyListeners({
          type: 'TRANSACTION_UPDATED',
          transaction: updatedTransaction,
          online: true
        });

        return { success: true, data: updatedTransaction, offline: false };
      } catch (error) {
        console.error('Error actualizando transacción online:', error);
        return await this.updateTransactionOffline(transactionId, updateData, userId);
      }
    } else {
      return await this.updateTransactionOffline(transactionId, updateData, userId);
    }
  }

  /**
   * Actualizar transacción offline
   */
  async updateTransactionOffline(transactionId, updateData, userId) {
    try {
      const pendingUpdate = {
        transactionId,
        ...updateData,
        userId,
        action: 'UPDATE',
        localId: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await db.addPendingTransaction(pendingUpdate);

      // Actualizar transacción local
      const existingTx = await db.transactions.get(transactionId);
      if (existingTx) {
        const updatedTx = { ...existingTx, ...updateData, isPending: true };
        await db.transactions.put(updatedTx);

        this.notifyListeners({
          type: 'TRANSACTION_UPDATED_OFFLINE',
          transaction: updatedTx,
          online: false
        });

        this.registerBackgroundSync('sync-transactions');
        return { success: true, data: updatedTx, offline: true };
      }

      throw new Error('Transacción no encontrada localmente');
    } catch (error) {
      console.error('Error actualizando transacción offline:', error);
      throw error;
    }
  }

  // ============================
  // Eliminar Transacción (Online/Offline)
  // ============================

  /**
   * Eliminar transacción con soporte offline
   */
  async deleteTransaction(transactionId, userId) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        await api.delete(`/transactions/${transactionId}`);
        await db.deleteTransaction(transactionId);

        this.notifyListeners({
          type: 'TRANSACTION_DELETED',
          transactionId,
          online: true
        });

        return { success: true, offline: false };
      } catch (error) {
        console.error('Error eliminando transacción online:', error);
        return await this.deleteTransactionOffline(transactionId, userId);
      }
    } else {
      return await this.deleteTransactionOffline(transactionId, userId);
    }
  }

  /**
   * Eliminar transacción offline
   */
  async deleteTransactionOffline(transactionId, userId) {
    try {
      const pendingDelete = {
        transactionId,
        userId,
        action: 'DELETE',
        localId: `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await db.addPendingTransaction(pendingDelete);

      // Marcar como eliminada localmente
      const existingTx = await db.transactions.get(transactionId);
      if (existingTx) {
        await db.transactions.put({ ...existingTx, isDeleted: true, isPending: true });
      }

      this.notifyListeners({
        type: 'TRANSACTION_DELETED_OFFLINE',
        transactionId,
        online: false
      });

      this.registerBackgroundSync('sync-transactions');
      return { success: true, offline: true };
    } catch (error) {
      console.error('Error eliminando transacción offline:', error);
      throw error;
    }
  }

  // ============================
  // Categorías (Online/Offline)
  // ============================

  /**
   * Crear categoría con soporte offline
   */
  async createCategory(categoryData, userId) {
    const isOnline = navigator.onLine;

    if (!categoryData || !categoryData.name) {
      throw new Error('Nombre de categoría inválido');
    }

    if (isOnline) {
      try {
        const response = await api.post('/categories', categoryData);
        const created = response.data.data;

        // Guardar en cache local
        if (created) {
          await db.saveCategories([created]);
        }

        this.notifyListeners({ type: 'CATEGORY_CREATED', category: created, online: true });
        return { success: true, data: created, offline: false };
      } catch (error) {
        console.error('Error creando categoría online, se encolará:', error);
        // Fallback a offline
        return await this.createCategoryOffline(categoryData, userId);
      }
    }

    // Offline
    return await this.createCategoryOffline(categoryData, userId);
  }

  async createCategoryOffline(categoryData, userId) {
    try {
      const pending = {
        ...categoryData,
        userId,
        action: 'CREATE',
        localId: `cat_temp_${Date.now()}_${Math.random().toString(36).substr(2,9)}`
      };

      const savedPending = await db.addPendingCategory(pending);

      // Añadir categoría local temporal al listado para que aparezca en UI
      const localCategory = {
        id: savedPending.localId,
        name: categoryData.name,
        color: categoryData.color || '#3B82F6',
        icon: categoryData.icon || '📁',
        userId,
        isPending: true,
        createdAt: new Date().toISOString()
      };

      await db.categories.put(localCategory);

      this.notifyListeners({ type: 'CATEGORY_CREATED_OFFLINE', category: localCategory, online: false });

      // Solicitar background sync
      this.registerBackgroundSync('sync-categories');

      return { success: true, data: localCategory, offline: true };
    } catch (error) {
      console.error('Error creando categoría offline:', error);
      throw error;
    }
  }

  /**
   * Sincronizar categorías pendientes
   */
  // frontend/src/services/syncService.js

/**
 * Sincronizar categorías pendientes
 */
  async syncPendingCategories(userId) {
    if (this.isSyncing) {
      console.log('⏳ Sincronización ya en progreso...');
      return { success: false, message: 'Sync in progress' };
    }

    if (!navigator.onLine) {
      console.log('📡 Sin conexión, no se puede sincronizar categorías');
      return { success: false, message: 'No internet connection' };
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'SYNC_STARTED_CATEGORIES' });

    try {
      const pending = await db.getPendingCategories(userId);

      if (!pending || pending.length === 0) {
        console.log('✅ No hay categorías pendientes');
        this.isSyncing = false;
        this.notifyListeners({ type: 'SYNC_COMPLETED_CATEGORIES', synced: 0 });
        return { success: true, synced: 0 };
      }

      console.log(`🔄 Sincronizando ${pending.length} categorías...`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const pc of pending) {
        try {
          await db.updatePendingCategoryStatus(pc.localId, 'syncing');

          // Intentar crear categoría en servidor
          let created = null;
          try {
            const response = await api.post('/categories', {
              name: pc.name,
              color: pc.color,
              icon: pc.icon
            });
            created = response.data.data;
          } catch (err) {
            const status = err?.response?.status;
            if (status === 409) {
              console.warn('Categoría ya existe (409). Buscando categoría existente...');
              try {
                const listResp = await api.get('/categories');
                const list = listResp.data?.data || [];
                const found = list.find(c => c.name && c.name.toLowerCase() === pc.name.toLowerCase());
                if (found) {
                  created = found;
                } else {
                  throw err;
                }
              } catch (listErr) {
                console.error('Error fetching categories to resolve 409:', listErr);
                throw err;
              }
            } else {
              throw err;
            }
          }

          if (created) {
            // ⚠️ PASO 1: GUARDAR LA CATEGORÍA REAL
            await db.categories.put(created);
            console.log(`✅ Categoría guardada con ID real: ${created.id}`);

            // ⚠️ PASO 2: ELIMINAR LA CATEGORÍA TEMPORAL DE db.categories
            try {
              await db.categories.delete(pc.localId);
              console.log(`🗑️ Categoría temporal eliminada de IndexedDB: ${pc.localId}`);
            } catch (delErr) {
              console.warn('Warning: no se pudo eliminar categoría temporal:', delErr);
            }

            // ⚠️ PASO 3: ACTUALIZAR TRANSACCIONES QUE USEN EL ID TEMPORAL
            try {
              // Actualizar transacciones sincronizadas
              const txs = await db.transactions.where('categoryId').equals(pc.localId).toArray();
              for (const t of txs) {
                await db.transactions.update(t.id, { categoryId: created.id });
                console.log(`🔄 Transacción ${t.id} actualizada con nueva categoría ${created.id}`);
              }

              // Actualizar transacciones pendientes
              const pendingTxs = await db.pendingTransactions.where('categoryId').equals(pc.localId).toArray();
              for (const pt of pendingTxs) {
                await db.pendingTransactions.update(pt.localId, { categoryId: created.id });
                console.log(`🔄 Transacción pendiente ${pt.localId} actualizada con nueva categoría ${created.id}`);
              }
            } catch (mapErr) {
              console.warn('Warning: no se pudieron reconciliar transacciones con la nueva categoría:', mapErr);
            }

            // ⚠️ PASO 4: MARCAR COMO SINCRONIZADA
            await db.updatePendingCategoryStatus(pc.localId, 'synced', created.id);

            syncedCount++;
          } else {
            throw new Error('No se recibió categoría creada del servidor');
          }
        } catch (error) {
          console.error(`❌ Error sincronizando categoría ${pc.localId}:`, error);
          const retries = (pc.retries || 0) + 1;
          await db.updatePendingCategoryStatus(pc.localId, 'error', null, error.message);
          errorCount++;
        }
      }

      // ⚠️ PASO 5: LIMPIAR pendingCategories
      try {
        const synced = await db.pendingCategories.where('status').equals('synced').toArray();
        await db.pendingCategories.bulkDelete(synced.map(c => c.localId));
        console.log(`🧹 ${synced.length} categorías sincronizadas limpiadas de pendingCategories`);
      } catch (cleanErr) {
        console.warn('Error limpiando pendingCategories:', cleanErr);
      }

      console.log(`✅ Sincronización categorías completada: ${syncedCount} exitosas, ${errorCount} errores`);
      this.notifyListeners({ type: 'SYNC_COMPLETED_CATEGORIES', synced: syncedCount, errors: errorCount });

      // ⚠️ NOTIFICAR AL SERVICE WORKER que puede sincronizar transacciones
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && syncedCount > 0) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.sync) {
            await registration.sync.register('sync-transactions');
            console.log('✅ Solicitando sincronización de transacciones al Service Worker');
          } else {
            console.warn('Background Sync no está disponible en Service Worker registration');
          }
        } catch (err) {
          console.warn('No se pudo registrar sync de transacciones:', err);
        }
      }

      return { success: true, synced: syncedCount, errors: errorCount };
    } catch (error) {
      console.error('❌ Error en syncCategories:', error);
      this.notifyListeners({ type: 'SYNC_ERROR_CATEGORIES', error });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
    
  }

  // ============================
  // Sincronización Manual
  // ============================

  /**
   * Sincronizar transacciones pendientes con el servidor
   */
  async syncPendingTransactions(userId) {
    if (this.isSyncing) {
      console.log('⏳ Sincronización ya en progreso...');
      return { success: false, message: 'Sync in progress' };
    }

    if (!navigator.onLine) {
      console.log('📡 Sin conexión, no se puede sincronizar');
      return { success: false, message: 'No internet connection' };
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'SYNC_STARTED' });

    try {
      const pending = await db.getPendingTransactions(userId);

      if (pending.length === 0) {
        console.log('✅ No hay transacciones pendientes');
        this.isSyncing = false;
        this.notifyListeners({ type: 'SYNC_COMPLETED', synced: 0 });
        return { success: true, synced: 0 };
      }

      console.log(`🔄 Sincronizando ${pending.length} transacciones...`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const pendingTx of pending) {
        try {
          await db.updatePendingTransactionStatus(pendingTx.localId, 'syncing');

          // Verificar si la categoría es temporal
          let categoryIdToUse = pendingTx.categoryId;
          if (categoryIdToUse && !isValidMongoId(categoryIdToUse) && isTempId(categoryIdToUse)) {
            try {
              const pendingCat = await db.pendingCategories.get(categoryIdToUse);
              if (pendingCat && pendingCat.serverId) {
                categoryIdToUse = pendingCat.serverId;
              } else {
                console.log(`⏳ Postponiendo transacción ${pendingTx.localId} hasta que la categoría ${categoryIdToUse} se sincronice`);
                await db.updatePendingTransactionStatus(pendingTx.localId, 'pending');
                continue;
              }
            } catch (mapErr) {
              console.warn('Warning resolving temp category id for transaction:', mapErr);
              await db.updatePendingTransactionStatus(pendingTx.localId, 'pending');
              continue;
            }
          }

          let response;

          switch (pendingTx.action) {
            case 'CREATE':
              response = await api.post('/transactions', {
                title: pendingTx.title,
                type: pendingTx.type,
                amount: pendingTx.amount,
                date: pendingTx.date,
                description: pendingTx.description,
                categoryId: categoryIdToUse
              });

              // ⚠️ ELIMINAR TRANSACCIÓN TEMPORAL DE db.transactions
              try {
                await db.transactions.delete(pendingTx.localId);
                console.log(`🗑️ Transacción temporal eliminada: ${pendingTx.localId}`);
              } catch (delErr) {
                console.warn('Warning eliminando transacción temporal:', delErr);
              }

              // ⚠️ GUARDAR TRANSACCIÓN REAL
              await db.transactions.put(response.data.data);
              console.log(`✅ Transacción real guardada: ${response.data.data.id}`);
              break;

            case 'UPDATE':
              response = await api.put(`/transactions/${pendingTx.transactionId}`, {
                title: pendingTx.title,
                type: pendingTx.type,
                amount: pendingTx.amount,
                date: pendingTx.date,
                description: pendingTx.description,
                categoryId: pendingTx.categoryId
              });

              await db.transactions.put(response.data.data);
              break;

            case 'DELETE':
              await api.delete(`/transactions/${pendingTx.transactionId}`);
              await db.deleteTransaction(pendingTx.transactionId);
              break;

            default:
              throw new Error(`Acción desconocida: ${pendingTx.action}`);
          }

          await db.updatePendingTransactionStatus(
            pendingTx.localId,
            'synced',
            response?.data?.data?.id
          );

          syncedCount++;
          console.log(`✅ Transacción sincronizada: ${pendingTx.localId}`);
        } catch (error) {
          console.error(`❌ Error sincronizando ${pendingTx.localId}:`, error);
          
          await db.updatePendingTransactionStatus(
            pendingTx.localId,
            'error',
            null,
            error.message
          );

          errorCount++;
        }
      }

      // ⚠️ LIMPIAR pendingTransactions
      await db.cleanSyncedTransactions();

      console.log(`✅ Sincronización completada: ${syncedCount} exitosas, ${errorCount} errores`);

      this.notifyListeners({
        type: 'SYNC_COMPLETED',
        synced: syncedCount,
        errors: errorCount
      });

      return { success: true, synced: syncedCount, errors: errorCount };
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      this.notifyListeners({ type: 'SYNC_ERROR', error });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // ============================
  // Background Sync Registration
  // ============================

  /**
   * Registrar sincronización en segundo plano (Service Worker)
   */
  async registerBackgroundSync(tag) {
    try {
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('✅ Background sync registrado:', tag);
      } else {
        console.warn('⚠️ Background Sync no soportado');
      }
    } catch (error) {
      console.error('Error registrando background sync:', error);
    }
  }

  // ============================
  // Obtener Estado de Sincronización
  // ============================

  /**
   * Obtener número de transacciones pendientes
   */
  async getPendingCount(userId) {
    try {
      const pending = await db.getPendingTransactions(userId);
      return pending.length;
    } catch (error) {
      console.error('Error obteniendo pendientes:', error);
      return 0;
    }
  }

  /**
   * Verificar si hay sincronización en progreso
   */
  isSyncInProgress() {
    return this.isSyncing;
  }
}

// Exportar instancia única
const syncService = new SyncService();
export default syncService;