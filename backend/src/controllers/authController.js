// src/controllers/authController.js
import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Registrar un nuevo usuario
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const result = await authService.registerUser({ email, password, firstName, lastName });

    return successResponse(res, result, 'Usuario registrado. Por favor verifica tu email', 201);
  } catch (error) {
    console.error('Error en register:', error);
    
    // Manejo específico de errores conocidos
    if (error.status === 409) {
      return errorResponse(res, 'Este email ya está registrado. Por favor usa otro o inicia sesión.', 409);
    }
    
    if (error.message.includes('email')) {
      return errorResponse(res, error.message, 400);
    }
    
    const status = error.status || 500;
    return errorResponse(res, error.message || 'Error al registrar usuario', status);
  }
};

/**
 * Iniciar sesión
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    return successResponse(res, { user, token }, 'Inicio de sesión exitoso', 200);
  } catch (error) {
    console.error('Error en login:', error);
    
    // Manejo específico de errores de autenticación
    if (error.status === 401) {
      return errorResponse(res, 'Email o contraseña incorrectos', 401);
    }
    
    if (error.status === 403) {
      return errorResponse(res, 'Tu cuenta está inactiva. Por favor contacta al administrador.', 403);
    }
    
    if (error.message.includes('verificado') || error.message.includes('verifica')) {
      return errorResponse(res, 'Por favor verifica tu email antes de iniciar sesión', 403);
    }
    
    const status = error.status || 500;
    return errorResponse(res, error.message || 'Error al iniciar sesión', status);
  }
};

/**
 * Verificar token (para mantener sesión)
 */
export const verifyAuth = async (req, res) => {
  try {
    // El usuario ya está en req.user gracias al middleware authenticateToken
    return successResponse(res, {
      user: req.user,
    }, 'Token válido', 200);
  } catch (error) {
    console.error('Error en verifyAuth:', error);
    return errorResponse(res, 'Token inválido o expirado', 401);
  }
};