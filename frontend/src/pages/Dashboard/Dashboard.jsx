// src/pages/Dashboard/Dashboard.jsx
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import Navigation from '../../components/layout/Navigation/Navigation.jsx';
import BalanceCard from '../../components/common/BalanceCard/BalanceCard.jsx';
import BalanceChart from '../../components/common/BalanceChart/BalanceChart.jsx';
import TransactionsList from '../../components/common/TransactionsList/TransactionsList.jsx';

const Dashboard = () => {
  // TODO: Reemplazar con datos del hook useDashboard o API
  const mockData = {
    ingresos: 1299,
    gastos: 912,
    balance: 287,
    ahorro: 650,
    transactions: [
      { type: 'income', amount: 233, category: 'Salario' },
      { type: 'expense', amount: 456, category: 'Compras' },
      { type: 'expense', amount: 456, category: 'Comida' },
      { type: 'income', amount: 233, category: 'Freelance' },
      { type: 'income', amount: 833, category: 'Inversión' },
    ],
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navigation />

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
              {/* Título con icono - Esquina superior izquierda */}
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

              {/* Tarjetas de balance - Alineadas horizontalmente */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <BalanceCard type="ingresos" amount={mockData.ingresos} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <BalanceCard type="gastos" amount={mockData.gastos} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <BalanceCard
                    type="balance"
                    amount={mockData.balance}
                    savingsAmount={mockData.ahorro}
                  />
                </Grid>
              </Grid>

              {/* Gráfico - Parte inferior izquierda */}
              <Box sx={{ minHeight: 280 }}>
                <BalanceChart ingresos={mockData.ingresos} gastos={mockData.gastos} />
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
              }}
            >
              <TransactionsList transactions={mockData.transactions} transparent />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;