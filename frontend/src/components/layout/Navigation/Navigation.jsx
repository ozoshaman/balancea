// src/components/layout/Navigation/Navigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Tooltip,
} from '@mui/material';
import { Star as CrownIcon } from '@mui/icons-material';
import ProfileMenu from '../ProfileMenu/ProfileMenu.jsx';
import { useState } from 'react';
import PremiumModal from '../../common/PremiumModal/PremiumModal.jsx';
import { useSelector } from 'react-redux';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openPremium, setOpenPremium] = useState(false);
  const { user } = useSelector(state => state.auth);

  const isActive = (path) => location.pathname === path;
  const isPremium = user?.role === 'PREMIUM';

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
          {isPremium ? (
            <Tooltip title="Usuario Premium">
              <CrownIcon sx={{ color: '#FFD700', fontSize: '28px', cursor: 'pointer' }} />
            </Tooltip>
          ) : (
            <Button
              onClick={() => setOpenPremium(true)}
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Get Premium
            </Button>
          )}
        </Box>

        {/* Profile Menu */}
        <ProfileMenu />
      </Toolbar>
      <PremiumModal open={openPremium} onClose={() => setOpenPremium(false)} />
    </AppBar>
  );
};

export default Navigation;