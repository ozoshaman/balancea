// src/services/recurringTransactionService.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      frequency,
      startDate,
      endDate,
    } = recurringData;

    // Obtener el usuario para verificar su plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Contar transacciones recurrentes activas del usuario
    const activeRecurringCount = await prisma.recurringTransaction.count({
      where: { userId, isActive: true },
    });

    // Validar límite según el plan (FREE: 2, PREMIUM: 5)
    const limit = user.role === 'FREE' ? 2 : 5;
    if (activeRecurringCount >= limit) {
      const err = new Error(
        `Has alcanzado el límite de ${limit} transacciones recurrentes activas. ${
          user.role === 'FREE' ? 'Actualiza a Premium para crear más.' : ''
        }`
      );
      err.status = 403;
      throw err;
    }

    // Validar categoría
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

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

    // Calcular la próxima ejecución
    const nextRun = calculateNextRun(new Date(startDate), frequency);

    // Crear transacción recurrente
    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        title: title.trim(),
        type,
        amount: parseFloat(amount),
        description: description?.trim() || null,
        categoryId,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextRun,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            isDefault: true,
          },
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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            isDefault: true,
          },
        },
      },
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

/**
 * Obtener una transacción recurrente por ID
 */
export const getRecurringTransactionById = async (userId, recurringId) => {
  try {
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: recurringId,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            isDefault: true,
          },
        },
      },
    });

    if (!recurringTransaction) {
      const err = new Error('Transacción recurrente no encontrada');
      err.status = 404;
      throw err;
    }

    return recurringTransaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en getRecurringTransactionById:', error);
    const err = new Error('Error al obtener la transacción recurrente');
    err.status = 500;
    throw err;
  }
};

/**
 * Actualizar una transacción recurrente
 */
export const updateRecurringTransaction = async (userId, recurringId, updateData) => {
  try {
    // Verificar que existe y pertenece al usuario
    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        id: recurringId,
        userId,
      },
    });

    if (!existing) {
      const err = new Error('Transacción recurrente no encontrada');
      err.status = 404;
      throw err;
    }

    // Validar categoría si se actualiza
    if (updateData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: updateData.categoryId,
          userId,
        },
      });

      if (!category) {
        const err = new Error('Categoría no encontrada');
        err.status = 404;
        throw err;
      }
    }

    // Validar monto si se actualiza
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      const err = new Error('El monto debe ser mayor a 0');
      err.status = 400;
      throw err;
    }

    // Preparar datos
    const dataToUpdate = {};
    if (updateData.title) dataToUpdate.title = updateData.title.trim();
    if (updateData.type) dataToUpdate.type = updateData.type;
    if (updateData.amount) dataToUpdate.amount = parseFloat(updateData.amount);
    if (updateData.description !== undefined)
      dataToUpdate.description = updateData.description?.trim() || null;
    if (updateData.categoryId) dataToUpdate.categoryId = updateData.categoryId;
    if (updateData.frequency) {
      dataToUpdate.frequency = updateData.frequency;
      // Recalcular nextRun si cambia la frecuencia
      dataToUpdate.nextRun = calculateNextRun(
        existing.nextRun,
        updateData.frequency
      );
    }
    if (updateData.startDate) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined)
      dataToUpdate.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;

    const recurringTransaction = await prisma.recurringTransaction.update({
      where: { id: recurringId },
      data: dataToUpdate,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            isDefault: true,
          },
        },
      },
    });

    return recurringTransaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en updateRecurringTransaction:', error);
    const err = new Error('Error al actualizar la transacción recurrente');
    err.status = 500;
    throw err;
  }
};

/**
 * Eliminar una transacción recurrente
 */
export const deleteRecurringTransaction = async (userId, recurringId) => {
  try {
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: recurringId,
        userId,
      },
    });

    if (!recurringTransaction) {
      const err = new Error('Transacción recurrente no encontrada');
      err.status = 404;
      throw err;
    }

    await prisma.recurringTransaction.delete({
      where: { id: recurringId },
    });

    return { message: 'Transacción recurrente eliminada exitosamente' };
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en deleteRecurringTransaction:', error);
    const err = new Error('Error al eliminar la transacción recurrente');
    err.status = 500;
    throw err;
  }
};

/**
 * Procesar transacciones recurrentes pendientes (para ejecutar con un cron job)
 */
export const processRecurringTransactions = async () => {
  try {
    const now = new Date();

    // Buscar transacciones recurrentes que deben ejecutarse
    const pending = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextRun: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        category: true,
      },
    });

    const results = {
      processed: 0,
      failed: 0,
      transactions: [],
    };

    for (const recurring of pending) {
      try {
        // Crear la transacción
        const transaction = await prisma.transaction.create({
          data: {
            title: recurring.title,
            type: recurring.type,
            amount: recurring.amount,
            date: now,
            description: recurring.description,
            categoryId: recurring.categoryId,
            userId: recurring.userId,
          },
        });

        // Calcular la próxima ejecución
        const nextRun = calculateNextRun(recurring.nextRun, recurring.frequency);

        // Actualizar la transacción recurrente
        await prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { nextRun },
        });

        results.processed++;
        results.transactions.push(transaction);
      } catch (error) {
        console.error(
          `Error procesando transacción recurrente ${recurring.id}:`,
          error
        );
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
 * Función auxiliar para calcular la próxima ejecución
 */
function calculateNextRun(currentDate, frequency) {
  const date = new Date(currentDate);

  switch (frequency) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error('Frecuencia no válida');
  }

  return date;
}