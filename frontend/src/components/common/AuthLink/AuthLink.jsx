// src/components/common/AuthLink.jsx
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const AuthLink = ({ 
  to, 
  children, 
  align = 'center', 
  variant = 'body2',
  fontWeight = 600,
  mb = 0,
}) => {
  return (
    <Box sx={{ textAlign: align, mb }}>
      <Link to={to} style={{ textDecoration: 'none' }}>
        <Typography
          variant={variant}
          sx={{
            color: '#ffffff',
            fontWeight: fontWeight,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            '&:hover': {
              textDecoration: 'underline',
              opacity: 0.9,
            },
          }}
        >
          {children}
        </Typography>
      </Link>
    </Box>
  );
};

export default AuthLink;