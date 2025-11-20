// src/components/common/BalanceCard/BalanceCard.jsx
import { Box, Typography, Paper } from '@mui/material';

const BalanceCard = ({ type, amount, savingsAmount }) => {
  const config = {
    ingresos: {
      title: 'Ingresos',
      borderColor: '#4caf50',
    },
    gastos: {
      title: 'Gastos',
      borderColor: '#f44336',
      amountColor: '#f44336',
    },
    balance: {
      title: 'Balance',
      borderColor: '#2196f3',
      showSavings: true,
    },
  };

  const { title, borderColor, amountColor, showSavings } = config[type];

  const formatAmount = (value) => {
    // Normalizar formato con símbolo de moneda
    if (type === 'gastos') {
      return `-$${Math.abs(value).toFixed(0)}`;
    }
    if (type === 'balance') {
      return value >= 0 ? `+$${value.toFixed(0)}` : `-$${Math.abs(value).toFixed(0)}`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getAmountColor = () => {
    if (amountColor) return amountColor;
    if (type === 'balance') return amount >= 0 ? '#4caf50' : '#f44336';
    return '#000000';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        border: `4px solid ${borderColor}`,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#000000',
          fontWeight: 600,
          textAlign: 'center',
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="h4"
        sx={{
          color: getAmountColor(),
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {formatAmount(amount)}
      </Typography>

      {showSavings && savingsAmount !== undefined && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
            Ahorro
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 600,
            }}
          >
            ${savingsAmount.toFixed(0)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default BalanceCard;