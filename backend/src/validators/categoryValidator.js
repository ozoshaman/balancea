// src/validators/categoryValidator.js
import { body, param } from 'express-validator';

export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('El color debe ser un código hexadecimal válido (ej: #3B82F6)'),

  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('El icono debe tener entre 1 y 10 caracteres'),
];

export const updateCategoryValidation = [
  param('id').isMongoId().withMessage('ID de categoría inválido'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('El color debe ser un código hexadecimal válido'),

  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('El icono debe tener entre 1 y 10 caracteres'),
];

export const categoryIdValidation = [
  param('id').isMongoId().withMessage('ID de categoría inválido'),
];