// src/controllers/authController.js
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/bcryptUtils.js';
import { generateToken } from '../utils/jwtUtils.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

const prisma = new PrismaClient();

/**
 * Registrar un nuevo usuario
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return errorResponse(res, 'El email ya está registrado', 409);
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear el usuario (sin verificar)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'FREE',
        isVerified: false
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Respuesta exitosa (sin token, debe verificar email primero)
    return successResponse(res, {
      user,
      requiresVerification: true
    }, 'Usuario registrado. Por favor verifica tu email', 201);

  } catch (error) {
    console.error('Error en register:', error);
    return errorResponse(res, 'Error al registrar usuario', 500);
  }
};

/**
 * Iniciar sesión
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return errorResponse(res, 'Usuario inactivo. Contacta al administrador', 403);
    }

    // Comparar contraseñas
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    // Generar token según el rol
    const expiresIn = user.role === 'PREMIUM' 
      ? process.env.JWT_EXPIRES_IN_PREMIUM || '30d'
      : process.env.JWT_EXPIRES_IN_FREE || '7d';

    const token = generateToken(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      expiresIn
    );

    // Preparar datos del usuario (sin la contraseña)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    };

    // Respuesta exitosa
    return successResponse(res, {
      user: userData,
      token
    }, 'Inicio de sesión exitoso', 200);

  } catch (error) {
    console.error('Error en login:', error);
    return errorResponse(res, 'Error al iniciar sesión', 500);
  }
};

/**
 * Verificar token (para mantener sesión)
 */
export const verifyAuth = async (req, res) => {
  try {
    // El usuario ya está en req.user gracias al middleware authenticateToken
    return successResponse(res, {
      user: req.user
    }, 'Token válido', 200);
  } catch (error) {
    console.error('Error en verifyAuth:', error);
    return errorResponse(res, 'Error al verificar token', 500);
  }
};