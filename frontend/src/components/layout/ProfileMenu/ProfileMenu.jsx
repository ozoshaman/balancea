// src/components/layout/ProfileMenu/ProfileMenu.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Box,
  Typography,
  Avatar,
} from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      <IconButton
        size="large"
        onClick={handleMenuOpen}
        sx={{
          color: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {user?.firstName ? (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#7218a8',
              fontSize: '0.875rem',
              fontWeight: 'bold',
            }}
          >
            {getInitials()}
          </Avatar>
        ) : (
          <AccountCircle sx={{ fontSize: 32 }} />
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {/* Header del menú con info del usuario */}
        <Box sx={{ px: 2, py: 1.5, backgroundColor: '#f5f5f5' }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 'bold',
              color: '#300152',
            }}
          >
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : 'Usuario'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#666',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.email || 'email@ejemplo.com'}
          </Typography>
        </Box>

        <Divider />

        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 0.08)',
            },
          }}
        >
          <Logout sx={{ mr: 1.5, color: '#f44336', fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: '#f44336' }}>
            Cerrar sesión
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileMenu;