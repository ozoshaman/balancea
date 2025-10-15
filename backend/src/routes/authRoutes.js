// src/routes/authRoutes.js
import express from 'express';
import * as authController from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post(
  '/register',
  registerValidator,
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post(
  '/login',
  loginValidator,
  handleValidationErrors,
  authController.login
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar token y obtener usuario actual
 * @access  Private
 */
router.get(
  '/verify',
  authenticateToken,
  authController.verifyAuth
);

export default router;