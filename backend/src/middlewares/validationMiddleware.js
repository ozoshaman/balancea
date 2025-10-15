// src/middlewares/validationMiddleware.js
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/responseHandler.js';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    return errorResponse(res, 'Errores de validación', 400, formattedErrors);
  }
  
  next();
};