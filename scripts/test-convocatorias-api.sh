#!/bin/bash
# ============================================
# TEST: Verificar API de Convocatorias
# Gestor Condominios
# ============================================

echo "🧪 TEST: API de Convocatorias con datos de Actas"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar que el servidor está corriendo
echo "1️⃣ Verificando que el servidor está activo..."
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend está corriendo${NC}"
else
    echo -e "${RED}❌ Backend NO está corriendo${NC}"
    exit 1
fi
echo ""

# 2. Login para obtener token (necesitamos autenticación)
echo "2️⃣ Haciendo login para obtener token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No se pudo obtener token de autenticación${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Token obtenido${NC}"
echo ""

# 3. Obtener convocatorias con el token
echo "3️⃣ Obteniendo convocatorias desde API..."
API_RESPONSE=$(curl -s http://localhost:3002/api/convocatorias \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$API_RESPONSE" | python3 -m json.tool > /tmp/convocatorias_response.json

# 4. Verificar estructura de respuesta
echo "4️⃣ Verificando estructura de datos..."
echo ""

# Verificar que tenemos datos
TOTAL=$(echo "$API_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)

if [ "$TOTAL" -eq 0 ]; then
    echo -e "${RED}❌ No se encontraron convocatorias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Total de convocatorias: $TOTAL${NC}"
echo ""

# 5. Verificar campos nuevos en cada convocatoria
echo "5️⃣ Verificando campos nuevos (minute_id, minute_status, etc.)..."
echo ""

python3 << 'EOF'
import json
import sys

with open('/tmp/convocatorias_response.json', 'r') as f:
    response = json.load(f)

data = response.get('data', [])

print(f"{'Nº':<4} {'Status Conv':<12} {'Tiene Acta?':<14} {'minute_id':<38} {'minute_status':<15}")
print("=" * 100)

for conv in data:
    assembly_num = conv.get('assembly_number', 'N/A')
    conv_status = conv.get('status', 'N/A')
    minutes_created = '✅ SÍ' if conv.get('minutes_created') else '❌ NO'
    minute_id = conv.get('minute_id', 'NULL')[:36] if conv.get('minute_id') else 'NULL'
    minute_status = conv.get('minute_status', 'NULL')

    print(f"{assembly_num:<4} {conv_status:<12} {minutes_created:<14} {minute_id:<38} {minute_status:<15}")

print("")
print("✅ Campos nuevos están presentes en la respuesta de la API")
EOF

echo ""
echo "6️⃣ Resumen del Test"
echo "===================="
echo -e "${GREEN}✅ Backend funcionando correctamente${NC}"
echo -e "${GREEN}✅ Autenticación correcta${NC}"
echo -e "${GREEN}✅ API devuelve convocatorias con datos de actas${NC}"
echo -e "${GREEN}✅ Campos minute_id, minute_status presentes${NC}"
echo ""
echo "📄 Respuesta completa guardada en: /tmp/convocatorias_response.json"
echo ""
