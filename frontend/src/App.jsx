// src/App.jsx
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { router } from './config/routes';
import store from './store';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import useNotifications from './hooks/useNotifications';
import React, { Suspense } from 'react';
// NOTE: Notifications and direct components are provided via routes.


// Tema de Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function NotificationInitializer() {
  const { isAuthenticated } = useAuth();
  const { initializeNotifications, permissionState, canRequestPermission } = useNotifications();

  useEffect(() => {
    const tryInit = async () => {
      if (isAuthenticated && canRequestPermission() && permissionState !== 'granted') {
        try {
          await initializeNotifications();
        } catch (e) {
          console.warn('Auto init notifications failed:', e?.message || e);
        }
      }
    };

    tryInit();
  }, [isAuthenticated, permissionState, initializeNotifications, canRequestPermission]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationInitializer />
        <ErrorBoundary>
          <Suspense fallback={<div style={{padding:20}}>Cargando...</div>}>
            <RouterProvider router={router} />
          </Suspense>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
}

export default App;