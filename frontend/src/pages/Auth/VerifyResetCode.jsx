// src/pages/Auth/VerifyResetCode.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { forgotPassword, verifyResetCode } from '../../services/api/verificationService';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { VpnKey as VpnKeyIcon } from '@mui/icons-material';

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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <VpnKeyIcon sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Verifica tu Identidad
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ingresa el código de 6 dígitos enviado a:
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
              {email}
            </Typography>
          </Box>

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

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Código de verificación"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 6) {
                  setCode(value);
                }
              }}
              inputProps={{ 
                maxLength: 6,
                style: { 
                  textAlign: 'center', 
                  fontSize: '24px', 
                  letterSpacing: '8px' 
                }
              }}
              margin="normal"
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isVerifying || code.length !== 6}
              sx={{ mt: 3, mb: 2 }}
            >
              {isVerifying ? <CircularProgress size={24} /> : 'Verificar'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ¿No recibiste el código?
              </Typography>
              <Button
                onClick={handleResendCode}
                disabled={!canResend}
                sx={{ mt: 1 }}
              >
                {canResend 
                  ? 'Reenviar código' 
                  : `Espera ${countdown}s para reenviar`
                }
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyResetCode;