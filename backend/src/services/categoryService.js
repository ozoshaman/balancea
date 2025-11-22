// src/services/categoryService.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todas las categorías del usuario
 */
export const getUserCategories = async (userId) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return categories;
  } catch (error) {
    console.error('Error en getUserCategories:', error);
    const err = new Error('Error al obtener las categorías');
    err.status = 500;
    throw err;
  }
};

/**
 * Crear una categoría personalizada
 */
export const createCategory = async (userId, categoryData) => {
  try {
    const { name, color, icon } = categoryData;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Contar solo categorías personalizadas (no las por defecto)
    const customCategoriesCount = await prisma.category.count({
      where: { userId, isDefault: false },
    });

    // Validar límite según el plan (FREE: 3, PREMIUM: ilimitado)
    if (user.role === 'FREE' && customCategoriesCount >= 3) {
      const err = new Error(
        'Has alcanzado el límite de 3 categorías personalizadas. Actualiza a Premium para crear más.'
      );
      err.status = 403;
      throw err;
    }

    // Verificar que no exista una categoría con el mismo nombre
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        userId,
      },
    });

    if (existingCategory) {
      const err = new Error('Ya tienes una categoría con este nombre');
      err.status = 409;
      throw err;
    }

    // Crear la categoría
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color: color || '#3B82F6',
        icon: icon || '📁',
        userId,
        isDefault: false,
      },
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return category;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en createCategory:', error);
    const err = new Error('Error al crear la categoría');
    err.status = 500;
    throw err;
  }
};

/**
 * Actualizar una categoría personalizada
 */
export const updateCategory = async (userId, categoryId, updateData) => {
  try {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      const err = new Error('Categoría no encontrada');
      err.status = 404;
      throw err;
    }

    // No permitir editar categorías por defecto
    if (category.isDefault) {
      const err = new Error('No puedes editar las categorías por defecto (General y Personal)');
      err.status = 403;
      throw err;
    }

    // Si se actualiza el nombre, verificar que no exista otra con ese nombre
    if (updateData.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: updateData.name.trim(),
          userId,
          NOT: { id: categoryId },
        },
      });

      if (existingCategory) {
        const err = new Error('Ya tienes una categoría con este nombre');
        err.status = 409;
        throw err;
      }
    }

    const dataToUpdate = {};
    if (updateData.name) dataToUpdate.name = updateData.name.trim();
    if (updateData.color) dataToUpdate.color = updateData.color;
    if (updateData.icon) dataToUpdate.icon = updateData.icon;

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return updatedCategory;
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en updateCategory:', error);
    const err = new Error('Error al actualizar la categoría');
    err.status = 500;
    throw err;
  }
};

/**
 * Eliminar una categoría personalizada
 */
export const deleteCategory = async (userId, categoryId) => {
  try {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      const err = new Error('Categoría no encontrada');
      err.status = 404;
      throw err;
    }

    // No permitir eliminar categorías por defecto
    if (category.isDefault) {
      const err = new Error('No puedes eliminar las categorías por defecto (General y Personal)');
      err.status = 403;
      throw err;
    }

    // Verificar si hay transacciones usando esta categoría
    const transactionsCount = await prisma.transaction.count({
      where: { categoryId },
    });

    if (transactionsCount > 0) {
      const err = new Error(
        `No puedes eliminar esta categoría porque tiene ${transactionsCount} transacciones asociadas. Primero reasigna o elimina esas transacciones.`
      );
      err.status = 409;
      throw err;
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Categoría eliminada exitosamente' };
  } catch (error) {
    if (error.status) throw error;
    console.error('Error en deleteCategory:', error);
    const err = new Error('Error al eliminar la categoría');
    err.status = 500;
    throw err;
  }
};