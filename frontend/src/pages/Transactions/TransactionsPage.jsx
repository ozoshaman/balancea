import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Grid, Typography, Paper, Button, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Stack, Divider,
  IconButton, Tooltip, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Navigation from '../../components/layout/Navigation/Navigation.jsx';
import TransactionCard from '../../components/common/TransactionCard/TransactionCard.jsx';
import useTransactions from '../../hooks/useTransactions';
import db from '../../services/db';
import api from '../../config/axiosConfig';
import syncService from '../../services/indexedDB/syncService';
import { useSelector } from 'react-redux';
import PremiumModal from '../../components/common/PremiumModal/PremiumModal.jsx';
import RecurringForm from '../../components/transactions/RecurringForm.jsx';
import recurringService from '../../services/recurringTransactionService';

const TransactionsPage = () => {
  const {
    transactions, loading, syncing, isOnline, pendingCount, error,
    syncTransactions, createTransaction, deleteTransaction, refresh
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
  const [creationMode, setCreationMode] = useState('NORMAL');
  const [recurringData, setRecurringData] = useState({ frequencyValue: 1, frequencyUnit: 'DAYS', startDate: new Date().toISOString(), endDate: null, notifyOnRun: true });
  const [creating, setCreating] = useState(false);
  const [, setErrors] = useState({ title: '', amount: '' });

  const [recurrings, setRecurrings] = useState([]);
  const [loadingRecurrings, setLoadingRecurrings] = useState(false);
  const [openEditRecurring, setOpenEditRecurring] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [savingEditing, setSavingEditing] = useState(false);
  const [processingRecurringId, setProcessingRecurringId] = useState(null);

  const loadCategoriesHandler = useCallback(async () => {
    if (!user?.id) return;
    const local = await db.getUserCategories(user.id);
    const pending = await db.getPendingCategories(user.id);
    const combined = [...local, ...pending];
    if (combined.length > 0) {
      setCategories(combined);
      setForm(f => ({ ...f, categoryId: new Date().toISOString() ? combined[0].id || '' : '' }));
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

  useEffect(() => {
    const unsubscribe = syncService.onSyncStateChange((event) => {
      if (event.type === 'SYNC_COMPLETED_CATEGORIES' && user?.id) {
        console.log('📡 Categorías sincronizadas, recargando lista...');
        loadCategoriesHandler();
      }
    });

    return unsubscribe;
  }, [loadCategoriesHandler, user?.id]);

  const loadRecurringList = useCallback(async () => {
    if (!user?.id) return setRecurrings([]);
    setLoadingRecurrings(true);
    try {
      const pending = await db.getPendingRecurrings(user.id);

      const pendingCreates = (pending || []).filter(p => p.action === 'CREATE').map(p => ({
        id: p.localId,
        title: p.title,
        type: p.type,
        amount: p.amount,
        description: p.description,
        categoryId: p.categoryId,
        frequencyValue: p.frequencyValue,
        frequencyUnit: p.frequencyUnit,
        startDate: p.startDate,
        endDate: p.endDate,
        notifyOnRun: p.notifyOnRun,
        isPending: true,
        _pendingMeta: p
      }));

      const pendingUpdates = (pending || []).filter(p => p.action === 'UPDATE');
      const pendingDeletes = (pending || []).filter(p => p.action === 'DELETE').map(p => p.transactionId);

      let serverList = [];
      if (navigator.onLine) {
        try {
          serverList = await recurringService.listRecurring() || [];
        } catch (err) {
          console.warn('Error cargando recurrentes desde servidor, usando solo pendientes:', err);
          serverList = [];
        }
      }

      for (const up of pendingUpdates) {
        const idx = serverList.findIndex(s => String(s.id) === String(up.transactionId));
        if (idx >= 0) {
          serverList[idx] = { ...serverList[idx], ...up, isPending: true, _pendingMeta: up };
        } else {
          const existing = pendingCreates.find(pc => pc.id === up.localId || pc._pendingMeta?.localId === up.localId);
          if (existing) {
            Object.assign(existing, up);
          }
        }
      }

      serverList = serverList.filter(s => !pendingDeletes.includes(s.id));

      const merged = [...serverList, ...pendingCreates];
      setRecurrings(merged);
    } catch (e) {
      console.error('Error cargando recurrentes:', e);
      setRecurrings([]);
    } finally {
      setLoadingRecurrings(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const unsubscribe = syncService.onSyncStateChange((event) => {
      if (!user?.id) return;
      const interesting = ['SYNC_COMPLETED_RECURRINGS', 'RECURRING_CREATED_OFFLINE', 'RECURRING_UPDATED_OFFLINE', 'RECURRING_DELETED_OFFLINE', 'SYNC_ERROR_RECURRINGS'];
      if (interesting.includes(event.type)) {
        console.log('📡 Evento de recurrentes:', event.type, ' -> recargando lista');
        loadRecurringList();
      }
    });

    return unsubscribe;
  }, [loadRecurringList, user?.id]);

  useEffect(() => {
    loadRecurringList();
  }, [loadRecurringList]);

  const handleOpenCreate = () => setOpenCreate(true);
  const handleCloseCreate = () => {
    setOpenCreate(false);
    setForm({
      title: '', type: 'EXPENSE', amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '', categoryId: categories[0]?.id || ''
    });
    setErrors({ title: '', amount: '' });
    setRecurringData({ frequencyValue: 1, frequencyUnit: 'DAYS', startDate: new Date().toISOString(), endDate: null, notifyOnRun: true });
  };

  const handleCreate = async () => {
    const title = (form.title || '').trim();
    const amountNum = Number(form.amount);
    const newErrors = { title: '', amount: '' };
    if (!title || title.length < 2) newErrors.title = 'El título es requerido (mínimo 2 caracteres)';
    if (form.amount === '' || Number.isNaN(amountNum) || amountNum <= 0) newErrors.amount = 'El monto es requerido y debe ser mayor a 0';

    setErrors(newErrors);
    if (newErrors.title || newErrors.amount) return;

    setCreating(true);
    try {
      if (creationMode === 'NORMAL') {
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
      } else {
        const payload = {
          title,
          type: form.type,
          amount: amountNum,
          description: (form.description || '').trim(),
          categoryId: form.categoryId,
          frequencyValue: recurringData.frequencyValue,
          frequencyUnit: recurringData.frequencyUnit,
          startDate: recurringData.startDate,
          endDate: recurringData.endDate || null,
          notifyOnRun: recurringData.notifyOnRun,
        };

        if (!navigator.onLine) {
          await syncService.createRecurringOffline(payload, user?.id);
          handleCloseCreate();
          await loadRecurringList();
        } else {
          try {
            await recurringService.createRecurring(payload);
            handleCloseCreate();
            await loadRecurringList();
          } catch (err) {
            console.warn('Fallo creando recurrente online, encolando para sincronizar:', err);
            try {
              await syncService.createRecurringOffline(payload, user?.id);
              handleCloseCreate();
              await loadRecurringList();
            } catch (offlineErr) {
              console.error('Error agregando recurrente a la cola offline:', offlineErr);
              throw offlineErr;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error creando:', e);
      alert('Error al crear la transacción: ' + (e?.response?.data?.message || e.message));
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
        const resp = await api.get('/categories');
        const server = resp.data.data || [];
        await db.saveCategories(server, user.id);

        const pending = await db.getPendingCategories(user.id);

        const combined = [...server, ...pending];
        setCategories(combined);

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
        const local = await db.getUserCategories(user.id);
        const pending = await db.getPendingCategories(user.id);
        const combined = [...local, ...pending];
        setCategories(combined);
        setForm(f => ({ ...f, categoryId: f.categoryId || combined[0]?.id || '' }));
      }

      console.log('✅ Categorías recargadas');
    } catch (e) {
      console.error('Error forzando recarga de categorías:', e);
      await loadCategoriesHandler();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      if (user?.role === 'FREE' && categories.length >= 3) {
        setOpenPremium(true);
        setCreatingCategory(false);
        return;
      }

      if (navigator.onLine) {
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
        const categoryData = {
          name: newCategoryName.trim()
        };

        const result = await db.addPendingCategory({
          ...categoryData,
          userId: user.id,
          action: 'CREATE'
        });

        const tempCategoryId = result.localId;

        const localCategory = {
          id: tempCategoryId,
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

  const handleDeleteRecurring = async (id) => {
    if (!window.confirm('Eliminar regla recurrente?')) return;
    try {
      await recurringService.deleteRecurring(id);
      await loadRecurringList();
    } catch (e) {
      console.error('Error eliminando recurrente:', e);
      alert('Error al eliminar');
    }
  };

  const handleRunNowRecurring = async (id) => {
    try {
      setProcessingRecurringId(id);
      await recurringService.runNow(id);
      await loadRecurringList();
    } catch (e) {
      console.error('Error ejecutando ahora:', e);
      alert('Error al ejecutar ahora');
    } finally {
      setProcessingRecurringId(null);
    }
  };

  const handleOpenEditRecurring = (r) => {
    setEditingRecurring({ ...r });
    setOpenEditRecurring(true);
  };

  const formatRecurringAmount = (amount, type) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    const formatted = `$${Math.abs(numAmount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return type === 'INCOME' ? `+${formatted}` : `-${formatted}`;
  };

  const translateType = (type) => {
    if (!type) return '';
    return String(type).toUpperCase() === 'INCOME' ? 'Ingreso' : 'Gasto';
  };

  const translateFrequencyUnit = (unit) => {
    if (!unit) return '';
    const map = {
      MINUTES: 'minutos',
      HOURS: 'horas',
      DAYS: 'días',
      WEEKS: 'semanas',
      MONTHS: 'meses',
      YEARS: 'años'
    };
    return map[unit] || unit.toLowerCase();
  };

  const handleSaveEditRecurring = async () => {
    if (!editingRecurring) return;
    setSavingEditing(true);
    try {
      const payload = {
        title: editingRecurring.title,
        type: editingRecurring.type,
        amount: Number(editingRecurring.amount),
        description: editingRecurring.description,
        categoryId: editingRecurring.categoryId,
        frequencyValue: editingRecurring.frequencyValue,
        frequencyUnit: editingRecurring.frequencyUnit,
        startDate: editingRecurring.startDate,
        endDate: editingRecurring.endDate || null,
        notifyOnRun: editingRecurring.notifyOnRun,
      };
      await recurringService.updateRecurring(editingRecurring.id, payload);
      setOpenEditRecurring(false);
      setEditingRecurring(null);
      await loadRecurringList();
    } catch (e) {
      console.error('Error guardando recurrente:', e);
      alert('Error al guardar');
    } finally {
      setSavingEditing(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: '#f5f5f5' }}>
      <Navigation />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
          Transacciones
        </Typography>

        {/* Alertas */} 
        <Stack spacing={2} mb={3}>
          {error && (
            <Alert 
              severity="error"
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              ⚠️ Error cargando datos: {String(error)}
              <Button onClick={refresh} sx={{ ml: 2 }} variant="outlined">Reintentar</Button>
            </Alert>
          )}
          {!isOnline && (
            <Alert 
              severity="warning"
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              📡 Estás offline — mostrando datos locales
            </Alert>
          )}
          {pendingCount > 0 && (
            <Alert 
              severity="info"
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
              }}
            >
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
            <Alert 
              severity="info"
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
              }}
            >
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
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: '#300152',
                color: 'white',
                height: '100%'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 600 }}>
                Acciones
              </Typography>

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleOpenCreate}
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Crear Transacción
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleRefreshCategories}
                  startIcon={<RefreshIcon />}
                  fullWidth
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Recargar Categorías
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Lista de transacciones */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={3}
              sx={{ 
                p: 3, 
                borderRadius: 2, 
                minHeight: 200,
                backgroundColor: '#300152',
                color: 'white'
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              ) : transactions.length === 0 ? (
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', py: 4 }}>
                  No hay transacciones
                </Typography>
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

        {/* Recurrentes section */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                backgroundColor: '#300152',
                color: 'white'
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Transacciones Automatizadas
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant="outlined" 
                    onClick={loadRecurringList} 
                    startIcon={<RefreshIcon />}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Refrescar
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

              {loadingRecurrings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              ) : recurrings.length === 0 ? (
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', py: 2 }}>
                  No hay reglas recurrentes
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {recurrings.map(r => (
                    <Paper 
                      key={r.id} 
                      sx={{ 
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <div>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontWeight: 700 }}>{r.title || 'Sin título'}</Typography>
                            <Chip
                              label={translateType(r.type)}
                              size="small"
                              color={String(r.type).toUpperCase() === 'INCOME' ? 'success' : 'error'}
                            />
                            <Chip label={formatRecurringAmount(r.amount, r.type)} size="small" variant="outlined" />
                            {r.isPending && <Chip label="Pendiente" size="small" color="warning" />}
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            Cada {r.frequencyValue} {translateFrequencyUnit(r.frequencyUnit)} • Próxima: {r.nextRun ? new Date(r.nextRun).toLocaleString() : '—'}
                          </Typography>
                        </div>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Ejecutar ahora">
                            <span>
                              <IconButton onClick={() => handleRunNowRecurring(r.id)} disabled={processingRecurringId === r.id}>
                                <PlayArrowIcon />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Editar">
                            <IconButton onClick={() => handleOpenEditRecurring(r)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Eliminar">
                            <IconButton onClick={() => handleDeleteRecurring(r.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Paper>
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
      <Dialog 
        open={openCreate} 
        onClose={handleCloseCreate} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundColor: '#ffffffff',
            color: 'white',
            backdropFilter: 'blur(6px)',
            // make inputs inside the dialog have a white background for readability
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 1,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0,0,0,0.08)'
            },
            '& .MuiFormLabel-root, & .MuiInputLabel-root': {
              color: 'rgba(0,0,0,0.7)'
            },
            '& .MuiDialogActions-root button': {
              // keep action buttons visible on dark background
              color: 'white'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, p: 3, color: 'black' }}>Crear Transacción</DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Stack spacing={2.5}>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Modo</InputLabel>
              <Select
                value={creationMode}
                label="Modo"
                onChange={e => setCreationMode(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="RECURRING">Automatizada</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Título"
              fullWidth
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Stack direction="row" spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  label="Tipo"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="EXPENSE">Gasto</MenuItem>
                  <MenuItem value="INCOME">Ingreso</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Monto"
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                sx={{ width: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>

            <TextField
              label="Descripción (opcional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={form.categoryId}
                label="Categoría"
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {creationMode === 'RECURRING' && (
              <RecurringForm value={recurringData} onChange={setRecurringData} />
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseCreate}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !(creationMode === 'NORMAL' ? isFormValid() : true)}
            startIcon={!creating && <AddIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#667eea',
              '&:hover': { bgcolor: '#5568d3' },
            }}
          >
            {creating ? <CircularProgress size={18} /> : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Crear Categoría */}
      <Dialog 
        open={openCreateCategory} 
        onClose={() => setOpenCreateCategory(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, p: 3, pb: 1 }}>
          Crear Nueva Categoría
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: 3 }}>
          <TextField
            label="Nombre de la Categoría"
            fullWidth
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Ej: Alimentación, Transporte..."
            autoFocus
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenCreateCategory(false)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={creatingCategory || !newCategoryName.trim()}
            startIcon={!creatingCategory && <AddIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#667eea',
              '&:hover': { bgcolor: '#5568d3' },
            }}
          >
            {creatingCategory ? <CircularProgress size={18} /> : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Recurring Dialog */}
      <Dialog 
        open={openEditRecurring} 
        onClose={() => { setOpenEditRecurring(false); setEditingRecurring(null); }} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, p: 3, pb: 1 }}>
          Editar Transacción Automatizada
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {editingRecurring ? (
            <RecurringForm value={editingRecurring} onChange={setEditingRecurring} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => { setOpenEditRecurring(false); setEditingRecurring(null); }}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveEditRecurring} 
            variant="contained" 
            disabled={savingEditing}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#667eea',
              '&:hover': { bgcolor: '#5568d3' },
            }}
          >
            {savingEditing ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage;