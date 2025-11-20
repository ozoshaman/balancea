// src/components/common/Input/Input.jsx
import { useState } from 'react';
import { TextField, IconButton, InputAdornment, Typography, Box } from '@mui/material';
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
    <Box>
      {label && (
        <Typography
          component="label"
          htmlFor={name}
          sx={{
            display: 'block',
            mb: 0.5,
            color: error ? '#d32f2f' : '#300152',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      )}

      <TextField
        fullWidth
        id={name}
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        variant="outlined"
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
          '& .MuiFormHelperText-root': {
            marginLeft: 0,
          },
        }}
        InputProps={{
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
        }}
        {...props}
      />
    </Box>
  );
};

export default Input;