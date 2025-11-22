// server.js
import 'dotenv/config';
import app from './src/app.js';
import { PrismaClient } from '@prisma/client';
import { startRecurringTransactionsCron } from './src/jobs/recurringTransactions.js';



const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Función para verificar la conexión a la base de datos
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a MongoDB exitosamente');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

// Iniciar servidor
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
     startRecurringTransactionsCron();
  });
};

startServer();

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n👋 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});