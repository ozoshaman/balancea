// src/App.jsx
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { router } from './config/routes';
import store from './store';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
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

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
}

export default App;