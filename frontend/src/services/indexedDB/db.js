// frontend/src/services/db.js
import Dexie from 'dexie';

// ============================
// Configuración de la Base de Datos IndexedDB
// ============================
class BalanceaDB extends Dexie {
  constructor() {
    super('BalanceaDB');
    
    // Definir el esquema de la base de datos
    // Versión 4: añadir índice categoryId en pendingTransactions y pendingPremiums
    this.version(4).stores({
      // Transacciones sincronizadas (copia local de datos del servidor)
      transactions: 'id, userId, type, date, categoryId, amount, *tags',
      
      // Cola de transacciones pendientes de sincronizar
      // Añadir categoryId al índice para consultas/where sobre categoryId
      pendingTransactions: '++localId, userId, type, date, status, retries, categoryId',
      
      // Cola de categorías pendientes de sincronizar (creadas offline)
      pendingCategories: '++localId, userId, name, status, retries',

      // Cola de upgrades a PREMIUM pendientes
      pendingPremiums: '++localId, userId, status, createdAt',
      
      // Categorías (cache)
      categories: 'id, userId, name',
      
      // Configuración local
      settings: 'key',
      
      // Caché de balance y estadísticas
      stats: 'userId, lastUpdate'
    });

    // Definir las "tablas" como propiedades tipadas
    this.transactions = this.table('transactions');
    this.pendingTransactions = this.table('pendingTransactions');
    this.categories = this.table('categories');
    this.pendingCategories = this.table('pendingCategories');
    this.pendingPremiums = this.table('pendingPremiums');
    this.settings = this.table('settings');
    this.stats = this.table('stats');
  }

  // ============================
  // Métodos de Transacciones Sincronizadas
  // ============================
  
  /**
   * Guardar transacciones del servidor en IndexedDB
   */
  async saveTransactions(transactions) {
    try {
      // Verificar que IndexedDB esté disponible en este contexto
      if (typeof indexedDB === 'undefined') {
        console.error('IndexedDB no está disponible en este entorno. Omitiendo guardado local.');
        return false;
      }

      if (!transactions || !Array.isArray(transactions)) {
        console.warn('saveTransactions recibió datos inválidos:', transactions);
        return false;
      }

      await this.transactions.bulkPut(transactions);
      console.log('✅ Transacciones guardadas en IndexedDB:', transactions.length);
      return true;
    } catch (error) {
      console.error('❌ Error guardando transacciones:', error);
      // Proveer mensaje más claro para problemas internos de IndexedDB
      if (error && error.stack && error.stack.includes('dbcore-indexeddb')) {
        console.error('Detalle: posible problema con la implementación de IndexedDB en este navegador o con los datos insertados.');
      }
      throw error;
    }
  }

  /**
   * Obtener todas las transacciones de un usuario
   */
  async getUserTransactions(userId) {
    try {
      return await this.transactions
        .where('userId')
        .equals(userId)
        .reverse()
        .sortBy('date');
    } catch (error) {
      console.error('❌ Error obteniendo transacciones:', error);
      return [];
    }
  }

  /**
   * Obtener transacciones filtradas
   */
  async getFilteredTransactions(userId, filters = {}) {
    try {
      let query = this.transactions.where('userId').equals(userId);

      // Filtrar por tipo
      if (filters.type) {
        query = query.and(tx => tx.type === filters.type);
      }

      // Filtrar por categoría
      if (filters.categoryId) {
        query = query.and(tx => tx.categoryId === filters.categoryId);
      }

      // Filtrar por rango de fechas
      if (filters.startDate && filters.endDate) {
        query = query.and(tx => {
          const txDate = new Date(tx.date);
          return txDate >= new Date(filters.startDate) && 
                 txDate <= new Date(filters.endDate);
        });
      }

      return await query.reverse().sortBy('date');
    } catch (error) {
      console.error('❌ Error filtrando transacciones:', error);
      return [];
    }
  }

  /**
   * Eliminar transacción sincronizada
   */
  async deleteTransaction(transactionId) {
    try {
      await this.transactions.delete(transactionId);
      console.log('✅ Transacción eliminada de IndexedDB:', transactionId);
    } catch (error) {
      console.error('❌ Error eliminando transacción:', error);
      throw error;
    }
  }

  // ============================
  // Métodos de Cola de Sincronización
  // ============================

  /**
   * Agregar transacción a la cola de sincronización (offline)
   */
  async addPendingTransaction(transaction) {
    try {
      const pendingTx = {
        ...transaction,
        status: 'pending', // pending | syncing | synced | error
        retries: 0,
        createdAt: new Date().toISOString(),
        error: null
      };

      const localId = await this.pendingTransactions.add(pendingTx);
      console.log('✅ Transacción agregada a cola offline:', localId);
      
      return { ...pendingTx, localId };
    } catch (error) {
      console.error('❌ Error agregando transacción pendiente:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las transacciones pendientes
   */
  async getPendingTransactions(userId) {
    try {
      return await this.pendingTransactions
        .where('userId')
        .equals(userId)
        .and(tx => tx.status !== 'synced')
        .toArray();
    } catch (error) {
      console.error('❌ Error obteniendo transacciones pendientes:', error);
      return [];
    }
  }

  /**
   * Actualizar estado de transacción pendiente
   */
  async updatePendingTransactionStatus(localId, status, serverId = null, error = null) {
    try {
      const updates = { status };
      
      if (serverId) updates.serverId = serverId;
      if (error) updates.error = error;
      if (status === 'error') {
        const tx = await this.pendingTransactions.get(localId);
        updates.retries = (tx?.retries || 0) + 1;
      }

      await this.pendingTransactions.update(localId, updates);
      console.log(`✅ Estado actualizado: ${localId} → ${status}`);
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
    }
  }

  /**
   * Eliminar transacción pendiente después de sincronizar
   */
  async removePendingTransaction(localId) {
    try {
      await this.pendingTransactions.delete(localId);
      console.log('✅ Transacción pendiente eliminada:', localId);
    } catch (error) {
      console.error('❌ Error eliminando transacción pendiente:', error);
    }
  }

  /**
   * Limpiar transacciones sincronizadas exitosamente
   */
  async cleanSyncedTransactions() {
    try {
      const synced = await this.pendingTransactions
        .where('status')
        .equals('synced')
        .toArray();

      await this.pendingTransactions.bulkDelete(
        synced.map(tx => tx.localId)
      );

      console.log(`✅ ${synced.length} transacciones sincronizadas limpiadas`);
    } catch (error) {
      console.error('❌ Error limpiando transacciones:', error);
    }
  }

  // ============================
  // Métodos de Categorías
  // ============================

  async saveCategories(categories, userId = null) {
    try {
      if (typeof indexedDB === 'undefined') {
        console.error('IndexedDB no está disponible en este entorno. Omitiendo guardado de categorías.');
        return false;
      }

      if (!categories || !Array.isArray(categories)) {
        console.warn('saveCategories recibió datos inválidos:', categories);
        return false;
      }

      // Asegurar que cada categoría tenga userId para que las consultas por user funcionen
      const normalized = categories.map(cat => ({
        ...cat,
        userId: cat.userId || userId || null
      }));

      await this.categories.bulkPut(normalized);
      console.log('✅ Categorías guardadas:', normalized.length);
      return true;
    } catch (error) {
      console.error('❌ Error guardando categorías:', error);
      return false;
    }
  }

  async getUserCategories(userId) {
    try {
      return await this.categories
        .where('userId')
        .equals(userId)
        .toArray();
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      return [];
    }
  }

  // ============================
  // Métodos de Cola de Categorías (offline)
  // ============================

  async addPendingCategory(category) {
    try {
      const pending = {
        ...category,
        status: 'pending', // pending | syncing | synced | error
        retries: 0,
        createdAt: new Date().toISOString(),
        error: null
      };

      const localId = await this.pendingCategories.add(pending);
      console.log('✅ Categoría agregada a cola offline:', localId);
      return { ...pending, localId };
    } catch (error) {
      console.error('❌ Error agregando categoría pendiente:', error);
      throw error;
    }
  }

  async getPendingCategories(userId) {
    try {
      return await this.pendingCategories
        .where('userId')
        .equals(userId)
        .and(c => c.status !== 'synced')
        .toArray();
    } catch (error) {
      console.error('❌ Error obteniendo categorías pendientes:', error);
      return [];
    }
  }

  async updatePendingCategoryStatus(localId, status, serverId = null, error = null) {
    try {
      const updates = { status };
      if (serverId) updates.serverId = serverId;
      if (error) updates.error = error;
      if (status === 'error') {
        const cat = await this.pendingCategories.get(localId);
        updates.retries = (cat?.retries || 0) + 1;
      }

      await this.pendingCategories.update(localId, updates);
      console.log(`✅ Estado actualizado categoría: ${localId} → ${status}`);
    } catch (err) {
      console.error('❌ Error actualizando estado categoría:', err);
    }
  }

  async removePendingCategory(localId) {
    try {
      await this.pendingCategories.delete(localId);
      console.log('✅ Categoría pendiente eliminada:', localId);
    } catch (error) {
      console.error('❌ Error eliminando categoría pendiente:', error);
    }
  }

  async cleanSyncedCategories() {
    try {
      const synced = await this.pendingCategories
        .where('status')
        .equals('synced')
        .toArray();

      await this.pendingCategories.bulkDelete(
        synced.map(c => c.localId)
      );

      console.log(`✅ ${synced.length} categorías sincronizadas limpiadas`);
    } catch (error) {
      console.error('❌ Error limpiando categorías sincronizadas:', error);
    }
  }

  // ============================
  // Métodos de Upgrades (Premium)
  // ============================

  async addPendingPremium(premium) {
    try {
      const pending = {
        ...premium,
        status: 'pending',
        createdAt: premium.createdAt || new Date().toISOString(),
      };

      const localId = await this.pendingPremiums.add(pending);
      console.log('✅ Upgrade a Premium encolado:', localId);
      return { ...pending, localId };
    } catch (error) {
      console.error('❌ Error agregando pendingPremium:', error);
      throw error;
    }
  }

  async getPendingPremiums(userId) {
    try {
      if (!userId) return await this.pendingPremiums.toArray();
      return await this.pendingPremiums.where('userId').equals(userId).and(p => p.status !== 'synced').toArray();
    } catch (error) {
      console.error('❌ Error obteniendo pendingPremiums:', error);
      return [];
    }
  }

  async removePendingPremium(localId) {
    try {
      await this.pendingPremiums.delete(localId);
      console.log('✅ pendingPremium eliminado:', localId);
    } catch (error) {
      console.error('❌ Error eliminando pendingPremium:', error);
    }
  }

  async cleanSyncedPremiums() {
    try {
      const synced = await this.pendingPremiums.where('status').equals('synced').toArray();
      await this.pendingPremiums.bulkDelete(synced.map(p => p.localId));
      console.log(`✅ ${synced.length} upgrades sincronizados limpiados`);
    } catch (error) {
      console.error('❌ Error limpiando pendingPremiums:', error);
    }
  }

  // ============================
  // Métodos de Configuración
  // ============================

  async setSetting(key, value) {
    try {
      await this.settings.put({ key, value });
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.settings.get(key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('❌ Error obteniendo configuración:', error);
      return defaultValue;
    }
  }

  // ============================
  // Métodos de Estadísticas
  // ============================

  async saveStats(userId, stats) {
    try {
      await this.stats.put({
        userId,
        ...stats,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error guardando estadísticas:', error);
    }
  }

  async getStats(userId) {
    try {
      return await this.stats.get(userId);
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }

  // ============================
  // Utilidades
  // ============================

  /**
   * Limpiar toda la base de datos
   */
  async clearAll() {
    try {
      await Promise.all([
        this.transactions.clear(),
        this.pendingTransactions.clear(),
        this.pendingCategories.clear(),
        this.categories.clear(),
        this.settings.clear(),
        this.stats.clear()
      ]);
      console.log('✅ Base de datos limpiada');
    } catch (error) {
      console.error('❌ Error limpiando base de datos:', error);
    }
  }

  /**
   * Obtener tamaño aproximado de la base de datos
   */
  async getStorageSize() {
    try {
      const counts = await Promise.all([
        this.transactions.count(),
        this.pendingTransactions.count(),
        this.pendingCategories.count(),
        this.categories.count()
      ]);

      return {
        transactions: counts[0],
        pending: counts[1],
        pendingCategories: counts[2],
        categories: counts[3],
        total: counts.reduce((a, b) => a + b, 0)
      };
    } catch (error) {
      console.error('❌ Error calculando tamaño:', error);
      return { transactions: 0, pending: 0, categories: 0, total: 0 };
    }
  }
}

// Crear instancia única (singleton)
const db = new BalanceaDB();

export default db;

// Exportar también la clase por si se necesita en tests
export { BalanceaDB };