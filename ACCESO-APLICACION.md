# 🚀 ACCESO A LA APLICACIÓN - GESTOR CONDOMINOS

## ✅ La aplicación está funcionando en:

### 🌐 Frontend (Interfaz de Usuario)
```
http://localhost:5174
```

### 🔌 Backend API
```
http://localhost:3002
```

## 🔐 CREDENCIALES DE ACCESO

### Opción 1: Super Admin (ve todos los edificios)
- **Email**: `admin@example.com`
- **Password**: `Admin123!`
- **Rol**: Super Administrador
- **Edificio**: Edificio Principal (Lisboa)

### Opción 2: Admin Condominio
- **Email**: `admin@migestpro.com`
- **Password**: `Admin123!`
- **Rol**: Administrador
- **Edificio**: Condomino Buraca 1 (Amadora)

## 📋 PASOS PARA ACCEDER

1. **Abre tu navegador web** (Chrome, Firefox, Safari, etc.)

2. **Ve a esta dirección**:
   ```
   http://localhost:5174
   ```

3. **Serás redirigido automáticamente a la página de login**

4. **Ingresa las credenciales**:
   - Email: `admin@example.com`
   - Password: `Admin123!`

5. **Haz clic en "Entrar"**

## 🎯 QUÉ VERÁS DESPUÉS DEL LOGIN

### Si entras como admin@example.com:
- **Dashboard** con estadísticas del Edificio Principal
- **3 Miembros**: João Silva, Maria Santos, Pedro Costa
- **1 Transacción** financiera
- **Sin convocatorias** (este edificio no tiene)

### Si entras como admin@migestpro.com:
- **Dashboard** con estadísticas del Condomino Buraca 1
- **6 Miembros** del edificio
- **3 Convocatorias** programadas
- **3 Actas** de reuniones
- **3 Transacciones** financieras

## ⚠️ IMPORTANTE

- La aplicación está corriendo en el puerto **5174** (no 5173)
- Si no puedes acceder, verifica que:
  - El backend esté corriendo: `npm run dev:server`
  - El frontend esté corriendo: `npm run dev`
- Las contraseñas son sensibles a mayúsculas/minúsculas

## 🛠️ COMANDOS ÚTILES

Si necesitas reiniciar los servicios:

```bash
# Backend (en una terminal)
npm run dev:server

# Frontend (en otra terminal)
npm run dev
```

## 📱 CAPTURAS DE REFERENCIA

1. **Página de Login**: Formulario simple con email y password
2. **Dashboard**: Vista general con tarjetas de estadísticas
3. **Miembros**: Lista con paginación y búsqueda
4. **Convocatorias**: Gestión completa con generación de PDF
5. **Finanzas**: Dashboard financiero y transacciones

---

🎉 **¡La aplicación está lista para usar!**

Simplemente abre: http://localhost:5174