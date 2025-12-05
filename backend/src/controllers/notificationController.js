// src/controllers/notificationController.js
import * as notificationService from '../services/notificationService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Registrar token FCM para el usuario autenticado
 */
export const registerToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token) return errorResponse(res, 'Token requerido', 400);

    const userId = req.user?.id || null;

    console.log('[notificationController] registerToken request', { userId, token: token?.substring(0,24) + '...', platform });

    const result = await notificationService.registerToken({ token, userId, platform });
    return successResponse(res, { result }, 'Token registrado correctamente');
  } catch (error) {
    console.error('notificationController.registerToken:', error);
    return errorResponse(res, 'Error registrando token', 500);
  }
};

/**
 * Eliminar token FCM
 */
export const removeToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return errorResponse(res, 'Token requerido', 400);

    console.log('[notificationController] removeToken request', { userId: req.user?.id, token: token?.substring(0,24) + '...' });

    const result = await notificationService.removeToken(token);
    return successResponse(res, { result }, 'Token eliminado correctamente');
  } catch (error) {
    console.error('notificationController.removeToken:', error);
    return errorResponse(res, 'Error eliminando token', 500);
  }
};

/**
 * Endpoint para que un admin envíe una notificación de prueba
 */
export const sendTestNotification = async (req, res) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'ADMIN') {
      return errorResponse(res, 'Acceso denegado', 403);
    }

    const { title, body, data, userId, token } = req.body;

    if (!title && !body) return errorResponse(res, 'title o body requerido', 400);

    const payload = {
      notification: {
        title: title || 'Balancea',
        body: body || ''
      },
      data: data || {}
    };

    let result;

    if (token) {
      result = await notificationService.sendToToken(token, payload);
    } else if (userId) {
      result = await notificationService.sendToUser(userId, payload);
    } else {
      result = await notificationService.sendToAll(payload);
    }

    return successResponse(res, 'Notificación enviada', { result });
  } catch (error) {
    console.error('notificationController.sendTestNotification:', error);
    return errorResponse(res, 'Error enviando notificación', 500);
  }
};

/**
 * Listar tokens registrados (solo admin)
 */
export const listTokens = async (req, res) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'ADMIN') {
      return errorResponse(res, 'Acceso denegado', 403);
    }

    const tokens = await notificationService.listAllTokens();
    return successResponse(res, tokens, 'Tokens obtenidos');
  } catch (error) {
    console.error('notificationController.listTokens:', error);
    return errorResponse(res, 'Error obteniendo tokens', 500);
  }
};

/**
 * Enviar notificación de prueba al usuario autenticado (no requiere admin)
 */
export const sendUserTestNotification = async (req, res) => {
  try {
    const user = req.user;
    const { title, body, data } = req.body;

    if (!user) return errorResponse(res, 'Usuario no autenticado', 401);

    const payload = {
      notification: {
        title: title || 'Prueba Balancea',
        body: body || 'Notificación de prueba'
      },
      data: data || { url: '/dashboard' }
    };

    console.log('[notificationController] sendUserTestNotification', { userId: user.id, payload: payload.notification });

    const result = await notificationService.sendToUser(user.id, payload);

    return successResponse(res, { result }, 'Notificación enviada al usuario (prueba)');
  } catch (error) {
    console.error('notificationController.sendUserTestNotification:', error);
    return errorResponse(res, 'Error enviando notificación de prueba', 500);
  }
};
