# Configuración del Sistema de Email

## Configuración de Gmail

Para usar Gmail como proveedor de email:

1. **Activar la verificación en 2 pasos** en tu cuenta Google
2. **Generar un App Password:**
   - Ve a Google Account Settings > Security
   - En "Signing in to Google", busca "App passwords"
   - Genera una password para "Mail"
   - Usa esta password de 16 caracteres en lugar de tu password normal

3. **Configurar en la aplicación:**
   - Proveedor: Gmail
   - Email: tu-email@gmail.com
   - Password: el App Password de 16 caracteres

## Configuración de Outlook

Para usar Outlook/Hotmail:

1. **Configurar en la aplicación:**
   - Proveedor: Outlook
   - Email: tu-email@outlook.com
   - Password: tu password normal (o App Password si tienes 2FA)

## Configuración Personalizada

Para otros proveedores de email:

1. **Contacta tu proveedor** para obtener:
   - Servidor SMTP
   - Puerto (usualmente 587 o 465)
   - Tipo de seguridad (TLS/SSL)

2. **Configurar en la aplicación:**
   - Proveedor: Personalizado
   - Servidor SMTP: smtp.tu-proveedor.com
   - Puerto: 587
   - Seguro: activado/desactivado según tu proveedor
   - Email: tu-email@tu-dominio.com
   - Password: tu password

## Pruebas

Después de configurar:

1. **Clic en "Configurar Email"** para guardar la configuración
2. **Clic en "Testar Conexão"** para verificar la conectividad
3. **Clic en "Enviar Email de Teste"** para enviar un email de prueba a ti mismo

## Envío de Convocatorias

Una vez configurado, el sistema:

1. Enviará emails reales a los condóminos
2. Generará logs de envío
3. Marcará el estado de cada envío (enviado/fallido)
4. Aplicará una pausa entre emails para evitar ser marcado como spam

## Solución de Problemas

- **Error de autenticación:** Verifica email y password
- **Error de conexión:** Verifica configuración SMTP
- **Gmail no funciona:** Asegúrate de usar App Password, no password normal
- **Outlook no funciona:** Puede necesitar App Password si tienes 2FA activado