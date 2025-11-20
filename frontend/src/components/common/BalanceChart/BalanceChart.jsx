// src/components/common/BalanceChart/BalanceChart.jsx
import { Box, Typography, Paper } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const BalanceChart = ({ ingresos, gastos }) => {
  const data = [
    { name: 'Ingreso', value: ingresos },
    { name: 'Gasto', value: Math.abs(gastos) },
  ];

  const COLORS = ['#4caf50', '#f44336'];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: '#2c3e50',
        borderRadius: 2,
        minHeight: 220,
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      }}
    >
      {/* Área del gráfico (izquierda) */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Área de título y leyenda (derecha) */}
      <Box sx={{ width: 180, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-end' }}>
        <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700, textAlign: 'right' }}>
          Gráfica de balance
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
            <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
              Ingreso
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
            <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
              Gasto
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default BalanceChart;