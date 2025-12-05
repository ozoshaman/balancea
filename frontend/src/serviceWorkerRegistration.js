// frontend/src/serviceWorkerRegistration.js
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    // El SW solo funciona en producción o si lo habilitas en dev
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // En localhost, verificar si existe el SW
        checkValidServiceWorker(swUrl, config);

        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Esta app está siendo servida con caché por un Service Worker. ' +
            'Más info: https://cra.link/PWA'
          );
        });
      } else {
        // En producción, registrar directamente
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('✅ Service Worker registrado exitosamente:', registration);

      // Detectar actualizaciones
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nueva versión disponible
              console.log('🔄 Nueva versión de la app disponible!');

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }

              // Mostrar notificación al usuario
              showUpdateNotification(registration);
            } else {
              // Contenido cacheado para uso offline
              console.log('✅ Contenido cacheado para uso offline');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('❌ Error al registrar Service Worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No hay conexión a internet. La app está corriendo en modo offline.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Función para mostrar notificación de actualización
function showUpdateNotification(registration) {
  const event = new CustomEvent('swUpdateAvailable', {
    detail: registration
  });
  window.dispatchEvent(event);
}

// Forzar actualización
export function forceUpdate(registration) {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

// Listener para mensajes del Service Worker (centralizado)
if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Mensaje del SW:', event.data);

      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        window.dispatchEvent(new CustomEvent('syncComplete', {
          detail: event.data
        }));
      }
    });
  } catch (e) {
    // Si el navegador no soporta o no hay SW, ignorar
  }
}
