// src/components/TransactionList.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useTransactions from '../../../hooks/useTransactions';
import db from '../../../services/db';
import api from '../../../config/axiosConfig';
import syncService from '../../../services/indexedDB/syncService';
import {
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';

function TransactionList() {
  const {
    transactions,
    loading,
    syncing,
    error,
    isOnline,
    pendingCount,
    createTransaction,
    deleteTransaction,
    syncTransactions,
    refresh
  } = useTransactions();

  const { user } = useSelector(state => state.auth);

  // Modal/form state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [formError, setFormError] = useState(null);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const openForm = () => setOpen(true);
  const closeForm = () => {
    setOpen(false);
    setTitle('');
    setType('EXPENSE');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setCategoryId('');
    setFormError(null);
  };

  const openAddCategory = () => {
    setAddCatOpen(true);
    setNewCatName('');
    setNewCatColor('#3B82F6');
    setNewCatIcon('📁');
  };

  const closeAddCategory = () => {
    setAddCatOpen(false);
    setNewCatName('');
    setNewCatColor('#3B82F6');
    setNewCatIcon('📁');
    setCreatingCategory(false);
  };

  const handleAddCategory = async () => {
    setCreatingCategory(true);
    try {
      if (!newCatName || newCatName.trim().length < 2) {
        throw new Error('El nombre de la categoría debe tener al menos 2 caracteres');
      }
      // Crear (el servicio maneja online/offline y encolado)
      const result = await syncService.createCategory({
        name: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon
      }, user?.id);

      const created = result?.data;
      if (created) {
        // Si fue offline, el ID puede ser temporal; igualmente guardamos y recargamos
        await db.saveCategories([created]);
        await loadCategories();
        setCategoryId(created.id);
        closeAddCategory();
      }
    } catch (err) {
      console.error('Error creando categoría desde UI:', err);
      alert(err?.response?.data?.message || err.message || 'Error creando categoría');
      setCreatingCategory(false);
    }
  };

  // Cargar categorías (IndexedDB primero, luego API si está online y no hay categorías locales)
  const loadCategories = async () => {
    try {
      if (!user?.id) return;
      let local = await db.getUserCategories(user.id);
      if (local && local.length > 0) {
        setCategories(local);
        setCategoryId(local[0].id);
        return;
      }

      if (navigator.onLine) {
        const resp = await api.get('/categories');
        const serverCats = resp?.data?.data || [];
        if (Array.isArray(serverCats) && serverCats.length > 0) {
          // Guardar en IndexedDB para uso offline
          await db.saveCategories(serverCats);
          setCategories(serverCats);
          setCategoryId(serverCats[0].id);
          return;
        }
      }

      // No hay categorías
      setCategories([]);
      setCategoryId('');
    } catch (err) {
      console.error('Error cargando categorías para el formulario:', err);
      setCategories([]);
      setCategoryId('');
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOnline]);

  // Computed helpers
  const customCategoriesCount = categories.filter(c => !c.isDefault).length;
  const canAddCategory = user?.role !== 'FREE' || customCategoriesCount < 3;

  useEffect(() => {
    // Las transacciones se cargan automáticamente
  }, []);

  const handleCreate = async () => {
    setFormError(null);
    try {
      if (!categoryId) {
        setFormError('Selecciona una categoría válida');
        return;
      }
      const payload = {
        title: title.trim(),
        type,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        description: description.trim(),
        categoryId
      };

      await createTransaction(payload);
      closeForm();
      alert('Transacción creada!');
    } catch (err) {
      console.error('Error creando transacción desde UI:', err);
      setFormError(err.message || 'Error creando transacción');
    }
  };

  return (
    <div>
      <h2>Mis Transacciones</h2>
      
      {/* Estado de conexión */}
      <Alert severity={isOnline ? 'success' : 'warning'}>
        {isOnline ? '🌐 Conectado' : '📡 Sin conexión'}
      </Alert>

      {/* Transacciones pendientes */}
      {pendingCount > 0 && (
        <Alert severity="info">
          {pendingCount} transacción(es) pendientes de sincronizar
          <Button onClick={syncTransactions} disabled={syncing || !isOnline}>
            {syncing ? <CircularProgress size={20} /> : 'Sincronizar Ahora'}
          </Button>
        </Alert>
      )}

      {/* Error */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Cargando */}
      {loading && <CircularProgress />}

      {/* Lista de transacciones */}
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            <strong>{tx.title}</strong> - ${tx.amount}
            {tx.isPending && ' (Pendiente de sincronizar)'}
            <button onClick={() => deleteTransaction(tx.id)}>Eliminar</button>
          </li>
        ))}
      </ul>

      {/* Botones de acción */}
      <Button onClick={openForm}>Crear Transacción</Button>
      <Dialog open={open} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle>Crear Transacción</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="type-label">Tipo</InputLabel>
            <Select
              labelId="type-label"
              value={type}
              label="Tipo"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="EXPENSE">Gasto</MenuItem>
              <MenuItem value="INCOME">Ingreso</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Monto"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="cat-label">Categoría</InputLabel>
            <Select
              labelId="cat-label"
              value={categoryId}
              label="Categoría"
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__ADD_NEW__') {
                  // Abrir diálogo para añadir categoría
                  openAddCategory();
                  return;
                }
                setCategoryId(val);
              }}
            >
              {categories.length === 0 && (
                <MenuItem value="">(No hay categorías)</MenuItem>
              )}
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
              <MenuItem value="__ADD_NEW__" disabled={!canAddCategory}>
                {canAddCategory ? 'Añadir categoría...' : 'Límite de categorías alcanzado'}
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading || syncing}>
            {loading || syncing ? <CircularProgress size={18} /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal para añadir categoría */}
      <Dialog open={addCatOpen} onClose={closeAddCategory} fullWidth maxWidth="xs">
        <DialogTitle>Añadir categoría</DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre de la categoría"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Color (hex)"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Icono"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddCategory}>Cancelar</Button>
          <Button onClick={handleAddCategory} variant="contained" disabled={creatingCategory}>
            {creatingCategory ? <CircularProgress size={18} /> : 'Crear categoría'}
          </Button>
        </DialogActions>
      </Dialog>
      <Button onClick={refresh}>Refrescar</Button>
    </div>
  );
}

export default TransactionList;