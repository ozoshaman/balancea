// src/components/common/Input/Input.jsx
import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error = false,
  helperText = '',
  autoFocus = false,
  autoComplete,
  showPasswordToggle = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      type={inputType}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      variant="outlined"
      // SOLUCIÓN: Forzar que el label siempre esté en posición "shrink" cuando hay valor
      InputLabelProps={{
        shrink: value ? true : undefined,
        sx: {
          // Posicionar el label completamente por encima del borde
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
            backgroundColor: 'white',
            padding: '0 4px',
          },
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          '& fieldset': {
            borderColor: '#300152',
            borderWidth: '2px',
          },
          '&:hover fieldset': {
            borderColor: '#4a0182',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#300152',
            borderWidth: '2px',
          },
          '&.Mui-error fieldset': {
            borderColor: '#d32f2f',
          },
        },
        '& .MuiInputLabel-root': {
          color: '#300152',
          '&.Mui-focused': {
            color: '#300152',
          },
          '&.Mui-error': {
            color: '#d32f2f',
          },
        },
        '& .MuiFormHelperText-root': {
          marginLeft: 0,
        },
      }}
      slotProps={{
        input: {
          endAdornment: showPasswordToggle ? (
            <InputAdornment position="end">
              <IconButton
                onClick={handleTogglePassword}
                edge="end"
                sx={{ color: '#300152' }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      {...props}
    />
  );
};

export default Input;