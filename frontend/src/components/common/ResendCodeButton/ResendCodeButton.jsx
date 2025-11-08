// src/components/common/ResendCodeButton/ResendCodeButton.jsx
import { Box, Typography, Button as MuiButton } from '@mui/material';

const ResendCodeButton = ({ 
  canResend, 
  countdown, 
  onResend 
}) => {
  return (
    <Box sx={{ textAlign: 'center', mt: 3 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#ffffff',
          mb: 1,
        }}
      >
        ¿No recibiste el código?
      </Typography>
      <MuiButton
        onClick={onResend}
        disabled={!canResend}
        sx={{
          color: canResend ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
          fontWeight: 'bold',
          textDecoration: 'underline',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            textDecoration: 'underline',
          },
          '&:disabled': {
            color: 'rgba(255, 255, 255, 0.5)',
          },
        }}
      >
        {canResend 
          ? 'Reenviar código' 
          : `Espera ${countdown}s para reenviar`
        }
      </MuiButton>
    </Box>
  );
};

export default ResendCodeButton;