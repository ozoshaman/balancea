// src/components/common/AuthAvatar.jsx
import { Box, Avatar } from '@mui/material';
import { PersonOutline } from '@mui/icons-material';

const AuthAvatar = ({ icon: Icon = PersonOutline, size = 80 }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <Avatar
        sx={{
          width: size,
          height: size,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '3px solid #300152',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Icon sx={{ fontSize: size * 0.625, color: '#300152' }} />
      </Avatar>
    </Box>
  );
};

export default AuthAvatar;