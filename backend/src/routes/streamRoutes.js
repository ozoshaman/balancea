// src/routes/streamRoutes.js
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import sseService from '../services/sseService.js';

const router = express.Router();

// SSE endpoint para transacciones (requiere autenticación)
router.get('/transactions', authenticateToken, (req, res) => {
  // Headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const userId = req.user.id;
  const clientId = sseService.addClient(userId, res);
  console.log('[streamRoutes] SSE cliente conectado', { clientId, userId, total: sseService.getClientsCount() });

  // Enviar un comentario inicial
  res.write(`: connected\n\n`);

  // Ping cada 30s para mantener la conexión viva
  const keepAlive = setInterval(() => {
    try { res.write(`: ping ${Date.now()}\n\n`); } catch (e) { }
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseService.removeClient(clientId);
    console.log('[streamRoutes] SSE cliente desconectado', { clientId, userId, total: sseService.getClientsCount() });
  });
});

export default router;
