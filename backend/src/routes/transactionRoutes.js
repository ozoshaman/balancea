// src/routes/transactionRoutes.js
import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  createTransactionValidation,
  updateTransactionValidation,
  getTransactionsValidation,
  transactionIdValidation,
} from '../validators/transactionValidator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener estadísticas
router.get('/stats', getTransactionsValidation, validate, transactionController.getStats);

// CRUD de transacciones
router.post('/', createTransactionValidation, validate, transactionController.createTransaction);
router.get('/', getTransactionsValidation, validate, transactionController.getTransactions);
router.get('/:id', transactionIdValidation, validate, transactionController.getTransactionById);
router.put('/:id', updateTransactionValidation, validate, transactionController.updateTransaction);
router.delete('/:id', transactionIdValidation, validate, transactionController.deleteTransaction);

export default router;