// src/pages/Auth/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Typography, Box, Alert } from '@mui/material';
import { mapServerErrorsToForm } from '../../utils/errorUtils';

// Componentes reutilizables
import AuthContainer from '../../components/common/AuthContainer/AuthContainer.jsx';
import AuthAvatar from '../../components/common/AuthAvatar/AuthAvatar.jsx';
import Input from '../../components/common/Input/Input.jsx';
import Button from '../../components/common/Button/Button.jsx';
import AuthLink from '../../components/common/AuthLink/AuthLink.jsx';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      // Mapear errores de validación por campo si el backend los envió
      const fieldErrors = mapServerErrorsToForm(err);
      // Sólo aplicar fieldErrors si contienen keys de los campos del formulario
      if (fieldErrors && (fieldErrors.email || fieldErrors.password)) {
        setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
        return;
      }

      // Para errores de credenciales (401) mostramos el mensaje debajo del campo email
      if (err && err.status === 401) {
        setFormErrors((prev) => ({ ...prev, email: err.message || 'Email o contraseña incorrectos' }));
        return;
      }

      // Si no hay errores por campo, setear mensaje general en Alert vía estado global (auth slice)
    }
  };

  return (
    <AuthContainer>
      <AuthAvatar />

      <Typography
        variant="h5"
        align="center"
        gutterBottom
        sx={{
          color: '#300152',
          fontWeight: 'bold',
          mb: 3,
        }}
      >
        Bienvenido
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : error?.message || JSON.stringify(error)}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Input
            label="Correo"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            autoComplete="current-password"
            showPasswordToggle
          />

          <AuthLink to="/forgot-password" align="left">
            ¿Olvidaste tu contraseña?
          </AuthLink>
        </Box>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Button type="submit" isLoading={isLoading}>
            Ingresar
          </Button>
        </Box>

        <AuthLink to="/register" align="center">
          Crear Cuenta
        </AuthLink>
      </Box>
    </AuthContainer>
  );
};

export default Login;