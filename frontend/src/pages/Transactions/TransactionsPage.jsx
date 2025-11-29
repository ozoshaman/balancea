import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Paper, Button, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Navigation from '../../components/layout/Navigation/Navigation.jsx';
import TransactionCard from '../../components/common/TransactionCard/TransactionCard.jsx';
import useTransactions from '../../hooks/useTransactions';
import db from '../../services/db';
import syncService from '../../services/indexedDB/syncService';
import api from '../../config/axiosConfig';
import { useSelector } from 'react-redux';

const TransactionsPage = () => {
  const { transactions, loading, syncing, isOnline, pendingCount, syncTransactions, createTransaction, deleteTransaction } = useTransactions();
  const { user } = useSelector(state => state.auth);

  const [categories, setCategories] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'EXPENSE', amount: '', date: new Date().toISOString().slice(0,10), description: '', categoryId: '' });
  const [creating, setCreating] = useState(false);

  const loadCategories = async () => {
    if (!user?.id) return;
    const local = await db.getUserCategories(user.id);
    if (local && local.length > 0) {
      setCategories(local);
      setForm(f => ({ ...f, categoryId: f.categoryId || local[0].id }));
      return;
    }

    if (navigator.onLine) {
      try {
        const resp = await api.get('/categories');
        const server = resp?.data?.data || [];
        if (Array.isArray(server) && server.length) {
          await db.saveCategories(server, user.id);
          setCategories(server);
          setForm(f => ({ ...f, categoryId: f.categoryId || server[0].id }));
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    setCategories([]);
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

  const handleOpenCreate = () => setOpenCreate(true);
  const handleCloseCreate = () => {
    setOpenCreate(false);
    setForm({ title: '', type: 'EXPENSE', amount: '', date: new Date().toISOString().slice(0,10), description: '', categoryId: categories[0]?.id || '' });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
        description: form.description.trim(),
        categoryId: form.categoryId
      };

      await createTransaction(payload);
      handleCloseCreate();
    } catch (err) {
      console.error('Error creando transacción:', err);
      alert(err?.message || 'Error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
    } catch (e) {
      console.error('Error eliminando:', e);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navigation />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Transacciones</Typography>

        {!isOnline && <Alert severity="warning" sx={{ mb: 2 }}>📡 Sin conexión - mostrando datos locales</Alert>}
        {pendingCount > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            ⏳ {pendingCount} transacción(es) pendientes
            <Button onClick={syncTransactions} disabled={syncing || !isOnline} sx={{ ml: 2 }}>
              {syncing ? <CircularProgress size={16} /> : 'Sincronizar'}
            </Button>
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }} elevation={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>Acciones</Typography>
              <Button variant="contained" onClick={handleOpenCreate} fullWidth>Crear Transacción</Button>
              <Button variant="outlined" onClick={loadCategories} fullWidth sx={{ mt: 2 }}>Recargar Categorías</Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            {loading ? <CircularProgress /> : (
              transactions.length === 0 ? (
                <Paper sx={{ p: 3 }}>No hay transacciones</Paper>
              ) : (
                transactions.map(tx => (
                  <TransactionCard key={tx.id || tx._id || tx.localId} tx={tx} onDelete={handleDelete} />
                ))
              )
            )}
          </Grid>
        </Grid>

        <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="sm">
          <DialogTitle>Crear Transacción</DialogTitle>
          <DialogContent>
            <TextField label="Título" fullWidth margin="normal" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <FormControl fullWidth margin="normal">
              <InputLabel id="type-label">Tipo</InputLabel>
              <Select labelId="type-label" value={form.type} label="Tipo" onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <MenuItem value="EXPENSE">Gasto</MenuItem>
                <MenuItem value="INCOME">Ingreso</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Monto" type="number" fullWidth margin="normal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <TextField label="Fecha" type="date" fullWidth margin="normal" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth margin="normal">
              <InputLabel id="cat-select">Categoría</InputLabel>
              <Select labelId="cat-select" value={form.categoryId} label="Categoría" onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                {categories.length === 0 && <MenuItem value="">(Sin categorías)</MenuItem>}
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Descripción" fullWidth margin="normal" multiline rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate}>Cancelar</Button>
            <Button onClick={handleCreate} variant="contained" disabled={creating}>{creating ? <CircularProgress size={18} /> : 'Crear'}</Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default TransactionsPage;
