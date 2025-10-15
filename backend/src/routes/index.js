// src/routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import verificationRoutes from './verificationRoutes.js';

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de verificación
router.use('/verification', verificationRoutes);

// Ruta de prueba
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API de Balancea funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

export default router;