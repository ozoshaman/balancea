// src/components/common/DashboardTransactions/DashboardTransactions.jsx
import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Delete as DeleteIcon, Receipt as ReceiptIcon } from '@mui/icons-material';

const DashboardTransactions = ({ transactions = [], onDelete, transparent = false }) => {
  // Función para normalizar la fecha (puede venir como string, Date, o {$date: ...})
  const normalizeDate = (date) => {
    if (!date) return new Date();
    if (date.$date) return new Date(date.$date);
    return new Date(date);
  };

  // Función para obtener el ID (puede venir como string o {$oid: ...})
  const normalizeId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    if (id._id) return id._id;
    return String(id);
  };

  // Ordenar por fecha (más recientes primero) y tomar las últimas 5
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const dateA = normalizeDate(a.date);
      const dateB = normalizeDate(b.date);
      return dateB - dateA;
    })
    .slice(0, 5);

  const formatAmount = (amount, type) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    const formatted = `$${Math.abs(numAmount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return type === 'INCOME' ? `+${formatted}` : `-${formatted}`;
  };

  const getAmountColor = (type) => {
    return type === 'INCOME' ? '#4ade80' : '#f87171';
  };

  // Función para determinar el tipo de transacción
  const getTransactionType = (transaction) => {
    if (!transaction) return 'EXPENSE';
    
    // El campo 'type' en tu BD puede ser 'INCOME' o 'EXPENSE'
    const type = transaction.type?.toUpperCase();
    
    if (type === 'INCOME') return 'INCOME';
    if (type === 'EXPENSE') return 'EXPENSE';
    
    // Fallback: si el monto es positivo, asumimos ingreso
    const amount = typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount);
    return amount >= 0 ? 'EXPENSE' : 'INCOME';
  };

  const getTransactionLabel = (transaction) => {
    const type = getTransactionType(transaction);
    return type === 'INCOME' ? 'Ingreso' : 'Gasto';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ReceiptIcon sx={{ color: '#ffffff', fontSize: 22 }} />
        <Typography
          variant="h5"
          sx={{
            color: '#ffffff',
            fontWeight: 'bold',
          }}
        >
          Últimas transacciones
        </Typography>
      </Box>

      {/* Lista de transacciones */}
      <Box 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            },
          },
        }}
      >
        {recentTransactions.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            <Typography variant="body1">
              No hay transacciones recientes
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {recentTransactions.map((transaction, idx) => {
              const txType = getTransactionType(transaction);
              const transactionId = normalizeId(transaction._id || transaction.id);
              // Generar una key única: preferir id del servidor, luego localId (pendiente),
              // luego usar índice como fallback para evitar keys nulas/duplicadas.
              const txKey = transactionId || transaction.localId || `tx-${idx}-${String(transaction.date || transaction.createdAt || '')}`;

              return (
                <Box
                  key={txKey}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    p: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {/* Información de la transacción */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getTransactionLabel(transaction)}
                      </Typography>
                      {transaction.isPending && (
                        <Chip
                          label="Pendiente"
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                    
                    {/* Título de la transacción */}
                    {transaction.title && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.75rem',
                          display: 'block',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {transaction.title}
                      </Typography>
                    )}
                    
                    <Typography
                      variant="body2"
                      sx={{
                        color: getAmountColor(txType),
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      {formatAmount(transaction.amount, txType)}
                    </Typography>
                  </Box>

                  {/* Botón de eliminar */}
                  {onDelete && (
                    <IconButton
                      size="small"
                      onClick={() => onDelete(transactionId)}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: '#f87171',
                          backgroundColor: 'rgba(248, 113, 113, 0.1)',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Botón "Ver más" */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 'auto',
        }}
      >
        <Box
          component="button"
          onClick={() => { window.location.href = '/transactions'; }}
          sx={{
            backgroundColor: '#ffffff',
            color: '#300152',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 32px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              backgroundColor: '#f3e8ff',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          Ver más
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardTransactions;