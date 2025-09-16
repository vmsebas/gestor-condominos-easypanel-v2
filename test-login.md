# 🔐 Guía de Login - Gestor Condominos

## Usuarios Disponibles en la Base de Datos

### 1. Super Admin - Edificio Principal
- **Email**: admin@example.com
- **Password**: Admin123!
- **Role**: super_admin
- **Edificio**: Edificio Principal (Lisboa)

### 2. Admin - Condomino Buraca 1
- **Email**: admin@migestpro.com
- **Password**: Admin123!
- **Role**: admin
- **Edificio**: Condomino Buraca 1 (Amadora)

## Para Acceder a la Aplicación

1. **Navega a**: http://localhost:5173/login
2. **Usa uno de los usuarios anteriores**
3. **Si no sabes la contraseña**, puedes resetearla ejecutando:

```bash
# En el directorio del proyecto
node reset-password.cjs admin@example.com nuevaPassword123
```

## Datos Disponibles por Usuario

### Si entras como admin@example.com:
- **Edificio**: Edificio Principal
- **Miembros**: 3 (João Silva, Maria Santos, Pedro Costa)
- **Convocatorias**: 0
- **Actas**: 0
- **Transacciones**: 1

### Si entras como admin@migestpro.com:
- **Edificio**: Condomino Buraca 1
- **Miembros**: 6
- **Convocatorias**: 3
- **Actas**: 3
- **Transacciones**: 3

## Solución de Problemas

### Error 401 - No Autenticado
- Asegúrate de estar en la página de login: http://localhost:5173/login
- Verifica que estés usando el email correcto
- La contraseña es sensible a mayúsculas/minúsculas

### No veo datos después de login
- Verifica que el usuario esté asociado al edificio correcto
- Los datos solo se muestran para el edificio del usuario
- Super admin puede ver todos los edificios

### Error "j?.find is not a function"
- Este error ocurre cuando no hay autenticación
- Asegúrate de estar logueado correctamente