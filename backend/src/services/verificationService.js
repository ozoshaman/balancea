// src/services/verificationService.js
import { PrismaClient } from '@prisma/client';
import { generateVerificationCode, getCodeExpirationDate } from '../utils/codeUtils.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
import { hashPassword } from '../utils/bcryptUtils.js';
import { generateToken } from '../utils/jwtUtils.js';
import { JWT_EXPIRES_IN_FREE } from '../config/jwt.js';

const prisma = new PrismaClient();

/**
 * Enviar código de verificación de email
 */
export const sendEmailVerificationCode = async (email) => {
  // Buscar usuario
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('No existe una cuenta con este email');
    err.status = 404;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error('El email ya está verificado');
    err.status = 400;
    throw err;
  }

  const code = generateVerificationCode(6);
  const expiresAt = getCodeExpirationDate(15);

  await prisma.verificationCode.create({
    data: {
      email: email.toLowerCase().trim(),
      code,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
      isUsed: false,
    },
  });

  await sendVerificationEmail(email, code, user.firstName || '');
  return true;
};

/**
 * Verificar código de email y marcar usuario como verificado
 * Devuelve { user, token }
 */
export const verifyEmailCode = async (email, code) => {
  const now = new Date();
  const record = await prisma.verificationCode.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      code,
      type: 'EMAIL_VERIFICATION',
      isUsed: false,
      expiresAt: {
        gt: now,
      },
    },
  });

  if (!record) {
    const err = new Error('Código inválido o expirado');
    err.status = 400;
    throw err;
  }

  // Marcar código como usado
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { isUsed: true },
  });

  // Marcar usuario como verificado
  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { isVerified: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  // Generar token para iniciar sesión automáticamente
  const token = generateToken({ userId: user.id, email: user.email, role: user.role }, JWT_EXPIRES_IN_FREE);

  return { user, token };
};

/**
 * Solicitar recuperación de contraseña
 */
export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('No existe una cuenta con este email');
    err.status = 404;
    throw err;
  }

  const code = generateVerificationCode(6);
  const expiresAt = getCodeExpirationDate(15);

  await prisma.verificationCode.create({
    data: {
      email: email.toLowerCase().trim(),
      code,
      type: 'PASSWORD_RESET',
      expiresAt,
      isUsed: false,
    },
  });

  await sendPasswordResetEmail(email, code, user.firstName || '');
  return true;
};

/**
 * Verificar código de recuperación
 */
export const verifyResetCode = async (email, code) => {
  const now = new Date();
  const record = await prisma.verificationCode.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      code,
      type: 'PASSWORD_RESET',
      isUsed: false,
      expiresAt: { gt: now },
    },
  });

  if (!record) {
    const err = new Error('Código inválido o expirado');
    err.status = 400;
    throw err;
  }

  // Marcar código como usado
  await prisma.verificationCode.update({ where: { id: record.id }, data: { isUsed: true } });
  return true;
};

/**
 * Restablecer contraseña usando código
 */
export const resetPassword = async (email, code, newPassword) => {
  const now = new Date();
  const record = await prisma.verificationCode.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      code,
      type: 'PASSWORD_RESET',
      isUsed: false,
      expiresAt: { gt: now },
    },
  });

  if (!record) {
    const err = new Error('Código inválido o expirado');
    err.status = 400;
    throw err;
  }

  // Hashear nueva contraseña
  const hashedPassword = await hashPassword(newPassword);

  // Actualizar contraseña del usuario
  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { password: hashedPassword },
    select: { id: true, email: true },
  });

  // Marcar código como usado
  await prisma.verificationCode.update({ where: { id: record.id }, data: { isUsed: true } });

  return true;
};
