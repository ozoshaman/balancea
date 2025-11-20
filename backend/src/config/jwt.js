// src/config/jwt.js
// Valores por defecto para expiración de JWT según rol
const JWT_EXPIRES_IN_PREMIUM = process.env.JWT_EXPIRES_IN_PREMIUM || '30d';
const JWT_EXPIRES_IN_FREE = process.env.JWT_EXPIRES_IN_FREE || '7d';

export { JWT_EXPIRES_IN_PREMIUM, JWT_EXPIRES_IN_FREE };
