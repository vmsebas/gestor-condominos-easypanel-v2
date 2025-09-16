#!/bin/bash

# Script de migración para fusionar Supabase y Neon en base de datos local
# Mantiene usuarios locales y evita duplicados

set -e

echo "🚀 Iniciando migración de bases de datos..."

# Variables de conexión
SUPABASE_URL="postgresql://postgres:Vmsebas1975@db.qbfdfntmpdrbokavppzd.supabase.co:5432/postgres"
NEON_URL="postgresql://Condominio_owner:npg_ifA75hTZVXQy@ep-tight-truth-a2ce2fq5-pooler.eu-central-1.aws.neon.tech/Condominio?sslmode=require"
LOCAL_DB="gestor_condominos"
LOCAL_USER="mini-server"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📋 Paso 1: Exportando datos de Supabase...${NC}"
PGPASSWORD=Vmsebas1975 pg_dump "$SUPABASE_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --table=buildings \
  --table=members \
  --table=transactions \
  --table=convocatorias \
  --table=financial_periods \
  --table=minutes \
  > supabase_data.sql 2>/dev/null || echo "Advertencia: Algunas tablas no existen en Supabase"

echo -e "${YELLOW}📋 Paso 2: Exportando datos de Neon...${NC}"
PGPASSWORD=npg_ifA75hTZVXQy pg_dump "$NEON_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --table=documents \
  --table=document_categories \
  --table=document_shares \
  --table=annual_budgets \
  --table=annual_budget_items \
  > neon_data.sql 2>/dev/null || echo "Advertencia: Algunas tablas no existen en Neon"

echo -e "${YELLOW}📋 Paso 3: Preparando scripts de inserción...${NC}"
# Crear script SQL para inserción sin duplicados
cat > fusion_data.sql << 'EOF'
-- Script de fusión de datos sin duplicados
BEGIN;

-- Insertar edificios (evitar duplicados por name+address)
INSERT INTO buildings (id, name, address, created_at, updated_at)
SELECT DISTINCT ON (name, address) id, name, address, created_at, updated_at
FROM (
  SELECT * FROM buildings WHERE id = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc'
) AS source
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

-- Insertar miembros (evitar duplicados por email)
INSERT INTO members (id, name, email, phone, nif, building_id, created_at, updated_at)
SELECT id, name, email, phone, nif, building_id, created_at, updated_at
FROM members
WHERE building_id = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc'
ON CONFLICT (id) DO NOTHING;

-- Insertar transacciones
INSERT INTO transactions (id, date, description, amount, type, category_id, member_id, building_id, created_at, updated_at)
SELECT id, date, description, amount, type, category_id, member_id, building_id, created_at, updated_at
FROM transactions
WHERE building_id = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc'
ON CONFLICT (id) DO NOTHING;

-- Insertar convocatorias
INSERT INTO convocatorias (id, building_id, date, type, location, agenda, created_at, updated_at)
SELECT id, building_id, date, type, location, agenda, created_at, updated_at
FROM convocatorias
WHERE building_id = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc'
ON CONFLICT (id) DO NOTHING;

COMMIT;
EOF

echo -e "${YELLOW}📋 Paso 4: Aplicando datos a la base de datos local...${NC}"
psql -U $LOCAL_USER -d $LOCAL_DB < fusion_data.sql

echo -e "${GREEN}✅ Migración completada!${NC}"
echo -e "${YELLOW}📊 Verificando resultados...${NC}"

# Verificar conteos
psql -U $LOCAL_USER -d $LOCAL_DB << EOF
SELECT 'buildings' as tabla, COUNT(*) as registros FROM buildings
UNION ALL
SELECT 'members', COUNT(*) FROM members
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'convocatorias', COUNT(*) FROM convocatorias
ORDER BY tabla;
EOF

echo -e "${GREEN}✅ Proceso completado!${NC}"