// src/routes/verificationRoutes.js
import express from 'express';
import * as verificationController from '../controllers/verificationController.js';
import { 
  sendCodeValidator, 
  verifyCodeValidator, 
  resetPasswordValidator 
} from '../validators/verificationValidator.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/verification/send-email-code
 * @desc    Enviar código de verificación de email
 * @access  Public
 */
router.post(
  '/send-email-code',
  sendCodeValidator,
  handleValidationErrors,
  verificationController.sendEmailVerificationCode
);

/**
 * @route   POST /api/verification/verify-email
 * @desc    Verificar código de email
 * @access  Public
 */
router.post(
  '/verify-email',
  verifyCodeValidator,
  handleValidationErrors,
  verificationController.verifyEmailCode
);

/**
 * @route   POST /api/verification/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access  Public
 */
router.post(
  '/forgot-password',
  sendCodeValidator,
  handleValidationErrors,
  verificationController.forgotPassword
);

/**
 * @route   POST /api/verification/verify-reset-code
 * @desc    Verificar código de recuperación de contraseña
 * @access  Public
 */
router.post(
  '/verify-reset-code',
  verifyCodeValidator,
  handleValidationErrors,
  verificationController.verifyResetCode
);

/**
 * @route   POST /api/verification/reset-password
 * @desc    Restablecer contraseña
 * @access  Public
 */
router.post(
  '/reset-password',
  resetPasswordValidator,
  handleValidationErrors,
  verificationController.resetPassword
);

export default router;