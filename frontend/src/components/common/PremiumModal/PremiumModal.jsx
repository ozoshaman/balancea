import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography } from '@mui/material';
import api from '../../../config/axiosConfig';
import db from '../../../services/indexedDB/db';
import syncService from '../../../services/indexedDB/syncService';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice';

const cardNumberFormat = (v = '') => v.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim();

const PremiumModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [cardNumber, setCardNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    setError(null);
    const num = cardNumber.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(num)) return 'Número de tarjeta inválido';
    if (!/^[A-Za-z ]{2,}$/.test(name)) return 'Nombre en tarjeta inválido';
    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) return 'Fecha inválida (MM/YY)';
    if (!/^\d{3,4}$/.test(cvv)) return 'CVV inválido';
    // expiry check
    const [mm, yy] = expiry.split('/').map(s => Number(s));
    const exp = new Date(2000 + yy, mm - 1, 1);
    const now = new Date();
    if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) return 'La tarjeta está vencida';
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    setError(null);

    const payload = { cardNumber: cardNumber.replace(/\s+/g, ''), name, expiry, cvv };

    try {
      const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
      const userId = storedUser?.id;

      if (navigator.onLine) {
        const resp = await api.post('/users/upgrade', payload);
        const updatedUser = resp?.data?.data;
        if (updatedUser) {
          // actualizar credenciales locales (mantener token)
          const token = localStorage.getItem('token');
          if (token) dispatch(setCredentials({ user: updatedUser, token }));
        }
        onClose(true);
      } else {
        // Encolar petición de upgrade
        const pending = await db.addPendingPremium({ userId, createdAt: new Date().toISOString() });
        // Registrar background sync
        try { syncService.registerBackgroundSync('sync-premium'); } catch(e){/*ignore*/}
        onClose(true);
      }
    } catch (err) {
      console.error('Error en upgrade:', err);
      setError(err?.response?.data?.message || err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>Obtener Premium (simulación)</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField label="Número de tarjeta" fullWidth margin="normal" value={cardNumber} onChange={e => setCardNumber(cardNumberFormat(e.target.value))} placeholder="1234 5678 9012 3456" />
          <TextField label="Nombre en la tarjeta" fullWidth margin="normal" value={name} onChange={e => setName(e.target.value)} placeholder="JUAN PEREZ" />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="MM/AA" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="08/26" />
            <TextField label="CVV" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" />
          </Box>
          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>{loading ? 'Procesando...' : 'Confirmar pago'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PremiumModal;
