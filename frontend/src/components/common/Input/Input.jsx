// src/components/common/Input.jsx
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  autoComplete,
  autoFocus = false,
  showPasswordToggle = false,
  fullWidth = true,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      name={name}
      type={inputType}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      InputProps={{
        endAdornment: showPasswordToggle ? (
          <InputAdornment position="end">
            <IconButton
              onClick={handleTogglePassword}
              edge="end"
              sx={{ color: '#300152' }}
              aria-label="toggle password visibility"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={{
        width: '100%',
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          '& fieldset': {
            borderColor: 'transparent',
          },
          '&:hover fieldset': {
            borderColor: '#300152',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#300152',
          },
        },
        '& .MuiInputLabel-root': {
          color: '#300152',
          fontWeight: 600,
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#300152',
        },
        '& .MuiFormHelperText-root': {
          backgroundColor: 'transparent',
          marginLeft: 0,
          marginRight: 0,
          height: '20px',
          minHeight: '20px',
        },
        '& .MuiInputBase-input': {
          color: '#300152',
        },
      }}
      {...props}
    />
  );
};

export default Input;