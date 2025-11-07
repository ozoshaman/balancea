// src/pages/Auth/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { sendEmailVerificationCode } from '../../services/api/verificationService';
import { Typography, Box, Grid, Alert } from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';

// Componentes reutilizables
import AuthContainer from '../../components/common/AuthContainer/AuthContainer.jsx';
import AuthAvatar from '../../components/common/AuthAvatar/AuthAvatar.jsx';
import Input from '../../components/common/Input/Input.jsx';
import Button from '../../components/common/Button/Button.jsx';
import AuthLink from '../../components/common/AuthLink/AuthLink.jsx';
import TermsCheckbox from '../../components/common/TermsCheckbox/TermsCheckbox.jsx';
import TermsModal from '../../components/common/TermsModal/TermsModal.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const { name, value, checked } = e.target;
    const newValue = name === 'acceptTerms' ? checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
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

    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/\d/.test(formData.password)) {
      errors.password = 'La contraseña debe contener al menos un número';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { confirmPassword, acceptTerms, ...userData } = formData;
      await register(userData);
      
      // Enviar código de verificación
      await sendEmailVerificationCode(formData.email);
      
      // Redirigir a página de verificación
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthContainer>
      <AuthAvatar icon={PersonAddOutlined} />

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
        Crear Cuenta
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Fila 1: Nombre y Apellido */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Input
                label="Nombre"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                autoFocus
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Input
                label="Apellido"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
              />
            </Box>
          </Box>

          {/* Fila 2: Correo (ancho completo) */}
          <Box sx={{ width: '100%' }}>
            <Input
              label="Correo"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              autoComplete="email"
            />
          </Box>

          {/* Fila 3: Contraseña y Confirmar Contraseña */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Input
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                autoComplete="new-password"
                showPasswordToggle
              />
            </Box>
            <Box sx={{ flex: 1 }}>
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
          </Box>

          {/* Fila 4: Checkbox de términos */}
          <Box sx={{ width: '100%' }}>
            <TermsCheckbox
              checked={formData.acceptTerms}
              onChange={handleChange}
              error={formErrors.acceptTerms}
              onTermsClick={() => setTermsModalOpen(true)}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Button type="submit" isLoading={isLoading || isSubmitting}>
            Registrarse
          </Button>
        </Box>

        <AuthLink to="/login" align="center">
          ¿Ya tienes cuenta? Inicia sesión aquí
        </AuthLink>
      </Box>

      <TermsModal open={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </AuthContainer>
  );
};

export default Register;