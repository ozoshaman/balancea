// src/controllers/verificationController.js
import * as verificationService from '../services/verificationService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Enviar código de verificación de email
 */
export const sendEmailVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return errorResponse(res, 'El email es requerido', 400);
    }

    await verificationService.sendEmailVerificationCode(email);
    return successResponse(res, null, 'Código enviado exitosamente', 200);
  } catch (error) {
    console.error('Error en sendEmailVerificationCode:', error);
    
    if (error.status === 404) {
      return errorResponse(res, 'No existe una cuenta con este email', 404);
    }
    
    if (error.message.includes('ya verificado')) {
      return errorResponse(res, 'Este email ya está verificado', 400);
    }
    
    const status = error.status || 500;
    return errorResponse(res, error.message || 'Error al enviar código', status);
  }
};

/**
 * Verificar código de email
 */
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return errorResponse(res, 'Email y código son requeridos', 400);
    }

    const result = await verificationService.verifyEmailCode(email, code);
    return successResponse(res, result, 'Email verificado exitosamente', 200);
  } catch (error) {
    console.error('Error en verifyEmailCode:', error);
    
    if (error.status === 400) {
      return errorResponse(res, 'Código inválido o expirado. Por favor solicita uno nuevo.', 400);
    }
    
    if (error.status === 404) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    
    const status = error.status || 500;
    return errorResponse(res, error.message || 'Error al verificar código', status);
  }
};

/**
 * Solicitar recuperación de contraseña
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return errorResponse(res, 'El email es requerido', 400);
    }

    await verificationService.forgotPassword(email);
    return successResponse(res, null, 'Código de recuperación enviado', 200);
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    
    if (error.status === 404) {
      return errorResponse(res, 'No existe una cuenta con este email', 404);
    }
    
    const status = error.status || 500;
    return errorResponse(res, error.message || 'Error al solicitar recuperación', status);
  }
};

/**
 * Verificar código de recuperación
 */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return errorResponse(res, 'Email y código son requeridos', 400);
    }

    await verificationService.verifyResetCode(email, code);
    return successResponse(res, null, 'Código verificado', 200);
  } catch (error) {
    console.error('Error en verifyResetCode:', error);
    
    if (error.status === 400) {
      return errorResponse(res, 'Código inválido o expirado. Por favor solicita uno nuevo.', 400);
    }
    
    if (error.status === 404) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    
    const status = error.status || 500;
    return errorResponse(res, error.message || 'Error al verificar código', status);
  }
};

/**
 * Restablecer contraseña
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return errorResponse(res, 'Email, código y nueva contraseña son requeridos', 400);
    }
    
    if (newPassword.length < 6) {
      return errorResponse(res, 'La contraseña debe tener al menos 6 caracteres', 400);
    }

    await verificationService.resetPassword(email, code, newPassword);
    return successResponse(res, null, 'Contraseña actualizada exitosamente', 200);
  } catch (error) {
    console.error('Error en resetPassword:', error);
    
    if (error.status === 400) {
      return errorResponse(res, 'Código inválido o expirado. Por favor solicita uno nuevo.', 400);
    }
    
    if (error.status === 404) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    
    const status = error.status || 500;
    return errorResponse(res, error.message || 'Error al restablecer contraseña', status);
  }
};