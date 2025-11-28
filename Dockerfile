# ============================================
# Dockerfile Multi-Stage - Gestor Condominios
# Optimizado para imágenes pequeñas y builds rápidos
# ============================================

# ============================================
# STAGE 1: Dependencies
# Instala todas las dependencias (dev + prod)
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copiar solo archivos de dependencias (mejor cache)
COPY package*.json ./

# Instalar todas las dependencias para el build
RUN npm ci

# Copiar node_modules de producción por separado
RUN cp -R node_modules prod_modules && \
    npm prune --production && \
    mv node_modules prod_node_modules && \
    mv prod_modules node_modules

# ============================================
# STAGE 2: Builder
# Compila el frontend con Vite
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copiar código fuente
COPY . .

# Variables de entorno para el build
ENV NODE_ENV=production

# Build del frontend (Vite)
RUN npm run build

# ============================================
# STAGE 3: Backend Runtime
# Imagen ligera solo para el servidor Express
# ============================================
FROM node:18-alpine AS backend

WORKDIR /app

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar solo dependencias de producción
COPY --from=deps /app/prod_node_modules ./node_modules

# Copiar servidor backend y archivos de configuración necesarios
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./
COPY --from=builder /app/knexfile.cjs ./

# Crear directorios necesarios
RUN mkdir -p /app/uploads /app/logs && \
    chown -R node:node /app

# Usuario no-root por seguridad
USER node

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3002

# Puerto del backend
EXPOSE 3002

# Healthcheck del backend
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Comando de inicio
CMD ["node", "server/app.cjs"]

# ============================================
# STAGE 4: Frontend (Nginx)
# Sirve el frontend estático compilado
# ============================================
FROM nginx:alpine AS frontend

# Copiar archivos compilados del frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Puerto del frontend
EXPOSE 80

# Healthcheck del frontend
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/nginx-health || exit 1

# Nginx ya tiene su CMD por defecto
