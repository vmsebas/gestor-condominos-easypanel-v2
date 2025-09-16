# 🧪 Guía de Testing - Gestor Condóminos

## ✅ Testing Implementado

### Configuración
- **Framework**: Jest v30
- **BD Test**: PostgreSQL local `gestor_condominos_test`
- **Entorno**: `.env.test` con configuración separada
- **Coverage mínimo**: 70% (configurado en `jest.config.cjs`)

### Tests Creados

#### 1. Tests Unitarios - Repositorios
**`server/__tests__/repositories/userRepository.test.cjs`** ✅
- `createUser`: Creación con hash de contraseña
- `findByEmail`: Búsqueda case-insensitive
- `incrementFailedAttempts`: Bloqueo después de 5 intentos
- `resetFailedAttempts`: Desbloqueo de cuenta
- `updatePassword`: Actualización de contraseña
- `getStats`: Estadísticas de usuarios

#### 2. Tests Unitarios - Servicios
**`server/__tests__/services/authService.test.cjs`** ✅
- `login`: Validación de credenciales y bloqueos
- `register`: Registro con validaciones
- `refreshAccessToken`: Renovación de tokens
- `changePassword`: Cambio de contraseña
- `resetPassword`: Reset con token
- `logout`: Revocación de tokens

#### 3. Tests de Integración - Rutas
**`server/__tests__/routes/auth.test.cjs`** ✅
- POST `/api/auth/register`: Registro completo
- POST `/api/auth/login`: Login con cookies
- GET `/api/auth/me`: Usuario autenticado
- POST `/api/auth/logout`: Cierre de sesión
- POST `/api/auth/change-password`: Cambio de contraseña
- POST `/api/auth/forgot-password`: Solicitud de reset
- GET `/api/auth/sessions`: Listado de sesiones

## 📊 Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm test:watch

# Ejecutar con coverage
npm test:coverage

# Ejecutar solo tests unitarios
npm test:unit

# Ejecutar solo tests de integración
npm test:integration

# Ejecutar un archivo específico
npm test -- server/__tests__/services/authService.test.cjs

# Ejecutar tests que coincidan con un patrón
npm test -- --testNamePattern="login"
```

## 🔧 Estructura de Tests

### Test Unitario (Ejemplo)
```javascript
describe('UserRepository', () => {
  beforeEach(async () => {
    await db('users').del(); // Limpiar tabla
  });

  describe('createUser', () => {
    it('debe crear un nuevo usuario', async () => {
      // Arrange
      const userData = { ... };

      // Act
      const user = await userRepository.createUser(userData);

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });
  });
});
```

### Test de Integración (Ejemplo)
```javascript
const request = require('supertest');
const { app } = require('../../app.cjs');

describe('Auth Routes', () => {
  it('debe permitir login', async () => {
    // Arrange
    await createTestUser();

    // Act
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

## 🚀 Cómo Agregar Nuevos Tests

### 1. Para un Nuevo Repositorio
```bash
# Crear archivo
touch server/__tests__/repositories/[entity]Repository.test.cjs
```

```javascript
const [entity]Repository = require('../../repositories/[entity]Repository.cjs');
const { db } = require('../../config/knex.cjs');

describe('[Entity]Repository', () => {
  beforeEach(async () => {
    await db('[entities]').del();
  });

  // Tests aquí...
});
```

### 2. Para un Nuevo Servicio
```bash
# Crear archivo
touch server/__tests__/services/[entity]Service.test.cjs
```

```javascript
const [entity]Service = require('../../services/[entity]Service.cjs');
// Mock de repositorios si es necesario
jest.mock('../../repositories/[entity]Repository.cjs');

describe('[Entity]Service', () => {
  // Tests aquí...
});
```

### 3. Para Nuevas Rutas
```bash
# Crear archivo
touch server/__tests__/routes/[entity].test.cjs
```

```javascript
const request = require('supertest');
const { app } = require('../../app.cjs');

describe('[Entity] Routes', () => {
  // Setup de datos de prueba
  
  // Tests de endpoints...
});
```

## ⚠️ Consideraciones Importantes

### Base de Datos de Test
1. **Separada**: Usa `gestor_condominos_test` (no producción)
2. **Limpia**: Se limpia antes de cada test
3. **Esquema**: Debe coincidir con producción

### Mocks y Stubs
- Usar `jest.mock()` para dependencias externas
- Evitar llamadas reales a APIs externas
- Mockear servicios de email, SMS, etc.

### Datos de Prueba
- Usar factories o builders para crear datos
- Mantener datos mínimos pero realistas
- Limpiar después de cada test

### Performance
- Tests deben ser rápidos (< 5s por suite)
- Usar `beforeAll` para setup costoso
- Paralelizar cuando sea posible

## 📈 Coverage Report

Para ver el reporte de coverage detallado:
```bash
npm test:coverage
open coverage/lcov-report/index.html
```

### Metas de Coverage
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

## 🐛 Debugging Tests

### Ver logs durante tests
```javascript
// Temporalmente en el test
console.log = jest.fn(console.log);
```

### Ejecutar un solo test
```javascript
it.only('debe hacer algo', async () => {
  // Solo este test se ejecutará
});
```

### Saltar un test
```javascript
it.skip('debe hacer algo', async () => {
  // Este test se saltará
});
```

### Aumentar timeout
```javascript
it('debe hacer algo', async () => {
  // Test con timeout extendido
}, 10000); // 10 segundos
```

## 🔄 CI/CD Integration

Para integrar con GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm ci
    - run: npm test:coverage
    - uses: codecov/codecov-action@v3
```

---

Última actualización: 26 Junio 2025