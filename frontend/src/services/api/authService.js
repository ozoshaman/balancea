// src/services/api/authService.js
import api from './axiosConfig';

/**
 * Registrar un nuevo usuario
 * @param {Object} userData - { email, password, firstName, lastName }
 * @returns {Promise<Object>} - { user, token }
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al registrar usuario' };
  }
};

/**
 * Iniciar sesión
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} - { user, token }
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al iniciar sesión' };
  }
};

/**
 * Verificar token (mantener sesión)
 * @returns {Promise<Object>} - { user }
 */
export const verifyToken = async () => {
  try {
    const response = await api.get('/auth/verify');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al verificar token' };
  }
};

/**
 * Cerrar sesión (limpiar datos locales)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};