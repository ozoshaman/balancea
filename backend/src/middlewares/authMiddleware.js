// src/middlewares/authMiddleware.js
import { verifyToken } from '../utils/jwtUtils.js';
import { errorResponse } from '../utils/responseHandler.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware para verificar el token JWT
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Obtener el token del header o de la query (útil para EventSource donde no se pueden enviar headers)
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token && req.query && req.query.token) token = req.query.token;

    if (!token) {
      return errorResponse(res, 'Token no proporcionado', 401);
    }

    // Verificar el token
    const decoded = verifyToken(token);

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Usuario inactivo', 403);
    }

    // Agregar usuario al request
    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Token expirado') {
      return errorResponse(res, 'Token expirado', 401);
    }
    if (error.message === 'Token inválido') {
      return errorResponse(res, 'Token inválido', 401);
    }
    return errorResponse(res, 'Error de autenticación', 500);
  }
};