// frontend/src/services/sseService.js
import api from '../config/axiosConfig';

// Mantener una tabla de EventSource por token para reutilizar la conexión
const sources = new Map();

function buildUrl(token) {
  const base = api.defaults.baseURL || '';
  return `${base.replace(/\/$/, '')}/stream/transactions?token=${encodeURIComponent(token)}`;
}

export function subscribeToTransactions(token, handlers = {}) {
  if (!token) {
    throw new Error('Token requerido para suscribirse a SSE');
  }

  let entry = sources.get(token);

  if (!entry) {
    const url = buildUrl(token);
    const es = new EventSource(url);
    entry = {
      es,
      refCount: 0,
      handlers: new Set()
    };

    es.onopen = () => {
      // notificar a los handlers
      entry.handlers.forEach(h => h.onOpen && h.onOpen());
    };

    es.onerror = (err) => {
      entry.handlers.forEach(h => h.onError && h.onError(err));
    };

    es.addEventListener('transaction_created', (ev) => {
      entry.handlers.forEach(h => h.onCreated && h.onCreated(ev));
    });

    es.addEventListener('transaction_updated', (ev) => {
      entry.handlers.forEach(h => h.onUpdated && h.onUpdated(ev));
    });

    es.addEventListener('transaction_deleted', (ev) => {
      entry.handlers.forEach(h => h.onDeleted && h.onDeleted(ev));
    });

    sources.set(token, entry);
  }

  // Registrar este subscriber
  entry.refCount += 1;
  entry.handlers.add(handlers);

  // Devolver función de unsubscribe
  return () => {
    try {
      entry.handlers.delete(handlers);
      entry.refCount -= 1;

      if (entry.refCount <= 0) {
        try { entry.es.close(); } catch (e) { /* swallow */ }
        sources.delete(token);
      }
    } catch (e) {
      console.warn('[sseService] Error unsubscribing', e);
    }
  };
}

export function closeAll() {
  for (const [token, entry] of sources.entries()) {
    try { entry.es.close(); } catch (e) { /* ignore */ }
    sources.delete(token);
  }
}

export default { subscribeToTransactions, closeAll };
