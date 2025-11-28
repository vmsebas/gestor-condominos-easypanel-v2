#!/bin/bash
# ============================================
# Backup Script - Gestor Condominios
# Crea backups diarios de la base de datos PostgreSQL
# ============================================
# Uso: ./backup-db.sh
# Cron: 0 3 * * * /path/to/backup-db.sh
# ============================================

set -e

# Configuración
BACKUP_DIR="/Users/mini-server/docker-apps/backups/gestor-condominos"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gestor_condominos_$DATE.sql.gz"
CONTAINER_NAME="postgres-master"
DB_NAME="gestor_condominos"
DB_USER="postgres"
RETENTION_DAYS=7

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "🗄️  Backup Gestor Condominios"
echo "============================================"
echo "📅 Fecha: $(date)"
echo "📁 Destino: $BACKUP_FILE"
echo "============================================"

# Crear directorio de backup si no existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📂 Creando directorio de backups...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Verificar que el contenedor de PostgreSQL está corriendo
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Error: El contenedor ${CONTAINER_NAME} no está corriendo${NC}"
    echo "   Ejecuta: docker start ${CONTAINER_NAME}"
    exit 1
fi

# Realizar backup
echo -e "${YELLOW}⏳ Realizando backup...${NC}"
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo -e "${GREEN}✅ Backup completado exitosamente${NC}"
    echo "   📦 Tamaño: $BACKUP_SIZE"
else
    echo -e "${RED}❌ Error al crear el backup${NC}"
    exit 1
fi

# Limpiar backups antiguos
echo -e "${YELLOW}🧹 Limpiando backups antiguos (>${RETENTION_DAYS} días)...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "   🗑️  Eliminados: $DELETED_COUNT archivos"

# Mostrar backups actuales
echo "============================================"
echo "📋 Backups disponibles:"
ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -10 || echo "   No hay backups"

# Calcular espacio total usado
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "============================================"
echo "💾 Espacio total usado: $TOTAL_SIZE"
echo "============================================"
echo -e "${GREEN}✅ Backup completado: $BACKUP_FILE${NC}"
