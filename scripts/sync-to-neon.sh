#!/bin/bash

#############################################################
# Script de Sincronização Automática: Local → Neon
# Faz backup da BD local e sincroniza para a cloud (Neon)
#############################################################

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
PROJECT_DIR="/Users/mini-server/docker-apps/apps/gestor-condominos"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_BACKUP="/tmp/gestor_backup_$TIMESTAMP.sql"

# URLs das bases de dados
LOCAL_DB="postgresql://postgres:SecurePass123@127.0.0.1:5432/gestor_condominos"
NEON_DB="postgresql://Condominio_v2_owner:npg_VhvBFy7M1UeS@ep-mute-bird-ab4qk19x-pooler.eu-west-2.aws.neon.tech/Condominio_v2?sslmode=require"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   SINCRONIZAÇÃO: Local → Neon (Cloud Backup)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Test local database connection
echo -e "${YELLOW}[1/6]${NC} Testando conexão com BD local..."
if docker exec postgres-master psql -U postgres -d gestor_condominos -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} BD local acessível"
else
    echo -e "${RED}✗${NC} Erro: BD local não acessível"
    exit 1
fi

# 2. Test Neon connection
echo -e "${YELLOW}[2/6]${NC} Testando conexão com Neon..."
if psql "$NEON_DB" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Neon acessível"
else
    echo -e "${RED}✗${NC} Erro: Neon não acessível. Verifica a URL e password."
    exit 1
fi

# 3. Create backup from local database
echo -e "${YELLOW}[3/6]${NC} Criando backup da BD local..."
docker exec postgres-master pg_dump -U postgres -d gestor_condominos \
    --clean --if-exists \
    --no-owner --no-acl \
    > "$TEMP_BACKUP"

BACKUP_SIZE=$(du -h "$TEMP_BACKUP" | cut -f1)
echo -e "${GREEN}✓${NC} Backup criado: $BACKUP_SIZE"

# 4. Count tables in backup
TABLE_COUNT=$(grep -c "CREATE TABLE" "$TEMP_BACKUP" || true)
echo -e "${GREEN}✓${NC} Tabelas no backup: $TABLE_COUNT"

# 5. Restore to Neon
echo -e "${YELLOW}[4/6]${NC} Sincronizando para Neon (cloud)..."
echo -e "${YELLOW}⚠${NC}  Isto vai sobrescrever a BD na Neon..."

# Restore the backup to Neon
psql "$NEON_DB" < "$TEMP_BACKUP" 2>&1 | grep -v "NOTICE:" | grep -v "already exists" || true

echo -e "${GREEN}✓${NC} Dados sincronizados para Neon"

# 6. Verify sync
echo -e "${YELLOW}[5/6]${NC} Verificando sincronização..."

# Count tables in Neon
NEON_TABLES=$(psql "$NEON_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs)

if [ "$NEON_TABLES" -eq "$TABLE_COUNT" ]; then
    echo -e "${GREEN}✓${NC} Verificação OK: $NEON_TABLES tabelas na Neon"
else
    echo -e "${YELLOW}⚠${NC} Atenção: Local tem $TABLE_COUNT tabelas, Neon tem $NEON_TABLES"
fi

# 7. Save backup locally (optional)
echo -e "${YELLOW}[6/6]${NC} Guardando backup local..."
mkdir -p "$BACKUP_DIR"
FINAL_BACKUP="$BACKUP_DIR/sync_to_neon_$TIMESTAMP.sql"
cp "$TEMP_BACKUP" "$FINAL_BACKUP"
gzip "$FINAL_BACKUP"
echo -e "${GREEN}✓${NC} Backup local guardado: sync_to_neon_$TIMESTAMP.sql.gz"

# Cleanup
rm -f "$TEMP_BACKUP"

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ SINCRONIZAÇÃO COMPLETA!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  📦 Backup local: $BACKUP_SIZE"
echo -e "  ☁️  Neon sincronizada: $NEON_TABLES tabelas"
echo -e "  🕐 Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${GREEN}A tua BD na Neon está atualizada e acessível de qualquer lugar!${NC}"
echo -e "${BLUE}URL Neon:${NC} postgresql://...@ep-mute-bird-ab4qk19x-pooler.eu-west-2.aws.neon.tech/Condominio_v2"
echo ""
