import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TransactionItem from '../TransactionItem/TransactionItem.jsx';

// Prop `transparent`: si true, no renderiza el Paper (se asume que el padre provee el fondo morado)
const TransactionsList = ({ transactions = [], transparent = false }) => {
  const navigate = useNavigate();

  // Render sin Paper (modo transparente) — mantiene la misma estructura visual pero sin fondo adicional
  if (transparent) {
    return (
      <Box sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="h5"
          sx={{
            color: '#ffffff',
            fontWeight: 700,
            mb: 2,
            textAlign: 'center', // Título centrado horizontalmente en la columna derecha
          }}
        >
          Últimas transacciones
        </Typography>

        <Box sx={{ mb: 2, flexGrow: 1, overflowY: 'auto' }}>
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <TransactionItem
                key={index}
                type={transaction.type}
                amount={transaction.amount}
                category={transaction.category}
                date={transaction.date}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                py: 3,
              }}
            >
              No hay transacciones recientes
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/transactions')}
            sx={{
              backgroundColor: '#ffffff',
              color: '#300152',
              fontWeight: 'bold',
              borderRadius: 20,
              px: 4,
              py: 0.8,
              textTransform: 'none',
              boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            Ver más
          </Button>
        </Box>
      </Box>
    );
  }

  // Comportamiento por defecto (con Paper) — mantiene compatibilidad con usos previos
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        backgroundColor: '#300152',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#ffffff',
          fontWeight: 600,
          mb: 2,
          textAlign: 'center',
        }}
      >
        Últimas transacciones
      </Typography>

      <Box sx={{ mb: 2, flexGrow: 1, overflowY: 'auto' }}>
        {transactions.length > 0 ? (
          transactions.map((transaction, index) => (
            <TransactionItem
              key={index}
              type={transaction.type}
              amount={transaction.amount}
              category={transaction.category}
              date={transaction.date}
            />
          ))
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              py: 3,
            }}
          >
            No hay transacciones recientes
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/transactions')}
          sx={{
            backgroundColor: '#ffffff',
            color: '#300152',
            fontWeight: 'bold',
            borderRadius: 20,
            px: 4,
            py: 0.8,
            textTransform: 'none',
            boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
            '&:hover': {
              backgroundColor: '#f0f0f0',
            },
          }}
        >
          Ver más
        </Button>
      </Box>
    </Paper>
  );
};

export default TransactionsList;