// src/pages/Auth/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/api/verificationService';
import { Typography, Box, Alert } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

// Componentes reutilizables
import AuthContainer from '../../components/common/AuthContainer/AuthContainer.jsx';
import Input from '../../components/common/Input/Input.jsx';
import Button from '../../components/common/Button/Button.jsx';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;
  const code = location.state?.code;

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password');
    }
  }, [email, code, navigate]);

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

    if (!formData.newPassword) {
      errors.newPassword = 'La contraseña es requerida';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/\d/.test(formData.newPassword)) {
      errors.newPassword = 'La contraseña debe contener al menos un número';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await resetPassword(email, code, formData.newPassword);
      
      // Redirigir al login con mensaje de éxito
      navigate('/login', { 
        state: { 
          message: '¡Contraseña actualizada exitosamente! Por favor inicia sesión.' 
        } 
      });
    } catch (err) {
      const { mapServerErrorsToForm, formatServerMessage } = await import('../../utils/errorUtils');
      const fieldErrors = mapServerErrorsToForm(err);
      if (fieldErrors) {
        setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
      } else {
        setError(formatServerMessage(err) || 'Error al restablecer contraseña');
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer maxWidth="sm">
      {/* Ícono de Candado */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '3px solid #300152',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <LockIcon sx={{ fontSize: 56, color: '#300152' }} />
        </Box>
      </Box>

      {/* Título */}
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        sx={{
          color: '#300152',
          fontWeight: 'bold',
          mb: 2,
        }}
      >
        Nueva Contraseña
      </Typography>

      {/* Descripción */}
      <Typography 
        variant="body2" 
        align="center"
        sx={{ 
          color: '#300152',
          mb: 3,
        }}
      >
        Ingresa tu nueva contraseña
      </Typography>

      {/* Alerta de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : error?.message || JSON.stringify(error)}
        </Alert>
      )}

      {/* Formulario */}
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Input
            label="Nueva Contraseña"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            error={!!formErrors.newPassword}
            helperText={formErrors.newPassword}
            autoFocus
            autoComplete="new-password"
            showPasswordToggle
          />

          <Input
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            autoComplete="new-password"
            showPasswordToggle
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button type="submit" isLoading={isLoading}>
            Restablecer Contraseña
          </Button>
        </Box>
      </Box>
    </AuthContainer>
  );
};

export default ResetPassword;