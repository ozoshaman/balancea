import React from 'react';
import { Paper, Box, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const TransactionCard = ({ tx, onDelete }) => {
  const isIncome = tx.type === 'INCOME' || tx.type === 'income';

  const borderColor = isIncome ? '#4caf50' : '#f44336';

  const formatAmount = (value) => {
    const num = Number(value) || 0;
    return isIncome ? `+$${num.toFixed(0)}` : `-$${Math.abs(num).toFixed(0)}`;
  };

  const translateType = (type) => (type === 'INCOME' ? 'Ingreso' : 'Gasto');

  const formatDate = (d) => {
    try {
      const date = typeof d === 'string' ? new Date(d) : new Date(d?.$date || d);
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderLeft: `6px solid ${borderColor}`,
        mb: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {tx.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          {translateType(tx.type)} — {formatDate(tx.date)}
        </Typography>
        {tx.description && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {tx.description}
          </Typography>
        )}
      </Box>

      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="h6" sx={{ color: borderColor, fontWeight: 700 }}>
          {formatAmount(tx.amount)}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <IconButton size="small" onClick={() => onDelete && onDelete(tx.id || tx._id || tx._localId)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default TransactionCard;
