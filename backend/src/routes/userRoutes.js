import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Upgrade a premium (simulación de pago)
router.post('/upgrade', userController.upgradeToPremium);

export default router;

