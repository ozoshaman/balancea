// src/utils/jwtUtils.js
import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @param {string} expiresIn - Tiempo de expiración
 * @returns {string} - Token JWT
 */
export const generateToken = (payload, expiresIn = null) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  const options = expiresIn ? { expiresIn } : {};
  
  return jwt.sign(payload, secret, options);
};

/**
 * Verifica un token JWT
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload decodificado
 */
export const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar el token');
  }
};

/**
 * Decodifica un token sin verificarlo
 * @param {string} token - Token a decodificar
 * @returns {Object} - Payload decodificado
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};