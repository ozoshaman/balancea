// src/jobs/recurringTransactions.js
import cron from 'node-cron';
import { processRecurringTransactions } from '../services/recurringTransactionService.js';

/**
 * Job que se ejecuta cada hora para procesar transacciones recurrentes
 */
export const startRecurringTransactionsCron = () => {
  // Ejecutar cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Ejecutando job de transacciones recurrentes...');
    try {
      const results = await processRecurringTransactions();
      console.log(`✅ Job completado: ${results.processed} procesadas, ${results.failed} fallidas`);
    } catch (error) {
      console.error('❌ Error en job de transacciones recurrentes:', error);
    }
  });

  console.log('✅ Cron job de transacciones recurrentes iniciado');
};