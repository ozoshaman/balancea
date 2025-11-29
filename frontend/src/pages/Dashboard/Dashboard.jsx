// src/pages/Dashboard/Dashboard.jsx
import { Box, Container, Grid, Typography, Paper, Alert, Button, CircularProgress } from '@mui/material';
import { TrendingUp, Sync as SyncIcon } from '@mui/icons-material';
import Navigation from '../../components/layout/Navigation/Navigation.jsx';
import BalanceCard from '../../components/common/BalanceCard/BalanceCard.jsx';
import BalanceChart from '../../components/common/BalanceChart/BalanceChart.jsx';
import DashboardTransactions from '../../components/common/DashboardTransactions/DashboardTransactions.jsx';

import useDashboard from "../../hooks/useDashboard.js";
import useTransactions from "../../hooks/useTransactions";
import { useAuth } from "../../hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const data = useDashboard(user?.id);
  const { pendingCount, isOnline, syncing, syncTransactions, deleteTransaction } = useTransactions();

  // Loading simple
  if (data.loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h6">Cargando Dashboard...</Typography>
      </Box>
    );
  }

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        console.error('Error al eliminar transacción:', error);
        alert('Error al eliminar la transacción');
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navigation />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Alertas de estado */}
        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            📡 Sin conexión. Los datos se actualizarán cuando regreses a línea.
          </Alert>
        )}

        {pendingCount > 0 && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={syncTransactions}
                disabled={syncing || !isOnline}
                startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            }
          >
            ⏳ {pendingCount} transacción(es) pendiente(s) de sincronizar
          </Alert>
        )}

        {/* Título */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            mb: 3,
            color: '#2c3e50',
          }}
        >
          Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Columna Izquierda */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                backgroundColor: '#300152',
                borderRadius: 2,
                height: '100%',
              }}
            >
              {/* Título con icono */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUp sx={{ color: '#ffffff', fontSize: 22 }} />
                <Typography
                  variant="h5"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 'bold',
                    textAlign: 'left',
                  }}
                >
                  Detalles de balance
                </Typography>
              </Box>

              {/* Tarjetas de balance */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <BalanceCard type="ingresos" amount={data.ingresos} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <BalanceCard type="gastos" amount={data.gastos} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <BalanceCard
                    type="balance"
                    amount={data.balance}
                  />
                </Grid>
              </Grid>

              {/* Gráfico */}
              <Box sx={{ minHeight: 280 }}>
                <BalanceChart ingresos={data.ingresos} gastos={data.gastos} />
              </Box>
            </Paper>
          </Grid>

          {/* Columna Derecha - Transacciones */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                backgroundColor: '#300152',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '600px',
              }}
            >
              <DashboardTransactions 
                transactions={data.transactions} 
                onDelete={handleDeleteTransaction}
                transparent 
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;