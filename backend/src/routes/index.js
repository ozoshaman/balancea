// src/routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import verificationRoutes from './verificationRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import recurringTransactionRoutes from './recurringTransactionRoutes.js';
import userRoutes from './userRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import streamRoutes from './streamRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Rutas
router.use('/auth', authRoutes);
router.use('/verification', verificationRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/recurring-transactions', recurringTransactionRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stream', streamRoutes);

export default router;