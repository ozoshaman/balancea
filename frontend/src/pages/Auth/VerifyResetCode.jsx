// src/pages/Auth/VerifyResetCode.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { forgotPassword, verifyResetCode } from '../../services/api/verificationService';
import { Typography, Box, Alert } from '@mui/material';
import { VpnKey as VpnKeyIcon } from '@mui/icons-material';

// Componentes reutilizables
import AuthContainer from '../../components/common/AuthContainer/AuthContainer.jsx';
import Button from '../../components/common/Button/Button.jsx';
import VerificationCodeInput from '../../components/common/VerificationCodeInput/VerificationCodeInput.jsx';
import ResendCodeButton from '../../components/common/ResendCodeButton/ResendCodeButton.jsx';

const VerifyResetCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setError('');
      setSuccess('');
      setCanResend(false);
      setCountdown(30);

      await forgotPassword(email);
      setSuccess('Código reenviado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al reenviar código');
      setCanResend(true);
      setCountdown(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);

    try {
      await verifyResetCode(email, code);
      
      setSuccess('¡Código verificado! Redirigiendo...');
      
      // Redirigir a la página de restablecer contraseña
      setTimeout(() => {
        navigate('/reset-password', { 
          state: { email, code } 
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Código inválido o expirado');
      setIsVerifying(false);
    }
  };

  return (
    <AuthContainer maxWidth="sm">
      {/* Ícono de Llave */}
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
          <VpnKeyIcon sx={{ fontSize: 56, color: '#300152' }} />
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
        Verifica tu Identidad
      </Typography>

      {/* Descripción */}
      <Typography 
        variant="body2" 
        align="center"
        sx={{ 
          color: '#300152',
          mb: 1,
        }}
      >
        Ingresa el código de 6 dígitos enviado a:
      </Typography>
      <Typography 
        variant="body1" 
        align="center"
        sx={{ 
          color: '#300152',
          fontWeight: 'bold',
          mb: 3,
        }}
      >
        {email}
      </Typography>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Formulario */}
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <VerificationCodeInput
            value={code}
            onChange={setCode}
            disabled={isVerifying}
          />
        </Box>

        <Button 
          type="submit" 
          isLoading={isVerifying}
          disabled={code.length !== 6}
        >
          Verificar
        </Button>

        <ResendCodeButton
          canResend={canResend}
          countdown={countdown}
          onResend={handleResendCode}
        />
      </Box>
    </AuthContainer>
  );
};

export default VerifyResetCode;