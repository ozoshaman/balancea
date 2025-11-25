// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/api/authService';

// Estado inicial
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

// Thunks asíncronos
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      // Sólo persistir token/usuario si el backend devolvió token
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      // Guardar token también en Service Worker (IndexedDB) para uso en sync desde SW
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && data?.token) {
        navigator.serviceWorker.ready
          .then((reg) => reg.active && reg.active.postMessage({ type: 'SAVE_AUTH_TOKEN', token: data.token }))
          .catch(() => {});
      }
      return data;
    } catch (error) {
      return rejectWithValue(error || { message: 'Error al registrar usuario' });
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
      // También guardar token en Service Worker para que pueda usarlo al sincronizar
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && data?.token) {
        navigator.serviceWorker.ready
          .then((reg) => reg.active && reg.active.postMessage({ type: 'SAVE_AUTH_TOKEN', token: data.token }))
          .catch(() => {});
      }
      return data;
    } catch (error) {
      return rejectWithValue(error || { message: 'Error al iniciar sesión' });
    }
  }
);

export const verifyAuth = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.verifyToken();
      return data;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(error || { message: 'Sesión expirada' });
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // Establecer credenciales (usar después de verificar email para login automático)
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && token) {
        navigator.serviceWorker.ready
          .then((reg) => reg.active && reg.active.postMessage({ type: 'SAVE_AUTH_TOKEN', token }))
          .catch(() => {});
      }
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token || null;
        // No marcar como autenticado si no hay token (registro que requiere verificación)
        state.isAuthenticated = !!action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Verify
    builder
      .addCase(verifyAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, setCredentials, clearError } = authSlice.actions;
export default authSlice.reducer;