// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import * as serviceWorkerRegistration from './sw/sw-config';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('✅ PWA lista para uso offline');
    
    // Puedes mostrar un toast aquí
    // toast.success('App instalada correctamente');
  },
  onUpdate: (registration) => {
    console.log('🔄 Nueva versión disponible');
    
    // Mostrar notificación al usuario
    const event = new CustomEvent('showUpdateToast', {
      detail: { registration }
    });
    window.dispatchEvent(event);
  }
});