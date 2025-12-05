import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { endOfDay } from 'date-fns';

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    console.log('Conectado a DB, buscando recurringTransactions con endDate...');
    const recurrents = await prisma.recurringTransaction.findMany({ where: { endDate: { not: null } }, select: { id: true, endDate: true } });
    console.log(`Encontradas ${recurrents.length} entradas con endDate`);
    let updated = 0;
    for (const r of recurrents) {
      const original = new Date(r.endDate);
      const normalized = endOfDay(original);
      if (normalized.getTime() !== original.getTime()) {
        await prisma.recurringTransaction.update({ where: { id: r.id }, data: { endDate: normalized } });
        updated++;
        console.log(`Actualizado ${r.id}: ${original.toISOString()} -> ${normalized.toISOString()}`);
      }
    }
    console.log(`Normalización completada. Modificados: ${updated}`);
  } catch (err) {
    console.error('Error normalizando endDate:', err);
  } finally {
    await prisma.$disconnect();
  }
})();