// src/routes/recurringTransactionRoutes.js
import express from 'express';
import * as recurringController from '../controllers/recurringTransactionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  createRecurringValidation,
  updateRecurringValidation,
  recurringIdValidation,
  getRecurringValidation,
} from '../validators/recurringTransactionValidator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de transacciones recurrentes
router.post('/', createRecurringValidation, validate, recurringController.createRecurringTransaction);
router.get('/', getRecurringValidation, validate, recurringController.getRecurringTransactions);
router.get('/:id', recurringIdValidation, validate, recurringController.getRecurringTransactionById);
router.put('/:id', updateRecurringValidation, validate, recurringController.updateRecurringTransaction);
router.delete('/:id', recurringIdValidation, validate, recurringController.deleteRecurringTransaction);

// Endpoint para procesar transacciones recurrentes (puede ser usado por un cron job)
router.post('/process', recurringController.processRecurring);

export default router;