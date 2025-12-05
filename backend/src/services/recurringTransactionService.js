// src/services/recurringTransactionService.js
import { PrismaClient } from '@prisma/client';
import {
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  endOfDay,
  startOfDay,
} from 'date-fns';
import * as notificationService from './notificationService.js';
import sseService from './sseService.js';

const prisma = new PrismaClient();

/**
 * Calcular la próxima ejecución añadiendo fv unidades a currentDate
 */
function calculateNextRun(currentDate, fv, unit) {
  const date = new Date(currentDate);
  switch ((unit || '').toUpperCase()) {
    case 'MINUTES':
      return addMinutes(date, fv);
    case 'HOURS':
      return addHours(date, fv);
    case 'DAYS':
      return addDays(date, fv);
    case 'WEEKS':
      return addWeeks(date, fv);
    case 'MONTHS':
      return addMonths(date, fv);
    case 'YEARS':
      return addYears(date, fv);
    default:
      throw new Error('frequencyUnit no válido');
  }
}

/**
 * Crear una transacción recurrente
 */
export const createRecurringTransaction = async (userId, recurringData) => {
  try {
    const {
      title,
      type,
      amount,
      description,
      categoryId,
      frequencyValue = 1,
      frequencyUnit,
      startDate,
      endDate,
      notifyOnRun = true,
    } = recurringData;

    // Obtener el usuario para verificar su plan
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

    // Contar transacciones recurrentes activas del usuario
    const activeRecurringCount = await prisma.recurringTransaction.count({ where: { userId, isActive: true } });

    // Validar límite según el plan (FREE: 2, PREMIUM: 5)
    const limit = user.role === 'FREE' ? 2 : 5;
    if (activeRecurringCount >= limit) {
      const err = new Error(`Has alcanzado el límite de ${limit} transacciones recurrentes activas. ${user.role === 'FREE' ? 'Actualiza a Premium para crear más.' : ''}`);
      err.status = 403;
      throw err;
    }

    // Validar categoría
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) {
      const err = new Error('Categoría no encontrada');
      err.status = 404;
      throw err;
    }

    // Validar monto
    if (amount <= 0) {
      const err = new Error('El monto debe ser mayor a 0');
      err.status = 400;
      throw err;
    }

    // Validar frecuencia
    const fv = parseInt(frequencyValue || 1, 10);
    if (!fv || fv < 1) {
      const err = new Error('frequencyValue debe ser un entero mayor o igual a 1');
      err.status = 400;
      throw err;
    }
    if (!frequencyUnit) {
      const err = new Error('frequencyUnit es requerido');
      err.status = 400;
      throw err;
    }

    // Calcular la próxima ejecución: si startDate en pasado, buscar la próxima ocurrencia >= ahora
    const now = new Date();
    let base = startDate ? new Date(startDate) : now;
    let nextRun = new Date(base);
    let attempts = 0;
    while (isBefore(nextRun, now) && attempts < 1000) {
      nextRun = calculateNextRun(nextRun, fv, frequencyUnit);
      attempts++;
    }
    // Normalizar endDate: si se proporciona como fecha (sin hora), tratar como fin del día
    const normalizedEndDate = endDate ? endOfDay(new Date(endDate)) : null;

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        title: title.trim(),
        type,
        amount: parseFloat(amount),
        description: description?.trim() || null,
        categoryId,
        frequencyValue: fv,
        frequencyUnit,
        startDate: base,
        endDate: normalizedEndDate,
        nextRun,
        isActive: true,
        userId,
        notifyOnRun,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, isDefault: true },
        },
      },
    });

    return recurringTransaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en createRecurringTransaction:', error);
    const err = new Error('Error al crear la transacción recurrente');
    err.status = 500;
    throw err;
  }
};

/**
 * Obtener todas las transacciones recurrentes del usuario
 */
export const getUserRecurringTransactions = async (userId, filters = {}) => {
  try {
    const { isActive } = filters;
    const where = { userId };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where,
      include: { category: { select: { id: true, name: true, color: true, icon: true, isDefault: true } } },
      orderBy: { nextRun: 'asc' },
    });

    return recurringTransactions;
  } catch (error) {
    console.error('Error en getUserRecurringTransactions:', error);
    const err = new Error('Error al obtener las transacciones recurrentes');
    err.status = 500;
    throw err;
  }
};

export const getRecurringTransactionById = async (userId, recurringId) => {
  try {
    const recurringTransaction = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, userId }, include: { category: { select: { id: true, name: true, color: true, icon: true, isDefault: true } } } });
    if (!recurringTransaction) { const err = new Error('Transacción recurrente no encontrada'); err.status = 404; throw err; }
    return recurringTransaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en getRecurringTransactionById:', error);
    const err = new Error('Error al obtener la transacción recurrente'); err.status = 500; throw err;
  }
};

export const updateRecurringTransaction = async (userId, recurringId, updateData) => {
  try {
    const existing = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, userId } });
    if (!existing) { const err = new Error('Transacción recurrente no encontrada'); err.status = 404; throw err; }

    if (updateData.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: updateData.categoryId, userId } });
      if (!category) { const err = new Error('Categoría no encontrada'); err.status = 404; throw err; }
    }

    if (updateData.amount !== undefined && updateData.amount <= 0) { const err = new Error('El monto debe ser mayor a 0'); err.status = 400; throw err; }

    const dataToUpdate = {};
    if (updateData.title) dataToUpdate.title = updateData.title.trim();
    if (updateData.type) dataToUpdate.type = updateData.type;
    if (updateData.amount) dataToUpdate.amount = parseFloat(updateData.amount);
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description?.trim() || null;
    if (updateData.categoryId) dataToUpdate.categoryId = updateData.categoryId;
    if (updateData.frequencyValue !== undefined) dataToUpdate.frequencyValue = parseInt(updateData.frequencyValue, 10);
    if (updateData.frequencyUnit) dataToUpdate.frequencyUnit = updateData.frequencyUnit;
    if (updateData.notifyOnRun !== undefined) dataToUpdate.notifyOnRun = updateData.notifyOnRun;

    // Recalcular nextRun si cambia la frecuencia o startDate
    if (updateData.frequencyValue !== undefined || updateData.frequencyUnit || updateData.startDate) {
      const fv = updateData.frequencyValue !== undefined ? parseInt(updateData.frequencyValue, 10) : existing.frequencyValue;
      const fu = updateData.frequencyUnit || existing.frequencyUnit;
      const base = updateData.startDate ? new Date(updateData.startDate) : existing.nextRun || existing.startDate;
      let nextRun = new Date(base);
      let attempts = 0;
      const now = new Date();
      while (isBefore(nextRun, now) && attempts < 1000) {
        nextRun = calculateNextRun(nextRun, fv, fu);
        attempts++;
      }
      dataToUpdate.nextRun = nextRun;
    }

    if (updateData.startDate) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) dataToUpdate.endDate = updateData.endDate ? endOfDay(new Date(updateData.endDate)) : null;
    if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;

    const recurringTransaction = await prisma.recurringTransaction.update({ where: { id: recurringId }, data: dataToUpdate, include: { category: { select: { id: true, name: true, color: true, icon: true, isDefault: true } } } });
    return recurringTransaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en updateRecurringTransaction:', error);
    const err = new Error('Error al actualizar la transacción recurrente'); err.status = 500; throw err;
  }
};

export const deleteRecurringTransaction = async (userId, recurringId) => {
  try {
    const recurringTransaction = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, userId } });
    if (!recurringTransaction) { const err = new Error('Transacción recurrente no encontrada'); err.status = 404; throw err; }
    await prisma.recurringTransaction.delete({ where: { id: recurringId } });
    return { message: 'Transacción recurrente eliminada exitosamente' };
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en deleteRecurringTransaction:', error);
    const err = new Error('Error al eliminar la transacción recurrente'); err.status = 500; throw err;
  }
};

/**
 * Procesar transacciones recurrentes pendientes (para ejecutar con un cron job)
 */
export const processRecurringTransactions = async () => {
  try {
    const now = new Date();
    console.log(`[recurringService] processRecurringTransactions now=${now.toISOString()}`);

    const activeCount = await prisma.recurringTransaction.count({ where: { isActive: true } });
    console.log(`[recurringService] active recurrentes: ${activeCount}`);

    // Mostrar las próximas 5 recurrentes (para debugging)
    if (activeCount > 0) {
      const upcoming = await prisma.recurringTransaction.findMany({ where: { isActive: true }, orderBy: { nextRun: 'asc' }, take: 5 });
      console.log('[recurringService] próximas recurrentes:', upcoming.map(r => ({ id: r.id, title: r.title, nextRun: r.nextRun?.toISOString(), startDate: r.startDate?.toISOString(), endDate: r.endDate?.toISOString(), frequencyValue: r.frequencyValue, frequencyUnit: r.frequencyUnit })));
    }

    // Obtener candidatos cuya nextRun <= now (filtramos endDate en memoria para soportar fechas tipo 'date' almacenadas a medianoche)
    const candidates = await prisma.recurringTransaction.findMany({ where: { isActive: true, nextRun: { lte: now } }, include: { category: true } });

    const skipped = [];
    const pending = candidates.filter(r => {
      if (!r.endDate) return true;
      const end = endOfDay(new Date(r.endDate));
      const ok = !isBefore(end, now);
      if (!ok) skipped.push({ id: r.id, title: r.title, endDate: r.endDate?.toISOString() });
      return ok;
    });

    console.log(`[recurringService] candidates: ${candidates.length}, pending after endDate filter: ${pending.length}, skipped by endDate: ${skipped.length}`);
    if (skipped.length > 0) console.log('[recurringService] skipped recurrentes (endDate pasado):', skipped);

    const results = { processed: 0, failed: 0, transactions: [] };

    for (const recurring of pending) {
      try {
        const txDate = recurring.nextRun || now;
        // Prevención de duplicados: comprobar si ya existe una transacción similar
        // para el mismo usuario en el mismo día (heurística). Si existe, omitimos
        // la creación para evitar cargos duplicados cuando el job se solapa.
        const existingTx = await prisma.transaction.findFirst({
          where: {
            userId: recurring.userId,
            title: recurring.title,
            amount: recurring.amount,
            categoryId: recurring.categoryId,
            date: { gte: startOfDay(txDate), lte: endOfDay(txDate) },
          },
        });

        if (existingTx) {
          console.log(`[recurringService] Se detectó transacción existente para recurringId=${recurring.id} en la fecha ${txDate.toISOString()}, omitiendo creación (id: ${existingTx.id})`);
        } else {
          const transaction = await prisma.transaction.create({ data: { title: recurring.title, type: recurring.type, amount: recurring.amount, date: txDate, description: recurring.description, categoryId: recurring.categoryId, userId: recurring.userId } });

          // Calcular la próxima ejecución

          const newNext = calculateNextRun(recurring.nextRun || txDate, recurring.frequencyValue, recurring.frequencyUnit);

          const updateData = { lastRunAt: new Date(), nextRun: newNext };
          // Si existe endDate y newNext > endDate (tratada como fin del día) => desactivar
          if (recurring.endDate && isAfter(newNext, endOfDay(new Date(recurring.endDate)))) {
            updateData.isActive = false;
          }

          await prisma.recurringTransaction.update({ where: { id: recurring.id }, data: updateData });

          // Notificar al usuario si aplica
          if (recurring.notifyOnRun) {
            try {
              await notificationService.sendToUser(recurring.userId, { notification: { title: `Transacción creada: ${recurring.title}`, body: `Se ha creado una transacción recurrente por ${recurring.amount}` }, data: { recurringId: recurring.id } });
            } catch (nerr) {
              console.warn('Fallo notificación al procesar recurrente', recurring.id, nerr?.message || nerr);
            }
          }

          // Emitir evento SSE al usuario para que la UI pueda refrescarse automáticamente
          try {
            sseService.broadcastToUser(recurring.userId, 'transaction_created', transaction);
          } catch (e) {
            console.warn('[recurringService] fallo al emitir evento SSE', e?.message || e);
          }

          results.processed++;
          results.transactions.push(transaction);
        }
        // Si se detectó transacción existente, contarlo como procesada/omitida
        if (existingTx) {
          results.processed++;
        }
      } catch (error) {
        console.error(`Error procesando transacción recurrente ${recurring.id}:`, error);
        results.failed++;
      }
    }

    return results;
  } catch (error) {
    console.error('Error en processRecurringTransactions:', error);
    throw error;
  }
};

/**
 * Ejecutar ahora una recurrente específica (run-now)
 */
export const runNow = async (userId, recurringId) => {
  try {
    const recurring = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, userId } });
    if (!recurring) { const err = new Error('Transacción recurrente no encontrada'); err.status = 404; throw err; }

    const txDate = new Date();
    // Prevención de duplicados: comprobar si ya existe una transacción similar
    // para el mismo usuario en el mismo día. Si existe, actualizamos nextRun
    // y devolvemos la transacción existente.
    const existingTx = await prisma.transaction.findFirst({
      where: {
        userId: recurring.userId,
        title: recurring.title,
        amount: recurring.amount,
        categoryId: recurring.categoryId,
        date: { gte: startOfDay(txDate), lte: endOfDay(txDate) },
      },
    });

    const newNext = calculateNextRun(recurring.nextRun || txDate, recurring.frequencyValue, recurring.frequencyUnit);
    const updateData = { lastRunAt: new Date(), nextRun: newNext };
    if (recurring.endDate && isAfter(newNext, endOfDay(new Date(recurring.endDate)))) updateData.isActive = false;
    await prisma.recurringTransaction.update({ where: { id: recurring.id }, data: updateData });

    if (existingTx) {
      console.log(`[recurringService] runNow: transacción existente encontrada para recurringId=${recurringId}, devolviendo existente id=${existingTx.id}`);
      // Emitir SSE para la UI con la transacción existente
      try { sseService.broadcastToUser(recurring.userId, 'transaction_created', existingTx); } catch (e) { console.warn('[recurringService] fallo SSE runNow existingTx', e?.message || e); }
      return existingTx;
    }

    const transaction = await prisma.transaction.create({ data: { title: recurring.title, type: recurring.type, amount: recurring.amount, date: txDate, description: recurring.description, categoryId: recurring.categoryId, userId: recurring.userId } });

    if (recurring.notifyOnRun) {
      try { await notificationService.sendToUser(recurring.userId, { notification: { title: `Transacción creada: ${recurring.title}`, body: `Se ha creado una transacción recurrente por ${recurring.amount}` }, data: { recurringId: recurring.id } }); } catch (nerr) { console.warn('Fallo notificación runNow', nerr?.message || nerr); }
    }

    // Emitir SSE para la UI
    try { sseService.broadcastToUser(recurring.userId, 'transaction_created', transaction); } catch (e) { console.warn('[recurringService] fallo SSE runNow', e?.message || e); }

    return transaction;
  } catch (error) {
    console.error('Error en runNow:', error);
    throw error;
  }
};