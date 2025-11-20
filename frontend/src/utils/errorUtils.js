// src/utils/errorUtils.js
/**
 * Extrae errores de validación por campo del objeto de error devuelto por el servidor.
 * Espera un array en `error.data.errors` o `error.errors` con elementos { field, message }
 * Devuelve un objeto { fieldName: message }
 */
export const mapServerErrorsToForm = (error) => {
  if (!error) return null;

  const maybeErrors = error.data?.errors || error.errors || error?.data || null;

  // Si viene un array de errores formateados
  if (Array.isArray(maybeErrors)) {
    const fieldErrors = {};
    maybeErrors.forEach((e) => {
      if (e.field) fieldErrors[e.field] = e.message || e.msg || String(e);
    });
    return Object.keys(fieldErrors).length ? fieldErrors : null;
  }

  // Si viene en response.data.errors como objeto (por seguridad)
  if (maybeErrors && typeof maybeErrors === 'object' && !Array.isArray(maybeErrors)) {
    // Assumes shape { fieldName: ['msg1','msg2'] } o { fieldName: 'msg' }
    const fieldErrors = {};
    Object.keys(maybeErrors).forEach((k) => {
      const val = maybeErrors[k];
      if (Array.isArray(val)) fieldErrors[k] = val.join(' ');
      else fieldErrors[k] = String(val);
    });
    return Object.keys(fieldErrors).length ? fieldErrors : null;
  }

  return null;
};

/**
 * Formatea un mensaje legible desde el objeto de error del servidor.
 */
export const formatServerMessage = (error) => {
  if (!error) return 'Ocurrió un error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  // Si el backend devuelve { message, data } o { success:false, message }
  if (error.data && error.data.message) return error.data.message;
  if (error.response && error.response.data && error.response.data.message) return error.response.data.message;
  return JSON.stringify(error);
};
