// src/routes/categoryRoutes.js
import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
} from '../validators/categoryValidator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de categorías
router.get('/', categoryController.getCategories);
router.post('/', createCategoryValidation, validate, categoryController.createCategory);
router.put('/:id', updateCategoryValidation, validate, categoryController.updateCategory);
router.delete('/:id', categoryIdValidation, validate, categoryController.deleteCategory);

export default router;