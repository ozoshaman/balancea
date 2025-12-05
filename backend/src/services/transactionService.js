// src/services/transactionService.js
import { PrismaClient } from '@prisma/client';
import * as notificationService from './notificationService.js';

const prisma = new PrismaClient();

// Helpers para validar IDs y detectar IDs temporales generados por el cliente
const isValidMongoId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

const isTempId = (id) => {
  return typeof id === 'string' && /^(?:cat_temp_|temp_)/.test(id);
};

/**
 * Crear una nueva transacción
 */
export const createTransaction = async (userId, transactionData) => {
  try {
    const { title, type, amount, date, description, categoryId } = transactionData;

    // ⚠️ VALIDAR QUE NO SEA UN ID TEMPORAL
    if (categoryId && isTempId(categoryId)) {
      const err = new Error('No se puede crear una transacción con una categoría temporal. Por favor sincroniza primero.');
      err.status = 400;
      throw err;
    }

    // Validar que sea un ObjectId válido si se proporcionó
    if (categoryId && !isValidMongoId(categoryId)) {
      const err = new Error('El ID de categoría no es válido');
      err.status = 400;
      throw err;
    }

    // Validar que la categoría existe y pertenece al usuario
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

    // Validar monto positivo
    if (amount <= 0) {
      const err = new Error('El monto debe ser mayor a 0');
      err.status = 400;
      throw err;
    }

    // Crear transacción
    const transaction = await prisma.transaction.create({
      data: {
        title: title.trim(),
        type,
        amount: parseFloat(amount),
        date: new Date(date),
        description: description?.trim() || null,
        categoryId,
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

    // Después de crear, verificar balance y notificar si es negativo
    try {
      console.log('[transactionService] checking balance after create for user', { userId });
      const bal = await getUserBalance(userId);
      console.log('[transactionService] balance result', { userId, balance: bal?.balance });
      if (bal && bal.balance < 0) {
        const payload = {
          notification: {
            title: 'Balance negativo',
            body: `Tu balance general es ${bal.balance.toFixed(2)}. Revisa tus finanzas.`
          },
          data: { url: '/dashboard' }
        };
        console.log('[transactionService] sending negative-balance notification', { userId, balance: bal.balance });
        // Fire and forget; capturar errores internamente
        notificationService.sendToUser(userId, payload).catch((e) => {
          console.warn('Error enviando notificación de balance negativo:', e?.message || e);
        });
      }
    } catch (err) {
      console.warn('No fue posible verificar/enviar notificación de balance:', err?.message || err);
    }

    return transaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en createTransaction:', error);
    const err = new Error('Error al crear la transacción');
    err.status = 500;
    throw err;
  }
};

/**
 * Obtener todas las transacciones del usuario
 */
export const getUserTransactions = async (userId, filters = {}) => {
  try {
    const { startDate, endDate, type, categoryId, limit, offset } = filters;

    const where = { userId };

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    let transactions;
    try {
      transactions = await prisma.transaction.findMany({
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
        orderBy: { date: 'desc' },
        take: limit ? parseInt(limit) : undefined,
        skip: offset ? parseInt(offset) : undefined,
      });
    } catch (prismaErr) {
      // Handle cases where the relation fetch fails because the related
      // Category document is missing (Prisma may throw an "Inconsistent query result" error).
      // Fallback: fetch transactions without include, then load categories separately
      console.warn('Prisma include(category) failed, falling back to manual join:', prismaErr.message);

      transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit ? parseInt(limit) : undefined,
        skip: offset ? parseInt(offset) : undefined,
      });

      // Collect categoryIds and fetch categories
      const categoryIds = [...new Set(transactions.map((t) => t.categoryId).filter(Boolean))];
      const categories = categoryIds.length
        ? await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, color: true, icon: true, isDefault: true },
          })
        : [];

      const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

      // Attach category (or null) to each transaction to match expected shape
      transactions = transactions.map((t) => ({
        ...t,
        category: categoryMap[t.categoryId] || null,
      }));
    }

    const total = await prisma.transaction.count({ where });

    return { transactions, total };
  } catch (error) {
    console.error('Error en getUserTransactions:', error);
    const err = new Error('Error al obtener las transacciones');
    err.status = 500;
    throw err;
  }
};

/**
 * Obtener una transacción por ID
 */
export const getTransactionById = async (userId, transactionId) => {
  try {
    let transaction;
    try {
      transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
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
    } catch (prismaErr) {
      console.warn('Prisma include(category) failed for getTransactionById, falling back:', prismaErr.message);
      transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
        },
      });

      if (transaction) {
        const cat = transaction.categoryId
          ? await prisma.category.findUnique({
              where: { id: transaction.categoryId },
              select: { id: true, name: true, color: true, icon: true, isDefault: true },
            })
          : null;

        transaction = { ...transaction, category: cat || null };
      }
    }

    if (!transaction) {
      const err = new Error('Transacción no encontrada');
      err.status = 404;
      throw err;
    }

    return transaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en getTransactionById:', error);
    const err = new Error('Error al obtener la transacción');
    err.status = 500;
    throw err;
  }
};

/**
 * Actualizar una transacción
 */
export const updateTransaction = async (userId, transactionId, updateData) => {
  try {
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!existingTransaction) {
      const err = new Error('Transacción no encontrada');
      err.status = 404;
      throw err;
    }

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

    if (updateData.amount !== undefined && updateData.amount <= 0) {
      const err = new Error('El monto debe ser mayor a 0');
      err.status = 400;
      throw err;
    }

    const dataToUpdate = {};
    if (updateData.title) dataToUpdate.title = updateData.title.trim();
    if (updateData.type) dataToUpdate.type = updateData.type;
    if (updateData.amount) dataToUpdate.amount = parseFloat(updateData.amount);
    if (updateData.date) dataToUpdate.date = new Date(updateData.date);
    if (updateData.description !== undefined)
      dataToUpdate.description = updateData.description?.trim() || null;
    if (updateData.categoryId) dataToUpdate.categoryId = updateData.categoryId;

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
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

    // Después de actualizar, verificar balance y notificar si es negativo
    try {
      console.log('[transactionService] checking balance after update for user', { userId });
      const bal = await getUserBalance(userId);
      console.log('[transactionService] balance result (update)', { userId, balance: bal?.balance });
      if (bal && bal.balance < 0) {
        const payload = {
          notification: {
            title: 'Balance negativo',
            body: `Tu balance general es ${bal.balance.toFixed(2)}. Revisa tus finanzas.`
          },
          data: { url: '/dashboard' }
        };
        console.log('[transactionService] sending negative-balance notification (update)', { userId, balance: bal.balance });
        notificationService.sendToUser(userId, payload).catch((e) => {
          console.warn('Error enviando notificación de balance negativo:', e?.message || e);
        });
      }
    } catch (err) {
      console.warn('No fue posible verificar/enviar notificación de balance (update):', err?.message || err);
    }

    return transaction;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en updateTransaction:', error);
    const err = new Error('Error al actualizar la transacción');
    err.status = 500;
    throw err;
  }
};

/**
 * Eliminar una transacción
 */
export const deleteTransaction = async (userId, transactionId) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      const err = new Error('Transacción no encontrada');
      err.status = 404;
      throw err;
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    // Después de eliminar, verificar balance y notificar si es negativo
    try {
      console.log('[transactionService] checking balance after delete for user', { userId });
      const bal = await getUserBalance(userId);
      console.log('[transactionService] balance result (delete)', { userId, balance: bal?.balance });
      if (bal && bal.balance < 0) {
        const payload = {
          notification: {
            title: 'Balance negativo',
            body: `Tu balance general es ${bal.balance.toFixed(2)}. Revisa tus finanzas.`
          },
          data: { url: '/dashboard' }
        };
        console.log('[transactionService] sending negative-balance notification (delete)', { userId, balance: bal.balance });
        notificationService.sendToUser(userId, payload).catch((e) => {
          console.warn('Error enviando notificación de balance negativo:', e?.message || e);
        });
      }
    } catch (err) {
      console.warn('No fue posible verificar/enviar notificación de balance (delete):', err?.message || err);
    }

    return { message: 'Transacción eliminada exitosamente' };
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en deleteTransaction:', error);
    const err = new Error('Error al eliminar la transacción');
    err.status = 500;
    throw err;
  }
};

/**
 * Obtener estadísticas del usuario
 */
export const getUserStats = async (userId, filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    const where = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const totalIncome = await prisma.transaction.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
    });

    const totalExpense = await prisma.transaction.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true }, 
    });

    const income = totalIncome._sum.amount || 0;
    const expense = totalExpense._sum.amount || 0;
    const balance = income - expense;

    const transactionsByCategory = await prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = [...new Set(transactionsByCategory.map((t) => t.categoryId))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true, icon: true, isDefault: true },
    });

    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    const categoriesWithStats = transactionsByCategory.map((item) => ({
      category: categoryMap[item.categoryId],
      type: item.type,
      total: item._sum.amount,
      count: item._count,
    }));

    return {
      totalIncome: income,
      totalExpense: expense,
      balance,
      transactionsByCategory: categoriesWithStats,
    };
  } catch (error) {
    console.error('Error en getUserStats:', error);
    const err = new Error('Error al obtener las estadísticas');
    err.status = 500;
    throw err;
  }
};

/**
 * Obtener balance general del usuario
 * - totalIncome
 * - totalExpense
 * - balance (income - expense)
 */
export const getUserBalance = async (userId, filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    const where = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const totalIncome = await prisma.transaction.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
    });

    const totalExpense = await prisma.transaction.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true },
    });

    const income = totalIncome._sum.amount || 0;
    const expense = totalExpense._sum.amount || 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  } catch (error) {
    console.error('Error en getUserBalance:', error);
    const err = new Error('Error al obtener el balance del usuario');
    err.status = 500;
    throw err;
  }
};