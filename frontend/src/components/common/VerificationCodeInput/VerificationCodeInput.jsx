// src/components/common/VerificationCodeInput/VerificationCodeInput.jsx
import { TextField } from '@mui/material';

const VerificationCodeInput = ({
  value,
  onChange,
  maxLength = 6,
  autoFocus = true,
  disabled = false,
}) => {
  const handleChange = (e) => {
    const newValue = e.target.value.replace(/\D/g, '');
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <TextField
      fullWidth
      label="Código de verificación"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      autoFocus={autoFocus}
      inputProps={{
        maxLength: maxLength,
        style: {
          textAlign: 'center',
          fontSize: '32px',
          letterSpacing: '12px',
          fontWeight: 'bold',
          color: '#300152',
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          '& fieldset': {
            borderColor: 'transparent',
            borderWidth: 2,
          },
          '&:hover fieldset': {
            borderColor: '#7218a8',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#300152',
            borderWidth: 2,
          },
        },
        '& .MuiInputLabel-root': {
          color: '#300152',
          fontWeight: 600,
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#300152',
        },
      }}
    />
  );
};

export default VerificationCodeInput;