// src/jobs/recurringTransactions.js
import cron from 'node-cron';
import { processRecurringTransactions } from '../services/recurringTransactionService.js';

/**
 * Job que procesa transacciones recurrentes.
 * - En `production` se ejecuta cada hora (top of hour).
 * - En `development` se ejecuta cada minuto para facilitar pruebas.
 * Además ejecuta una pasada inmediata al iniciar el servidor.
 */
export const startRecurringTransactionsCron = () => {
  const schedule = process.env.NODE_ENV === 'production' ? '0 * * * *' : '*/1 * * * *';
  // Simple guard para evitar que el mismo proceso ejecute varias instancias concurrentes
  // (por ejemplo, si la pasada inicial tarda más que el intervalo). Para entornos con
  // múltiples instancias/procesos en diferentes hosts, debe implementarse un lock
  // distribuido en la BD/Redis.
  let isRunning = false;

  cron.schedule(schedule, async () => {
    if (isRunning) {
      console.log('⏭️ Job de recurrentes ya en ejecución, omitiendo esta pasada.');
      return;
    }
    isRunning = true;
    console.log('🔄 Ejecutando job de transacciones recurrentes...');
    try {
      const results = await processRecurringTransactions();
      console.log(`✅ Job completado: ${results.processed} procesadas, ${results.failed} fallidas`);
    } catch (error) {
      console.error('❌ Error en job de transacciones recurrentes:', error);
    } finally {
      isRunning = false;
    }
  });

  // Ejecutar una pasada inmediata al iniciar (no bloqueante)
  (async () => {
    try {
      console.log('🔁 Ejecutando pasada inicial de recurrentes al iniciar servidor...');
      // Marcar como en ejecución para evitar solapamientos con el cron programado
      isRunning = true;
      const results = await processRecurringTransactions();
      console.log(`🔁 Pasada inicial completada: ${results.processed} procesadas, ${results.failed} fallidas`);
    } catch (err) {
      console.error('❌ Error en pasada inicial de recurrentes:', err);
    } finally {
      isRunning = false;
    }
  })();

  console.log('✅ Cron job de transacciones recurrentes iniciado');
  console.log(`✅ Cron job de transacciones recurrentes iniciado (schedule=${schedule})`);
};