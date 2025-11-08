// src/pages/Auth/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/api/verificationService';
import { Typography, Box, Alert } from '@mui/material';
import { LockReset as LockResetIcon } from '@mui/icons-material';

// Componentes reutilizables
import AuthContainer from '../../components/common/AuthContainer/AuthContainer.jsx';
import Input from '../../components/common/Input/Input.jsx';
import Button from '../../components/common/Button/Button.jsx';
import AuthLink from '../../components/common/AuthLink/AuthLink.jsx';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('El email es requerido');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email inválido');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      
      // Redirigir a la página de verificación de código
      navigate('/verify-reset-code', { state: { email } });
    } catch (err) {
      setError(err.message || 'Error al solicitar recuperación');
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
          <LockResetIcon sx={{ fontSize: 56, color: '#300152' }} />
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
        ¿Olvidaste tu contraseña?
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
        Ingresa tu email y te enviaremos un código de recuperación
      </Typography>

      {/* Alerta de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Formulario */}
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            autoComplete="email"
          />
        </Box>

        <Button type="submit" isLoading={isLoading}>
          Enviar código
        </Button>

        <Box sx={{ mt: 3 }}>
          <AuthLink to="/login" align="center">
            Volver al inicio de sesión
          </AuthLink>
        </Box>
      </Box>
    </AuthContainer>
  );
};

export default ForgotPassword;