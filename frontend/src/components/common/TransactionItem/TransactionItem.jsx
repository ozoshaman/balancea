// src/components/common/TransactionItem/TransactionItem.jsx
import { Box, Typography } from '@mui/material';

const TransactionItem = ({ type, amount, category, date }) => {
  const isIncome = type === 'income';

  const formatAmount = (value) => {
    const prefix = isIncome ? '+' : '-';
    return `${prefix}$${Math.abs(value).toFixed(0)}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 1,
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: '#ffffff',
          fontWeight: 600,
        }}
      >
        {isIncome ? 'Ingreso' : 'Gasto'}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: isIncome ? '#4caf50' : '#f44336',
          fontWeight: 'bold',
        }}
      >
        {formatAmount(amount)}
      </Typography>
    </Box>
  );
};

export default TransactionItem;