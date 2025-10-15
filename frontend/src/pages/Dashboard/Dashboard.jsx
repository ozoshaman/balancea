// src/pages/Dashboard/Dashboard.jsx
import { useAuth } from '../../hooks/useAuth';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Typography variant="h4" component="h1">
              Dashboard
            </Typography>
            <Button variant="outlined" color="error" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
              }}
            >
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Chip
                label={user?.role}
                color={user?.role === 'PREMIUM' ? 'success' : 'default'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              ¡Bienvenido a Balancea! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Has iniciado sesión correctamente. Aquí podrás gestionar tus
              finanzas personales de manera simple e intuitiva.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Este es el Dashboard principal. Próximamente podrás:
            </Typography>
            <Box component="ul" sx={{ mt: 1 }}>
              <li>
                <Typography variant="body2">
                  Registrar ingresos y gastos
                </Typography>
              </li>
              <li>
                <Typography variant="body2">Categorizar transacciones</Typography>
              </li>
              <li>
                <Typography variant="body2">Ver tu balance general</Typography>
              </li>
              <li>
                <Typography variant="body2">Configurar presupuestos</Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Visualizar gráficos y reportes
                </Typography>
              </li>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;