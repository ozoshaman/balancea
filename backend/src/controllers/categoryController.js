// src/controllers/categoryController.js
import * as categoryService from '../services/categoryService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Obtener todas las categorías del usuario
 */
export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await categoryService.getUserCategories(userId);

    return successResponse(res, categories, 'Categorías obtenidas exitosamente');
  } catch (error) {
    console.error('Error en getCategories:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Crear una categoría personalizada
 */
export const createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const category = await categoryService.createCategory(userId, req.body);

    return successResponse(res, category, 'Categoría creada exitosamente', 201);
  } catch (error) {
    console.error('Error en createCategory:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Actualizar una categoría
 */
export const updateCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const category = await categoryService.updateCategory(userId, id, req.body);

    return successResponse(res, category, 'Categoría actualizada exitosamente');
  } catch (error) {
    console.error('Error en updateCategory:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};

/**
 * Eliminar una categoría
 */
export const deleteCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await categoryService.deleteCategory(userId, id);

    return successResponse(res, result, 'Categoría eliminada exitosamente');
  } catch (error) {
    console.error('Error en deleteCategory:', error);
    const status = error.status || 500;
    return errorResponse(res, error.message, status);
  }
};