// src/components/common/AuthContainer.jsx
import { Box, Container, Paper } from '@mui/material';

const AuthContainer = ({ children, maxWidth = 'sm' }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #7218a8 0%, #3b145d 40%, #300152 70%, #300152 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth={maxWidth}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.54)',
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthContainer;