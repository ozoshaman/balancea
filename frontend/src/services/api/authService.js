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
    return response.data;
  } catch (error) {
    // El error ya viene procesado por el interceptor de axios
    throw {
      message: error.message || 'Error al registrar usuario',
      status: error.status || 500,
      data: error.data
    };
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
    // El error ya viene procesado por el interceptor de axios
    throw {
      message: error.message || 'Error al iniciar sesión',
      status: error.status || 500,
      data: error.data
    };
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
    // El error ya viene procesado por el interceptor de axios
    throw {
      message: error.message || 'Error al verificar token',
      status: error.status || 500,
      data: error.data
    };
  }
};

/**
 * Cerrar sesión (limpiar datos locales)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};