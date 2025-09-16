# 🏢 Gestor Condominos - Guía de Configuración

## 📋 Estado del Proyecto

### ✅ Cambios Implementados

1. **Arquitectura del Backend Migrada**
   - Servidor principal: `server/app.cjs` (CommonJS)
   - Arquitectura Clean Code con:
     - Controladores
     - Servicios
     - Repositorios
     - Middleware de autenticación JWT

2. **Sistema de Autenticación**
   - JWT con refresh tokens
   - Protección de rutas en frontend
   - Login/Logout funcional
   - Manejo de sesiones

3. **Frontend Actualizado**
   - Servicios API migrados para usar autenticación
   - Página de login implementada
   - Rutas protegidas
   - Header con información del usuario

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js v18+
- PostgreSQL (local o Neon)
- npm o yarn

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno

Asegúrate de que el archivo `.env` tenga estas variables:

```env
# Database
DATABASE_URL=postgresql://mini-server@localhost:5432/gestor_condominos?sslmode=disable
NEON_DATABASE_URL=<tu-url-de-neon-si-usas-produccion>

# Server
PORT=3002
NODE_ENV=development

# JWT
JWT_SECRET=gestor-condominos-2025-secret-key-mac-mini-server
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
VITE_API_URL=http://localhost:3002
VITE_APP_URL=http://localhost:5173
```

### 3. Ejecutar Migraciones de Base de Datos

```bash
# Ejecutar migraciones pendientes
cd server
npx knex migrate:latest --knexfile knexfile.cjs
```

### 4. Crear Usuario de Prueba (Opcional)

Puedes crear un usuario de prueba ejecutando este SQL en tu base de datos:

```sql
INSERT INTO users (email, password, name, role, is_active, email_verified, created_at, updated_at)
VALUES (
  'admin@example.com',
  '$2a$10$YourHashedPasswordHere', -- Usa bcrypt para generar el hash
  'Administrador',
  'super_admin',
  true,
  true,
  NOW(),
  NOW()
);
```

### 5. Iniciar la Aplicación

#### Opción 1: Desarrollo (Frontend + Backend)
```bash
npm run dev:all
```

#### Opción 2: Servidores Separados
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

#### Opción 3: Producción
```bash
npm run build
npm run start:production
```

## 🔑 Flujo de Autenticación

1. El usuario accede a la aplicación
2. Si no está autenticado, es redirigido a `/login`
3. Ingresa credenciales
4. El servidor valida y retorna:
   - Access Token (JWT - 15 min)
   - Refresh Token (Cookie HttpOnly - 7 días)
5. El frontend almacena el token en Zustand
6. Todas las peticiones incluyen el token en headers

## 📁 Estructura de Archivos Clave

```
gestor-condominos-easypanel-v2/
├── server/
│   ├── app.cjs                  # Servidor principal
│   ├── config/
│   │   ├── database.cjs         # Configuración de BD
│   │   └── knex.cjs            # Configuración de Knex
│   ├── controllers/            # Controladores de rutas
│   ├── services/               # Lógica de negocio
│   ├── repositories/           # Acceso a datos
│   └── middleware/
│       └── auth.cjs           # Middleware JWT
├── src/
│   ├── lib/
│   │   ├── api-v2.ts          # Cliente API con auth
│   │   └── auth-api.ts        # Funciones de auth
│   ├── store/
│   │   └── authStore.ts       # Estado global auth
│   ├── components/
│   │   └── auth/              # Componentes de auth
│   └── pages/
│       └── Login.tsx          # Página de login
└── README-SETUP.md            # Este archivo
```

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté ejecutándose
- Confirma las credenciales en `.env`
- Ejecuta las migraciones

### Error: "401 Unauthorized"
- El token puede haber expirado
- Verifica que el JWT_SECRET sea el mismo en frontend y backend
- Revisa la consola del navegador para errores

### Error: "Port already in use"
```bash
# Encontrar proceso usando el puerto
lsof -i :3002
# Matar el proceso
kill -9 <PID>
```

## 📝 Endpoints Migrados

### ✅ Con Nueva Arquitectura (JWT)
- `/api/auth/*` - Autenticación
- `/api/buildings/*` - Edificios
- `/api/members/*` - Miembros

### ⚠️ Pendientes de Migrar
- `/api/convocatorias/*`
- `/api/transactions/*`
- `/api/documents/*`
- `/api/minutes/*`
- `/api/dashboard/*`

## 🔐 Roles y Permisos

- `super_admin`: Acceso total
- `admin`: Gestión de edificio
- `manager`: Operaciones diarias
- `member`: Solo lectura

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `pm2 logs`
2. Verifica la consola del navegador
3. Confirma que todas las dependencias estén instaladas
4. Asegúrate de que las migraciones se ejecutaron

---
Última actualización: 26 Junio 2025