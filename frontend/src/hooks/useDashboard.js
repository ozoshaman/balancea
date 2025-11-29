// src/hooks/useDashboard.js
import { useEffect, useState, useCallback } from "react";
import db from "../services/db";
import syncService from "../services/syncService";
import api from "../config/axiosConfig";

export default function useDashboard(userId) {
  const [stats, setStats] = useState({
    ingresos: 0,
    gastos: 0,
    balance: 0,
    ahorro: 0,
    transactions: [],
    loading: true,
  });

  // =============================
  // Cargar datos desde IndexedDB + pendientes offline
  // =============================
  const loadDashboardData = useCallback(async () => {
    // ⚠️ Validar que userId exista
    if (!userId) {
      console.warn("❌ useDashboard: userId no disponible");
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const txs = await db.getUserTransactions(userId);
      // Obtener transacciones pendientes offline
      const pendingTxs = await db.getPendingTransactions(userId);

      // Evitar doble conteo: algunas transacciones creadas offline se almacenan
      // tanto en `pendingTransactions` (con `localId`) como como transacción
      // local en `transactions` (con id == localId). Construimos un set con
      // los localIds para filtrar duplicados de la lista sincronizada.
      const pendingLocalIds = new Set((pendingTxs || []).map(pt => String(pt.localId)));

      const txsFiltered = (txs || []).filter(t => !pendingLocalIds.has(String(t.id)));

      let ingresos = 0;
      let gastos = 0;

      // Sumar transacciones sincronizadas (ya filtradas)
      txsFiltered.forEach((t) => {
        const type = (t.type || '').toUpperCase();
        if (type === "INCOME") ingresos += Number(t.amount || 0);
        if (type === "EXPENSE") gastos += Number(t.amount || 0);
      });

      // Sumar transacciones pendientes offline (solo CREATE, no UPDATE/DELETE)
      const pendingCreates = (pendingTxs || []).filter((t) => t.action === "CREATE" && t.status !== "synced");
      pendingCreates.forEach((t) => {
        const type = (t.type || '').toUpperCase();
        if (type === "INCOME") ingresos += Number(t.amount || 0);
        if (type === "EXPENSE") gastos += Number(t.amount || 0);
      });

      const balance = ingresos - gastos;

      // Combinar transacciones para mostrar (daremos preferencia a pendientes recientes)
      const recentPending = pendingCreates.slice(0, 5);
      const recentSynced = txsFiltered.slice(0, 5);
      const allTransactions = [...recentPending, ...recentSynced].slice(0, 5);

      setStats({
        ingresos,
        gastos,
        balance,
        ahorro: ingresos * 0.50,
        transactions: allTransactions.map(t => ({
          type: (t.type || '').toLowerCase(),
          amount: t.amount,
          category: t.categoryName || t.category || "Sin categoría",
          isPending: !!t.isPending || (typeof t.localId !== 'undefined'),
        })),
        loading: false,
      });

      // Guardar estadísticas en cache
      await db.saveStats(userId, {
        ingresos,
        gastos,
        balance,
        ahorro: ingresos * 0.50,
      });
    } catch (err) {
      console.error("❌ Error cargando dashboard:", err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  // =============================
  // Cargar datos del servidor (primera carga / login)
  // =============================
  const loadInitialData = useCallback(async () => {
    if (!userId) return;

    try {
      console.log("📡 Cargando datos iniciales del servidor...");
      
      // Obtener transacciones del servidor
      const response = await api.get("/transactions");
      const serverTransactions = response?.data?.data?.transactions || [];

      // Guardar en IndexedDB
      if (serverTransactions.length > 0) {
        await db.saveTransactions(serverTransactions);
      }

      // Luego cargar todo (local + pendientes)
      await loadDashboardData();
    } catch (err) {
      console.error("❌ Error cargando datos iniciales:", err);
      // Intentar cargar desde IndexedDB como fallback
      await loadDashboardData();
    }
  }, [userId, loadDashboardData]);

  // =============================
  // Inicialización: cargar datos al montar o cambiar userId
  // =============================
  useEffect(() => {
    if (userId) {
      loadInitialData();
    }
  }, [userId, loadInitialData]);

  // =============================
  // Escuchar cambios de conexión online/offline
  // =============================
  useEffect(() => {
    if (!userId) return;

    const handleOnline = async () => {
      console.log("🌐 Conexión restaurada - Recargando dashboard");
      // Esperar un poco para que syncService sincronice
      setTimeout(() => {
        loadDashboardData();
      }, 1000);
    };

    const handleOffline = () => {
      console.log("📡 Sin conexión - Dashboard mostrará datos locales + pendientes");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userId, loadDashboardData]);

  // =============================
  // Eventos de sincronización
  // =============================
  useEffect(() => {
    const unsubscribe = syncService.onSyncStateChange((event) => {
      /*
        EVENTOS POSIBLES:
          TRANSACTION_CREATED
          TRANSACTION_CREATED_OFFLINE
          TRANSACTION_UPDATED
          TRANSACTION_DELETED
          SYNC_COMPLETED
          SYNC_COMPLETED_CATEGORIES
      */

      // Cuando cambie algo → refrescar Dashboard
      if (
        event.type.includes("TRANSACTION") ||
        event.type.includes("SYNC_COMPLETED")
      ) {
        console.log("🔄 Evento de sincronización:", event.type);
        loadDashboardData();
      }
    });

    return () => unsubscribe();
  }, [loadDashboardData]);

  return { ...stats };
}
