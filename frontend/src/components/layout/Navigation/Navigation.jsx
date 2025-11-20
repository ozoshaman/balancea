// src/components/layout/Navigation/Navigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from '@mui/material';
import ProfileMenu from '../ProfileMenu/ProfileMenu.jsx';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#2c3e50',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
          onClick={() => navigate('/dashboard')}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Balancea Logo"
            sx={{
              height: 40,
              width: 40,
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: '#ffffff',
              fontSize: '1.5rem',
            }}
          >
            Balancea
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
          <Button
            onClick={() => navigate('/dashboard')}
            sx={{
              color: isActive('/dashboard') ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              fontWeight: isActive('/dashboard') ? 'bold' : 'normal',
              backgroundColor: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Dashboard
          </Button>
          <Button
            onClick={() => navigate('/transactions')}
            sx={{
              color: isActive('/transactions') ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              fontWeight: isActive('/transactions') ? 'bold' : 'normal',
              backgroundColor: isActive('/transactions') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Transacciones
          </Button>
        </Box>

        {/* Profile Menu */}
        <ProfileMenu />
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;