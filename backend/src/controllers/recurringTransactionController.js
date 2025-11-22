// src/controllers/recurringTransactionController.js
import * as recurringService from '../services/recurringTransactionService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Crear una transacción recurrente
 */
export const createRecurringTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const recurring = await recurringService.createRecurringTransaction(userId, req.body);

    return successResponse(res, recurring, 'Transacción recurrente creada exitosamente', 201);
  } catch (error) {
    console.error('Error en createRecurringTransaction:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Obtener todas las transacciones recurrentes
 */
export const getRecurringTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = req.query;
    const recurring = await recurringService.getUserRecurringTransactions(userId, filters);

    return successResponse(res, recurring, 'Transacciones recurrentes obtenidas exitosamente');
  } catch (error) {
    console.error('Error en getRecurringTransactions:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Obtener una transacción recurrente por ID
 */
export const getRecurringTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const recurring = await recurringService.getRecurringTransactionById(userId, id);

    return successResponse(res, recurring, 'Transacción recurrente obtenida exitosamente');
  } catch (error) {
    console.error('Error en getRecurringTransactionById:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Actualizar una transacción recurrente
 */
export const updateRecurringTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const recurring = await recurringService.updateRecurringTransaction(userId, id, req.body);

    return successResponse(res, recurring, 'Transacción recurrente actualizada exitosamente');
  } catch (error) {
    console.error('Error en updateRecurringTransaction:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Eliminar una transacción recurrente
 */
export const deleteRecurringTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await recurringService.deleteRecurringTransaction(userId, id);

    return successResponse(res, result, 'Transacción recurrente eliminada exitosamente');
  } catch (error) {
    console.error('Error en deleteRecurringTransaction:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Procesar transacciones recurrentes pendientes (endpoint interno/admin)
 */
export const processRecurring = async (req, res) => {
  try {
    const results = await recurringService.processRecurringTransactions();

    return successResponse(res, results, 'Transacciones recurrentes procesadas');
  } catch (error) {
    console.error('Error en processRecurring:', error);
    return errorResponse(res, 'Error al procesar transacciones recurrentes', 500);
  }
};