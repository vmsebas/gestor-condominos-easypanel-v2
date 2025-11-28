const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

// Importar configuración y utilidades
const { testConnection, pool } = require('./config/database.cjs');
const { errorHandler } = require('./middleware/errorHandler.cjs');

// Crear aplicación Express
const app = express();

// ============================================
// MIDDLEWARE - Seguridad y configuración
// ============================================

// Helmet con CSP condicional (habilitado solo en producción)
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://*.vimasero.com", "http://localhost:*"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  } : false,
  crossOriginEmbedderPolicy: false
}));

// CORS configurado para dominios permitidos
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3002',
    'https://gestor.vimasero.com',
    process.env.VITE_APP_URL
  ].filter(Boolean),
  credentials: true
}));

// Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Logging middleware (solo en desarrollo o si está habilitado)
if (process.env.NODE_ENV !== 'production' || process.env.LOG_REQUESTS === 'true') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Servir archivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// HEALTH CHECK - Sin autenticación (debe estar ANTES de las rutas)
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const dbResult = await pool.query('SELECT 1 as ok');
    const dbConnected = dbResult.rows[0]?.ok === 1;

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '2.2.0',
      checks: {
        database: dbConnected ? 'connected' : 'disconnected',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      checks: {
        database: 'error',
        uptime: Math.floor(process.uptime())
      }
    });
  }
});

// ============================================
// RUTAS API - Definición centralizada
// ============================================

// Objeto con todas las rutas (evita duplicación)
const routes = {
  'auth': require('./routes/auth.cjs'),
  'buildings': require('./routes/buildings.cjs'),
  'members': require('./routes/members.cjs'),
  'convocatorias': require('./routes/convocatorias.cjs'),
  'documents': require('./routes/documents.cjs'),
  'attendance-sheets': require('./routes/attendanceSheets.cjs'),
  'transactions': require('./routes/transactions.cjs'),
  'minutes': require('./routes/minutes.cjs'),
  'financial-summary': require('./routes/financial-summary.cjs'),
  'db-test': require('./routes/db-test.cjs'),
  'tasks': require('./routes/tasks.cjs'),
  'communications': require('./routes/communications.cjs'),
  'finance': require('./routes/finance.cjs'),
  'arrears': require('./routes/arrears.cjs'),
  'history': require('./routes/history.cjs'),
  'letters': require('./routes/letters.cjs'),
  'financial-periods': require('./routes/financial-periods.cjs'),
  'budgets': require('./routes/budgets.cjs'),
  'categories': require('./routes/categories.cjs'),
};

// Registrar todas las rutas con prefijo /api
Object.entries(routes).forEach(([routePath, handler]) => {
  app.use(`/api/${routePath}`, handler);
});

// Rutas especiales
app.use('/api', require('./routes/minuteSignatures.cjs')); // Minute signatures bajo /api
app.use('/api/actas', routes['minutes']); // Alias: /api/actas → /api/minutes

// ============================================
// HEALTH CHECK - Verifica BD y estado
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const dbResult = await pool.query('SELECT 1 as ok');
    const dbConnected = dbResult.rows[0]?.ok === 1;

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '2.2.0',
      checks: {
        database: dbConnected ? 'connected' : 'disconnected',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      checks: {
        database: 'error',
        uptime: Math.floor(process.uptime())
      }
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

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

// ============================================
// SERVIDOR - Inicialización
// ============================================

const startServer = async () => {
  const PORT = process.env.PORT || 3002;

  console.log('==========================================');
  console.log('🚀 Starting Gestor Condominios Server');
  console.log('==========================================');

  // Verificar conexión a base de datos
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
  console.log(`📋 Routes registered: ${Object.keys(routes).length + 2}`);
  console.log(`🔒 CSP: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}`);
  console.log('==========================================');

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`💚 Health check at http://localhost:${PORT}/api/health`);
    console.log('==========================================');
  });
};

// Exportar app para testing y el starter
module.exports = { app, startServer };

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
  startServer();
}
