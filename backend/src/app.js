// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import routes from './routes/index.js';

const app = express();

// Middlewares de seguridad
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (configurable)
const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutos por defecto
const rateMax = Number(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'development' ? 1000 : 100);

const limiter = rateLimit({
  windowMs: rateWindowMs,
  max: rateMax,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde'
});

app.use('/api/', limiter);
console.log(`🔒 Rate limiter: max=${rateMax} windowMs=${rateWindowMs} (NODE_ENV=${process.env.NODE_ENV})`);

// Rutas
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Balancea',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      verify: 'GET /api/auth/verify'
    }
  });
});

// Manejo de rutas no encontradas (debe estar después de todas las rutas)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

export default app;