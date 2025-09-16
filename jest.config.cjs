module.exports = {
  // Entorno de prueba
  testEnvironment: 'node',
  
  // Directorio raíz para las pruebas
  roots: ['<rootDir>/server'],
  
  // Patrones de archivos de prueba
  testMatch: [
    '**/__tests__/**/*.test.cjs',
    '**/?(*.)+(spec|test).cjs'
  ],
  
  // Archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Configuración de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.cjs',
    '!server/**/*.test.cjs',
    '!server/**/*.spec.cjs',
    '!server/test-server.cjs',
    '!server/simple-server.cjs',
    '!server/debug-server.cjs',
    '!server/production-server.cjs',
    '!server/database/migrations/*.cjs',
    '!server/database/seeds/*.cjs'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Transformaciones
  transform: {
    '^.+\\.cjs$': ['babel-jest', {
      presets: ['@babel/preset-env']
    }]
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.cjs'],
  
  // Variables de entorno para testing
  testTimeout: 10000,
  
  // Reporte detallado
  verbose: true,
  
  // Limpiar mocks automáticamente
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
};