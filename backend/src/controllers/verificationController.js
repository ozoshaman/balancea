// src/controllers/verificationController.js
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import { generateVerificationCode, getCodeExpirationDate } from '../utils/codeUtils.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { hashPassword } from '../utils/bcryptUtils.js';

const prisma = new PrismaClient();

/**
 * Enviar código de verificación de email
 */
export const sendEmailVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar que el usuario existe y no está verificado
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    if (user.isVerified) {
      return errorResponse(res, 'La cuenta ya está verificada', 400);
    }

    // Verificar cooldown (30 segundos entre envíos)
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: 'EMAIL_VERIFICATION',
        createdAt: {
          gte: new Date(Date.now() - 30000) // Últimos 30 segundos
        }
      }
    });

    if (recentCode) {
      return errorResponse(res, 'Debes esperar 30 segundos antes de reenviar el código', 429);
    }

    // Generar código
    const code = generateVerificationCode(6);
    const expiresAt = getCodeExpirationDate(15);

    // Guardar código en la base de datos
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'EMAIL_VERIFICATION',
        expiresAt
      }
    });

    // Enviar email
    await sendVerificationEmail(email, code, user.firstName);

    return successResponse(res, null, 'Código de verificación enviado al correo', 200);

  } catch (error) {
    console.error('Error en sendEmailVerificationCode:', error);
    return errorResponse(res, 'Error al enviar código de verificación', 500);
  }
};

/**
 * Verificar código de email
 */
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Buscar el código más reciente no usado
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'EMAIL_VERIFICATION',
        isUsed: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!verificationCode) {
      return errorResponse(res, 'Código inválido', 400);
    }

    // Verificar si expiró
    if (new Date() > verificationCode.expiresAt) {
      return errorResponse(res, 'El código ha expirado', 400);
    }

    // Marcar código como usado
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true }
    });

    // Activar usuario
    const user = await prisma.user.update({
      where: { email },
      data: { isVerified: true }
    });

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified
      }
    }, 'Email verificado exitosamente', 200);

  } catch (error) {
    console.error('Error en verifyEmailCode:', error);
    return errorResponse(res, 'Error al verificar código', 500);
  }
};

/**
 * Solicitar recuperación de contraseña
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Por seguridad, siempre respondemos lo mismo aunque el usuario no exista
    if (!user) {
      return successResponse(res, null, 'Si el email existe, recibirás un código de recuperación', 200);
    }

    if (!user.isVerified) {
      return errorResponse(res, 'Debes verificar tu cuenta primero', 403);
    }

    // Verificar cooldown
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: 'PASSWORD_RESET',
        createdAt: {
          gte: new Date(Date.now() - 30000)
        }
      }
    });

    if (recentCode) {
      return errorResponse(res, 'Debes esperar 30 segundos antes de reenviar el código', 429);
    }

    // Generar código
    const code = generateVerificationCode(6);
    const expiresAt = getCodeExpirationDate(15);

    // Guardar código
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'PASSWORD_RESET',
        expiresAt
      }
    });

    // Enviar email
    await sendPasswordResetEmail(email, code, user.firstName);

    return successResponse(res, null, 'Código de recuperación enviado al correo', 200);

  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return errorResponse(res, 'Error al procesar solicitud', 500);
  }
};

/**
 * Verificar código de recuperación de contraseña
 */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Buscar el código
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'PASSWORD_RESET',
        isUsed: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!verificationCode) {
      return errorResponse(res, 'Código inválido', 400);
    }

    // Verificar si expiró
    if (new Date() > verificationCode.expiresAt) {
      return errorResponse(res, 'El código ha expirado', 400);
    }

    // No marcamos como usado aún, eso lo haremos al cambiar la contraseña
    return successResponse(res, { email }, 'Código verificado correctamente', 200);

  } catch (error) {
    console.error('Error en verifyResetCode:', error);
    return errorResponse(res, 'Error al verificar código', 500);
  }
};

/**
 * Restablecer contraseña
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Verificar código nuevamente
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'PASSWORD_RESET',
        isUsed: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!verificationCode) {
      return errorResponse(res, 'Código inválido', 400);
    }

    if (new Date() > verificationCode.expiresAt) {
      return errorResponse(res, 'El código ha expirado', 400);
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Marcar código como usado
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true }
    });

    return successResponse(res, null, 'Contraseña actualizada exitosamente', 200);

  } catch (error) {
    console.error('Error en resetPassword:', error);
    return errorResponse(res, 'Error al restablecer contraseña', 500);
  }
};