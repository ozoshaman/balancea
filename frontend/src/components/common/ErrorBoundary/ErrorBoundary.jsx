import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Aquí podríamos enviar el error a un servicio de logging
    // console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || String(this.state.error);
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Unexpected Application Error</Typography>
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{message}</Typography>
          <Button variant="contained" onClick={this.handleReload}>Recargar</Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
