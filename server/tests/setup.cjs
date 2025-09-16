// Setup de Jest para testing
require('dotenv').config({ path: '.env.test' });

// Mock de console para evitar logs durante tests
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Configurar timeout global
jest.setTimeout(10000);

// Limpiar base de datos de test antes de cada suite
beforeAll(async () => {
  // Aquí puedes agregar lógica para preparar la BD de test
});

// Limpiar después de cada test
afterEach(async () => {
  jest.clearAllMocks();
});

// Cerrar conexiones después de todos los tests
afterAll(async () => {
  const { db } = require('../config/knex.cjs');
  await db.destroy();
});