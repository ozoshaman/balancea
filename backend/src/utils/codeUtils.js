// src/utils/codeUtils.js

/**
 * Genera un código numérico aleatorio
 * @param {number} length - Longitud del código (default: 6)
 * @returns {string} - Código generado
 */
export const generateVerificationCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/**
 * Calcula la fecha de expiración del código
 * @param {number} minutes - Minutos hasta expiración (default: 15)
 * @returns {Date} - Fecha de expiración
 */
export const getCodeExpirationDate = (minutes = 15) => {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60000);
};