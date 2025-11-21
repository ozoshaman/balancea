// frontend/scripts/copy-sw.js
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'src', 'sw', 'serviceWorker.js');
const destination = path.join(__dirname, '..', 'public', 'service-worker.js');

try {
  fs.copyFileSync(source, destination);
  console.log('✅ Service Worker copiado a public/service-worker.js');
} catch (error) {
  console.error('❌ Error al copiar Service Worker:', error);
  process.exit(1);
}