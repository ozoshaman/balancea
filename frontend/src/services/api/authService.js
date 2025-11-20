// src/services/api/authService.js (FRONTEND)
import api from './axiosConfig';

/**
 * Registrar un nuevo usuario
 * @param {Object} userData - { email, password, firstName, lastName }
 * @returns {Promise<Object>} - { user, token }
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    // El backend devuelve { success, message, data }
    // Queremos devolver el objeto interno `data` que contiene { user, token }
    return response.data.data;
  } catch (error) {
    // El error ya viene procesado por el interceptor de axios
    const e = new Error(error.message || 'Error al registrar usuario');
    e.status = error.status || 500;
    e.data = error.data;
    throw e;
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
    return response.data.data;
  } catch (error) {
    // El error ya viene procesado por el interceptor de axios
    const e = new Error(error.message || 'Error al iniciar sesión');
    e.status = error.status || 500;
    e.data = error.data;
    throw e;
  }
};

/**
 * Verificar token (mantener sesión)
 * @returns {Promise<Object>} - { user }
 */
export const verifyToken = async () => {
  try {
    const response = await api.get('/auth/verify');
    return response.data.data;
  } catch (error) {
    // El error ya viene procesado por el interceptor de axios
    const e = new Error(error.message || 'Error al verificar token');
    e.status = error.status || 500;
    e.data = error.data;
    throw e;
  }
};

/**
 * Cerrar sesión (limpiar datos locales)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};