# 🏢 Gestor de Condominios Dark

Sistema avanzado de gestión de condominios con modo oscuro y funcionalidades mejoradas.

## ✨ Características Principales

- 🌙 **Modo Oscuro/Claro** - Tema dinámico con transiciones suaves
- 🏢 **Gestión de Edificios** - CRUD completo de propiedades
- 👥 **Administración de Miembros** - Gestión avanzada de condóminos
- 💰 **Módulo Financiero** - Transacciones, presupuestos y reportes
- 📧 **Sistema de Comunicaciones** - Cartas y notificaciones automatizadas
- 📝 **Convocatorias y Actas** - Gestión digital de reuniones
- 📊 **Dashboard Analítico** - Métricas y visualizaciones avanzadas

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Estado**: Zustand + TanStack Query
- **Base de Datos**: PostgreSQL (Neon)
- **UI Components**: Radix UI + Lucide Icons
- **Forms**: React Hook Form + Zod

## 🛠️ Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <repository-url>
   cd gestor-condominos-dark
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tu configuración de Neon
   ```

4. **Iniciar desarrollo**:
   ```bash
   npm run dev
   ```

## 🗄️ Base de Datos

El proyecto usa **Neon PostgreSQL** como base de datos serverless:

- **Host**: Neon Cloud
- **Conexión**: SSL requerida
- **Features**: Branching, Auto-scaling, Point-in-time recovery

### Configuración de BD

```env
DATABASE_URL=postgresql://usuario:password@endpoint.neon.tech/database?sslmode=require
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React reutilizables
├── pages/              # Páginas principales de la aplicación
├── lib/                # Configuraciones y utilidades
├── hooks/              # Custom React hooks
├── types/              # Definiciones de TypeScript
├── utils/              # Funciones de utilidad
└── styles/             # Estilos globales
```

## 🎨 Tema y Diseño

- **Sistema de Temas**: Modo claro/oscuro con variables CSS
- **Componentes**: Biblioteca completa basada en Radix UI
- **Animaciones**: Transiciones suaves con Framer Motion
- **Responsive**: Mobile-first design
- **Accesibilidad**: WCAG AA compliant

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter ESLint
- `npm run type-check` - Verificación de tipos

## 📊 Funcionalidades

### Dashboard
- Métricas en tiempo real
- Gráficos interactivos
- Filtros avanzados
- Exportación de datos

### Gestión de Miembros
- CRUD completo
- Importación/Exportación Excel
- Historial de cambios
- Búsqueda y filtros

### Módulo Financiero
- Transacciones categorizadas
- Presupuestos comparativos
- Reportes automáticos
- Gestión de morosidad

### Comunicaciones
- Plantillas personalizables
- Envío masivo de emails
- Historial de comunicaciones
- Notificaciones push

## 🚀 Deploy

El proyecto está optimizado para deploy en:

- **Vercel** (recomendado)
- **Netlify**
- **Railway**
- **Cualquier servicio con soporte Node.js**

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.

## 🤝 Contribución

Este es un proyecto privado. Para contribuciones contactar al administrador.

---

Desarrollado con ❤️ para la gestión moderna de condominios.