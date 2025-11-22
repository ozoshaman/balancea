// src/controllers/transactionController.js
import * as transactionService from '../services/transactionService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Crear una transacción
 */
export const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const transaction = await transactionService.createTransaction(userId, req.body);

    return successResponse(res, transaction, 'Transacción creada exitosamente', 201);
  } catch (error) {
    console.error('Error en createTransaction:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Obtener todas las transacciones del usuario
 */
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = req.query;
    const result = await transactionService.getUserTransactions(userId, filters);

    return successResponse(res, result, 'Transacciones obtenidas exitosamente');
  } catch (error) {
    console.error('Error en getTransactions:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Obtener una transacción por ID
 */
export const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(userId, id);

    return successResponse(res, transaction, 'Transacción obtenida exitosamente');
  } catch (error) {
    console.error('Error en getTransactionById:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Actualizar una transacción
 */
export const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const transaction = await transactionService.updateTransaction(userId, id, req.body);

    return successResponse(res, transaction, 'Transacción actualizada exitosamente');
  } catch (error) {
    console.error('Error en updateTransaction:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Eliminar una transacción
 */
export const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await transactionService.deleteTransaction(userId, id);

    return successResponse(res, result, 'Transacción eliminada exitosamente');
  } catch (error) {
    console.error('Error en deleteTransaction:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Obtener estadísticas
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = req.query;
    const stats = await transactionService.getUserStats(userId, filters);

    return successResponse(res, stats, 'Estadísticas obtenidas exitosamente');
  } catch (error) {
    console.error('Error en getStats:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};