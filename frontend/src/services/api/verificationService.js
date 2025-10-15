// src/services/api/verificationService.js
import api from './axiosConfig';

/**
 * Enviar código de verificación de email
 */
export const sendEmailVerificationCode = async (email) => {
  try {
    const response = await api.post('/verification/send-email-code', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al enviar código' };
  }
};

/**
 * Verificar código de email
 */
export const verifyEmailCode = async (email, code) => {
  try {
    const response = await api.post('/verification/verify-email', { email, code });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al verificar código' };
  }
};

/**
 * Solicitar recuperación de contraseña
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/verification/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al solicitar recuperación' };
  }
};

/**
 * Verificar código de recuperación
 */
export const verifyResetCode = async (email, code) => {
  try {
    const response = await api.post('/verification/verify-reset-code', { email, code });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al verificar código' };
  }
};

/**
 * Restablecer contraseña
 */
export const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await api.post('/verification/reset-password', { 
      email, 
      code, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al restablecer contraseña' };
  }
};