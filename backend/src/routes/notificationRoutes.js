// src/routes/notificationRoutes.js
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// Registrar token FCM (usuario autenticado)
router.post('/register-token', authenticateToken, notificationController.registerToken);

// Eliminar token FCM (usuario autenticado)
router.post('/remove-token', authenticateToken, notificationController.removeToken);

// Enviar notificación de prueba (solo usuarios admin)
router.post('/send-test', authenticateToken, notificationController.sendTestNotification);

// Listar tokens (admin) - útil para debugging
router.get('/tokens', authenticateToken, notificationController.listTokens);

// Enviar notificación al usuario autenticado (prueba, no admin)
router.post('/send-user-test', authenticateToken, notificationController.sendUserTestNotification);

export default router;
