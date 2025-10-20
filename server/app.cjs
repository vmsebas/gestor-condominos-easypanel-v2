const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

// Importar configuración y utilidades
const { testConnection } = require('./config/database.cjs');
const { errorHandler } = require('./middleware/errorHandler.cjs');

// Crear aplicación Express
const app = express();

// Middleware básicos - CSP deshabilitado para desarrollo
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitar CSP para desarrollo
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3002', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3002',
    process.env.VITE_APP_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use('/api/auth', require('./routes/auth.cjs'));
app.use('/api/buildings', require('./routes/buildings.cjs'));
app.use('/api/members', require('./routes/members.cjs'));
app.use('/api/convocatorias', require('./routes/convocatorias.cjs'));
app.use('/api/documents', require('./routes/documents.cjs'));
app.use('/api/attendance-sheets', require('./routes/attendanceSheets.cjs'));

// Rutas duplicadas para manejar el problema de proxy de Cloudflare
app.use('/auth', require('./routes/auth.cjs'));
app.use('/buildings', require('./routes/buildings.cjs'));
app.use('/members', require('./routes/members.cjs'));
app.use('/convocatorias', require('./routes/convocatorias.cjs'));
app.use('/documents', require('./routes/documents.cjs'));
app.use('/attendance-sheets', require('./routes/attendanceSheets.cjs'));
app.use('/transactions', require('./routes/transactions.cjs'));
app.use('/minutes', require('./routes/minutes.cjs'));
app.use('/actas', require('./routes/minutes.cjs'));
app.use('/financial-summary', require('./routes/financial-summary.cjs'));
app.use('/db-test', require('./routes/db-test.cjs'));
app.use('/tasks', require('./routes/tasks.cjs'));
app.use('/communications', require('./routes/communications.cjs'));
app.use('/finance', require('./routes/finance.cjs'));
app.use('/arrears', require('./routes/arrears.cjs'));

// Rutas adicionales
app.use('/api/transactions', require('./routes/transactions.cjs'));
app.use('/api/minutes', require('./routes/minutes.cjs'));
// Alias para actas (minutes)
app.use('/api/actas', require('./routes/minutes.cjs'));
app.use('/api/financial-summary', require('./routes/financial-summary.cjs'));
app.use('/api/db-test', require('./routes/db-test.cjs'));
app.use('/api/tasks', require('./routes/tasks.cjs'));
app.use('/api/communications', require('./routes/communications.cjs'));
app.use('/api/finance', require('./routes/finance.cjs'));
app.use('/api/arrears', require('./routes/arrears.cjs'));
// app.use('/api/letters', require('./routes/letters.cjs'));

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '2.2.0'
  });
});

// Ruta 404 para endpoints no encontrados
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async () => {
  const PORT = process.env.PORT || 3002;
  
  // Verificar conexión a base de datos
  console.log('==========================================');
  console.log('🚀 Starting server with clean architecture');
  console.log('==========================================');
  
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Could not connect to database. Server will start but may have issues.');
  }
  
  // Inicializar cron jobs solo si la BD está conectada
  if (dbConnected) {
    try {
      const cronService = require('./services/cronService.cjs');
      cronService.initialize();
      console.log('✅ Cron jobs initialized successfully');
    } catch (error) {
      console.error('⚠️ Failed to initialize cron jobs:', error.message);
    }
  }
  
  console.log('==========================================');
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🏛️ Architecture: Controllers → Services → Repositories`);
    console.log('==========================================');
  });
};

// Exportar app para testing y el starter
module.exports = { app, startServer };

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
  startServer();
}