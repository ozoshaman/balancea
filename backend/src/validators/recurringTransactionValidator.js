// src/validators/recurringTransactionValidator.js
import { body, query, param } from 'express-validator';

export const createRecurringValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El título debe tener entre 2 y 100 caracteres'),

  body('type')
    .notEmpty()
    .withMessage('El tipo es requerido')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('El tipo debe ser INCOME o EXPENSE'),

  body('amount')
    .notEmpty()
    .withMessage('El monto es requerido')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),

  body('categoryId')
    .notEmpty()
    .withMessage('La categoría es requerida')
    .isMongoId()
    .withMessage('ID de categoría inválido'),

  body('frequency')
    .notEmpty()
    .withMessage('La frecuencia es requerida')
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .withMessage('La frecuencia debe ser DAILY, WEEKLY, MONTHLY o YEARLY'),

  body('startDate')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida'),
];

export const updateRecurringValidation = [
  param('id').isMongoId().withMessage('ID de transacción recurrente inválido'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El título debe tener entre 2 y 100 caracteres'),

  body('type')
    .optional()
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('El tipo debe ser INCOME o EXPENSE'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),

  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('ID de categoría inválido'),

  body('frequency')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .withMessage('La frecuencia debe ser DAILY, WEEKLY, MONTHLY o YEARLY'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

export const recurringIdValidation = [
  param('id').isMongoId().withMessage('ID de transacción recurrente inválido'),
];

export const getRecurringValidation = [
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive debe ser true o false'),
];