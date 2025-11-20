// src/services/api/axiosConfig.js
import axios from 'axios';

// Determinar baseURL según el entorno de bundler (Vite usa import.meta.env, CRA/webpack usa process.env)
let env = (typeof process !== 'undefined' && process.env) ? process.env : {};
try {
  if (import.meta && import.meta.env) {
    env = import.meta.env;
  }
} catch (e) {
  // import.meta no disponible in this environment — keep process.env
}

const baseURL = env.REACT_APP_API_URL || env.VITE_API_URL || 'http://localhost:5000/api';

// Flag de desarrollo segura (soporta varios bundlers/envs)
const isDev = Boolean(
  (env && (env.DEV === 'true' || env.DEV === true)) ||
  env.NODE_ENV === 'development' ||
  env.MODE === 'development' ||
  env.VITE_DEV === 'true' ||
  env.REACT_APP_ENV === 'development'
);

// Crear instancia de Axios
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitud: Agregar token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: Manejo de errores mejorado
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, retornarla directamente
    return response;
  },
  (error) => {
    // Crear objeto de error estructurado
    const customError = {
      message: 'Error en la solicitud',
      status: error.response?.status || 500,
      data: null,
    };

    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      customError.status = error.response.status;
      
      // Extraer el mensaje de error del backend
      if (error.response.data?.message) {
        customError.message = error.response.data.message;
      } else if (error.response.data?.error) {
        customError.message = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        customError.message = error.response.data;
      }
      
      customError.data = error.response.data;

      // Manejo específico de errores comunes
      switch (error.response.status) {
        case 400:
          // Bad Request - validación fallida
          if (!customError.message || customError.message === 'Error en la solicitud') {
            customError.message = 'Datos inválidos. Por favor revisa la información ingresada.';
          }
          break;
        
        case 401:
          // Unauthorized - token inválido o expirado
          if (customError.message.includes('Token') || customError.message.includes('token')) {
            customError.message = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
            // Limpiar datos de autenticación
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirigir al login (se manejará en el componente)
          }
          break;
        
        case 403:
          // Forbidden - sin permisos
          if (!customError.message.includes('verifica') && !customError.message.includes('inactiva')) {
            customError.message = 'No tienes permisos para realizar esta acción.';
          }
          break;
        
        case 404:
          // Not Found
          if (!customError.message || customError.message === 'Error en la solicitud') {
            customError.message = 'Recurso no encontrado.';
          }
          break;
        
        case 409:
          // Conflict - recurso duplicado
          if (!customError.message || customError.message === 'Error en la solicitud') {
            customError.message = 'Ya existe un registro con esta información.';
          }
          break;
        
        case 500:
        case 502:
        case 503:
          // Server errors
          customError.message = 'Error en el servidor. Por favor intenta más tarde.';
          break;
        
        default:
          if (!customError.message || customError.message === 'Error en la solicitud') {
            customError.message = 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
          }
      }
    } else if (error.request) {
      // La solicitud se hizo pero no hubo respuesta
      customError.message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      customError.status = 0;
    } else {
      // Algo pasó al configurar la solicitud
      customError.message = error.message || 'Error al procesar la solicitud.';
    }

    // Log para debugging (solo en desarrollo)
    if (isDev) {
      console.error('Error de Axios:', {
        message: customError.message,
        status: customError.status,
        data: customError.data,
        originalError: error,
      });
    }

    // Rechazar la promesa con el error personalizado
    return Promise.reject(customError);
  }
);

export default api;