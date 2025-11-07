// src/components/common/Button.jsx
import { Button as MuiButton, CircularProgress } from '@mui/material';

const Button = ({
  children,
  isLoading = false,
  variant = 'contained',
  fullWidth = true,
  type = 'button',
  onClick,
  disabled = false,
  sx = {},
  ...props
}) => {
  return (
    <MuiButton
      type={type}
      fullWidth={fullWidth}
      variant={variant}
      size="large"
      disabled={isLoading || disabled}
      onClick={onClick}
      sx={{
        backgroundColor: '#ffffff',
        color: '#300152',
        fontWeight: 'bold',
        borderRadius: 3,
        py: 1.5,
        textTransform: 'none',
        fontSize: '1rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          backgroundColor: '#f0f0f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        '&:disabled': {
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          color: 'rgba(48, 1, 82, 0.5)',
        },
        ...sx,
      }}
      {...props}
    >
      {isLoading ? (
        <CircularProgress size={24} sx={{ color: '#300152' }} />
      ) : (
        children
      )}
    </MuiButton>
  );
};

export default Button;