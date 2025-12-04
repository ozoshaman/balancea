import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Grid, Typography, Paper, Button, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Stack, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import Navigation from '../../components/layout/Navigation/Navigation.jsx';
import TransactionCard from '../../components/common/TransactionCard/TransactionCard.jsx';
import useTransactions from '../../hooks/useTransactions';
import db from '../../services/db';
import api from '../../config/axiosConfig';
import syncService from '../../services/indexedDB/syncService';
import { useSelector } from 'react-redux';
import PremiumModal from '../../components/common/PremiumModal/PremiumModal.jsx';

const TransactionsPage = () => {
  const {
    transactions, loading, syncing, isOnline, pendingCount,
    syncTransactions, createTransaction, deleteTransaction
  } = useTransactions();

  const { user } = useSelector(state => state.auth);
  const [openPremium, setOpenPremium] = useState(false);

  const [categories, setCategories] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'EXPENSE', amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '', categoryId: ''
  });
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({ title: '', amount: '' });

  const loadCategoriesHandler = useCallback(async () => {
    if (!user?.id) return;
    const local = await db.getUserCategories(user.id);
    const pending = await db.getPendingCategories(user.id);
    const combined = [...local, ...pending];
    if (combined.length > 0) {
      setCategories(combined);
      // Si el categoryId actual es temporal, buscar si ya existe con ID real
      setForm(f => {
        let newCategoryId = f.categoryId;
        if (newCategoryId && typeof newCategoryId === 'number') {
          // Es un ID temporal (número de Dexie), buscar categoría con mismo nombre
          const tempCat = combined.find(c => c.id === newCategoryId);
          const realCat = combined.find(c => 
            tempCat && c.name === tempCat.name && typeof c.id === 'string'
          );
          if (realCat) {
            newCategoryId = realCat.id;
            console.log(`✅ Categoría temporal actualizada: ${newCategoryId}`);
          }
        }
        return { ...f, categoryId: newCategoryId || combined[0].id || '' };
      });
      return;
    }

    if (navigator.onLine) {
      try {
        const resp = await api.get('/categories');
        const server = resp.data.data || [];
        if (server.length) {
          await db.saveCategories(server, user.id);
          setCategories(server);
          setForm(f => ({ ...f, categoryId: server[0].id || '' }));
        } else {
          setCategories([]);
          setForm(f => ({ ...f, categoryId: '' }));
        }
      } catch (e) {
        console.error('Error cargando categorías:', e);
        setCategories([]);
        setForm(f => ({ ...f, categoryId: '' }));
      }
    } else {
      setCategories([]);
      setForm(f => ({ ...f, categoryId: '' }));
    }
  }, [user?.id]);

  useEffect(() => {
    loadCategoriesHandler();
  }, [loadCategoriesHandler]);

  // Escuchar eventos de sincronización para recargar categorías
  useEffect(() => {
    const unsubscribe = syncService.onSyncStateChange((event) => {
      if (event.type === 'SYNC_COMPLETED_CATEGORIES' && user?.id) {
        console.log('📡 Categorías sincronizadas, recargando lista...');
        loadCategoriesHandler();
      }
    });

    return unsubscribe;
  }, [loadCategoriesHandler, user?.id]);

  const handleOpenCreate = () => setOpenCreate(true);
  const handleCloseCreate = () => {
    setOpenCreate(false);
    setForm({
      title: '', type: 'EXPENSE', amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '', categoryId: categories[0]?.id || ''
    });
    setErrors({ title: '', amount: '' });
  };

  const handleCreate = async () => {
    // Validación client-side
    const title = (form.title || '').trim();
    const amountNum = Number(form.amount);
    const newErrors = { title: '', amount: '' };
    if (!title || title.length < 2) newErrors.title = 'El título es requerido (mínimo 2 caracteres)';
    if (form.amount === '' || Number.isNaN(amountNum) || amountNum <= 0) newErrors.amount = 'El monto es requerido y debe ser mayor a 0';

    setErrors(newErrors);
    if (newErrors.title || newErrors.amount) return;

    setCreating(true);
    try {
      const payload = {
        title,
        type: form.type,
        amount: amountNum,
        date: new Date(form.date).toISOString(),
        description: (form.description || '').trim(),
        categoryId: form.categoryId
      };

      await createTransaction(payload);
      handleCloseCreate();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async id => {
    try {
      await deleteTransaction(id);
    } catch (e) { }
  };

  const handleRefreshCategories = async () => {
    console.log('🔄 Forzando recarga de categorías...');
    if (!user?.id) return;
    try {
      if (navigator.onLine) {
        // Traer desde servidor y actualizar IndexedDB + estado
        const resp = await api.get('/categories');
        const server = resp.data.data || [];
        // Guardar lo que venga del servidor en la base local
        await db.saveCategories(server, user.id);

        // También traer pendientes que aún no se hayan sincronizado
        const pending = await db.getPendingCategories(user.id);

        // Preferir categorías del servidor (IDs reales), luego pendientes
        const combined = [...server, ...pending];
        setCategories(combined);

        // Si el formulario tenía un ID temporal (numero), intentar mapear al real por nombre
        setForm(f => {
          let newCategoryId = f.categoryId;
          if (newCategoryId && typeof newCategoryId === 'number') {
            const tempCat = pending.find(c => c.id === newCategoryId);
            const realCat = tempCat && server.find(s => s.name === tempCat.name);
            if (realCat) {
              newCategoryId = realCat.id;
              console.log(`✅ Remapeado ID temporal ${tempCat.id} -> ${realCat.id}`);
            }
          }
          return { ...f, categoryId: newCategoryId || combined[0]?.id || '' };
        });
      } else {
        // Offline: cargar local + pendientes
        const local = await db.getUserCategories(user.id);
        const pending = await db.getPendingCategories(user.id);
        const combined = [...local, ...pending];
        setCategories(combined);
        setForm(f => ({ ...f, categoryId: f.categoryId || combined[0]?.id || '' }));
      }

      console.log('✅ Categorías recargadas');
    } catch (e) {
      console.error('Error forzando recarga de categorías:', e);
      // Fallback: ejecutar handler existente
      await loadCategoriesHandler();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      // Verificar límite de categorías para FREE
      if (user?.role === 'FREE' && categories.length >= 3) {
        setOpenPremium(true);
        setCreatingCategory(false);
        return;
      }

      if (navigator.onLine) {
        // Crear online
        try {
          const resp = await api.post('/categories', { name: newCategoryName.trim() });
          const newCategory = resp.data.data;
          const updatedCategories = [...categories, newCategory];
          setCategories(updatedCategories);
          await db.saveCategories(updatedCategories, user.id);
          setForm(f => ({ ...f, categoryId: newCategory.id || '' }));
          setNewCategoryName('');
          setOpenCreateCategory(false);
        } catch (err) {
          console.error('Error creando categoría online:', err);
          throw err;
        }
      } else {
        // Crear offline
        const categoryData = {
          name: newCategoryName.trim()
        };
        
        // Encolar en pendingCategories (Dexie auto-genera localId)
        const result = await db.addPendingCategory({
          ...categoryData,
          userId: user.id,
          action: 'CREATE'
        });
        
        // Usar el localId generado por Dexie como ID temporal para UI
        const tempCategoryId = result.localId;
        
        // Guardar localmente para mostrar en UI
        const localCategory = {
          id: tempCategoryId, // Usar el ID de Dexie
          name: newCategoryName.trim(),
          userId: user.id,
          isPending: true,
          createdAt: new Date().toISOString()
        };
        
        await db.saveCategories([localCategory], user.id);
        const updatedCategories = [...categories, localCategory];
        setCategories(updatedCategories);
        setForm(f => ({ ...f, categoryId: tempCategoryId }));
        
        console.log('✅ Categoría creada offline con ID temporal:', tempCategoryId);
        setNewCategoryName('');
        setOpenCreateCategory(false);
      }
    } catch (e) {
      console.error('Error creando categoría:', e);
      alert('Error al crear categoría: ' + e.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const isFormValid = () => {
    const title = (form.title || '').trim();
    const amountNum = Number(form.amount);
    return title.length >= 2 && form.amount !== '' && !Number.isNaN(amountNum) && amountNum > 0;
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f3f4f7" }}>
      <Navigation />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          Transacciones
        </Typography>

        {/* Alertas */}
        <Stack spacing={2} mb={3}>
          {!isOnline && (
            <Alert severity="warning">📡 Estás offline — mostrando datos locales</Alert>
          )}
          {pendingCount > 0 && (
            <Alert severity="info">
              ⏳ {pendingCount} transacción(es) pendientes
              <Button
                onClick={syncTransactions}
                disabled={syncing || !isOnline}
                sx={{ ml: 2 }}
                startIcon={<SyncIcon />}
              >
                {syncing ? <CircularProgress size={16} /> : "Sincronizar"}
              </Button>
            </Alert>
          )}
          {user?.role !== 'PREMIUM' && categories.length >= 3 && (
            <Alert severity="info">
              Has alcanzado 3 categorías.
              <Button
                onClick={() => setOpenPremium(true)}
                sx={{ ml: 2 }}
                variant="outlined"
              >
                Actualizar a Premium
              </Button>
            </Alert>
          )}
        </Stack>

        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 4,
                background: "white",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Acciones</Typography>

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleOpenCreate}
                  startIcon={<AddIcon />}
                  fullWidth
                >
                  Crear Transacción
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleRefreshCategories}
                  startIcon={<RefreshIcon />}
                  fullWidth
                >
                  Recargar Categorías
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Lista de transacciones */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={2}
              sx={{ p: 3, borderRadius: 4, minHeight: 200 }}
            >
              {loading ? (
                <CircularProgress />
              ) : transactions.length === 0 ? (
                <Typography>No hay transacciones</Typography>
              ) : (
                <Stack spacing={2}>
                  {transactions.map(tx => (
                    <TransactionCard
                      key={tx.id || tx._id || tx.localId}
                      tx={tx}
                      onDelete={handleDelete}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Modal Premium */}
      <PremiumModal open={openPremium} onClose={() => setOpenPremium(false)} />

      {/* Dialog Crear */}
      <Dialog open={openCreate} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Crear Transacción</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Título"
              fullWidth
              sx={{ mt: 1 }}
              value={form.title}
              onChange={e => {
                const val = e.target.value;
                setForm(f => ({ ...f, title: val }));
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              error={!!errors.title}
              helperText={errors.title || ''}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={form.type}
                label="Tipo"
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                <MenuItem value="EXPENSE">Gasto</MenuItem>
                <MenuItem value="INCOME">Ingreso</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Monto"
              type="number"
              fullWidth
              value={form.amount}
              onChange={e => {
                const val = e.target.value;
                setForm(f => ({ ...f, amount: val }));
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
              }}
              error={!!errors.amount}
              helperText={errors.amount || ''}
            />

            <TextField
              label="Fecha"
              type="date"
              fullWidth
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={form.categoryId}
                label="Categoría"
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                {categories.length === 0 && <MenuItem value="">(Sin categorías)</MenuItem>}
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={() => setOpenCreateCategory(true)}>
                  ➕ Crear Nueva Categoría
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !isFormValid()}
            startIcon={!creating && <AddIcon />}
          >
            {creating ? <CircularProgress size={18} /> : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Crear Categoría */}
      <Dialog open={openCreateCategory} onClose={() => setOpenCreateCategory(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nueva Categoría</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Nombre de la Categoría"
            fullWidth
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Ej: Alimentación, Transporte..."
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateCategory(false)}>Cancelar</Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={creatingCategory || !newCategoryName.trim()}
            startIcon={!creatingCategory && <AddIcon />}
          >
            {creatingCategory ? <CircularProgress size={18} /> : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage;
