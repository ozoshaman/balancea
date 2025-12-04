import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

const prisma = new PrismaClient();

export const upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: 'PREMIUM' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
    });

    return successResponse(res, updated, 'Usuario actualizado a PREMIUM');
  } catch (error) {
    console.error('Error en upgradeToPremium:', error);
    return errorResponse(res, error.message || 'Error actualizando usuario', error.status || 500);
  }
};
