# 📊 Guía de Importación de Extractos Bancarios

## 📋 Índice

1. [Preparación del CSV](#preparacion-del-csv)
2. [Ejecutar la Importación](#ejecutar-la-importacion)
3. [Verificación de Datos](#verificacion-de-datos)
4. [Configuración de Categorías](#configuracion-de-categorias)
5. [Visualización en la UI](#visualizacion-en-la-ui)

---

## 1. Preparación del CSV

### Formato Esperado

El CSV debe tener las siguientes columnas (con comillas):

```csv
"Cuentas","Transferencias","Descripción","Beneficiario","Categoría","Fecha","Hora","Memoria","Importe","Moneda","Número de cheque","Etiquetas"
```

### Ejemplo de Filas

```csv
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","13/11/2025","12:00","","26,13","EUR","",""
"BPI COND. BURACA","","DD SU ELETRICIDADE","SU Eletricidade","Despesas de condomínio > LUZ","27/10/2025","12:00","","-6,82","EUR","",""
```

### ⚠️ Notas Importantes

1. **Formato de Fecha**: `DD/MM/YYYY` (ej: `13/11/2025`)
2. **Formato de Importe**: Usar coma como decimal (ej: `26,13`)
3. **Importes negativos**: Representan gastos (ej: `-7,99`)
4. **Importes positivos**: Representan ingresos (ej: `26,13`)
5. **Encoding**: UTF-8 con BOM si contiene caracteres especiales

---

## 2. Ejecutar la Importación

### Paso 1: Colocar el archivo CSV

```bash
# Copiar el archivo CSV al directorio del proyecto
cp ~/Downloads/extracto-banco.csv /Users/mini-server/docker-apps/apps/gestor-condominos/data/
```

### Paso 2: Instalar dependencias (si no están instaladas)

```bash
cd /Users/mini-server/docker-apps/apps/gestor-condominos
npm install csv-parse pg
```

### Paso 3: Ejecutar el script de importación

```bash
# Desde el directorio del proyecto
node scripts/import-bank-csv.js data/extracto-banco.csv
```

### Salida Esperada

```
📁 Leyendo archivo CSV: data/extracto-banco.csv
✅ 150 transacciones encontradas
🏢 Edificio: Condominio Buraca 1 (UUID)
⏳ Procesadas 10 transacciones...
⏳ Procesadas 20 transacciones...
...
⏳ Procesadas 150 transacciones...

📊 Resumen de importación:
   ✅ Importadas: 145
   ⏭️  Omitidas: 3
   ❌ Errores: 2
   📝 Total procesadas: 150

✅ Importación completada
```

---

## 3. Verificación de Datos

### Verificar Transacciones Importadas

```sql
-- Ver total de transacciones por tipo
SELECT
  type,
  COUNT(*) as total,
  SUM(amount) as total_amount
FROM transactions
WHERE deleted_at IS NULL
GROUP BY type;

-- Ver últimas 10 transacciones
SELECT
  transaction_date,
  description,
  amount,
  type
FROM transactions
WHERE deleted_at IS NULL
ORDER BY transaction_date DESC
LIMIT 10;
```

### Verificar Categorías Creadas

```sql
-- Ver todas las categorías
SELECT
  name,
  type,
  transaction_type,
  COUNT(*) as num_transactions
FROM transaction_categories tc
LEFT JOIN transactions t ON t.category_id = tc.id
WHERE tc.deleted_at IS NULL
GROUP BY tc.id, tc.name, tc.type, tc.transaction_type
ORDER BY name;
```

### Verificar Pagos por Condómino

```sql
-- Ver pagos de cada condómino
SELECT
  m.name,
  m.fraction,
  COUNT(*) as num_pagos,
  SUM(t.amount) as total_pago,
  MIN(t.transaction_date) as primeiro_pago,
  MAX(t.transaction_date) as ultimo_pago
FROM members m
LEFT JOIN transactions t ON t.member_id = m.id AND t.is_fee_payment = true
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.name, m.fraction
ORDER BY m.name;
```

---

## 4. Configuración de Categorías

### Categorías de Ingresos Automáticas

El script crea automáticamente estas categorías para **ingresos**:

| Categoría | Descripción | Tipo |
|-----------|-------------|------|
| **Quota Condómino** | Pagos mensuales de quotas | income |
| **Prestamos de Sócios** | Préstamos de condóminos | income |
| **Reembolsos** | Devoluciones y anulaciones | income |
| **Reembolso Seguros** | Devoluciones de seguros | income |
| **Saldo Inicial** | Depósito inicial de la cuenta | income |

### Categorías de Gastos Automáticas

El script crea automáticamente estas categorías para **gastos**:

| Categoría | Descripción | Tipo | Padre |
|-----------|-------------|------|-------|
| **Eletricidade** | Luz (SU Eletricidade) | expense | Despesas Condomínio |
| **Despesas Bancárias** | Manutenção + Imposto Selo | expense | Despesas Condomínio |
| **Seguros** | Fidelidade / Allianz | expense | Despesas Condomínio |
| **Limpeza** | Servicio de limpieza | expense | Despesas Condomínio |
| **Administração** | Gastos administrativos | expense | Despesas Condomínio |
| **Manutenção e Conservação** | Reparaciones y mantenimiento | expense | Despesas Condomínio |

### Crear Categorías Adicionales Manualmente

```sql
-- Crear categoría de gasto
INSERT INTO transaction_categories (
  id, building_id, name, type, transaction_type, is_active, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'UUID_DEL_EDIFICIO',
  'Água',
  'financial',
  'expense',
  true,
  NOW(),
  NOW()
);
```

---

## 5. Visualización en la UI

### En la Página de Miembros

Después de importar, cada condómino verá:

1. **Historial de Pagos**
   - Fecha de cada pago
   - Importe pagado
   - Método de pago
   - Estado (confirmado/pendiente)

2. **Resumen Financiero**
   - Total pagado en el año
   - Quota mensual esperada
   - Deuda pendiente
   - Estado de pago (al día / atrasado)

### En la Página de Finanzas

La página `Financas.tsx` mostrará:

1. **Dashboard Principal**
   - Balance actual
   - Ingresos vs Gastos (gráfico)
   - Quota vs Despesas (comparativa)

2. **Transacciones Recientes**
   - Últimas 50 transacciones
   - Filtros por fecha, tipo, categoría
   - Búsqueda por descripción

3. **Gráficos**
   - Gastos por categoría (pie chart)
   - Evolución mensual (line chart)
   - Balance acumulado (area chart)

4. **Categorías**
   - Presupuesto vs Real por categoría
   - Alertas si se excede el presupuesto
   - Porcentaje de uso del presupuesto

---

## 📌 Mapeo de Condóminos

El script reconoce automáticamente estos nombres:

| Nombre en CSV | Nombre en BD | Fração |
|---------------|--------------|--------|
| VITOR MANUEL SEBASTIAN RODRIGUES | Vítor Manuel Sebastian Rodrigues | A - RC/DTO |
| VITOR RODRIGUES | Vítor Manuel Sebastian Rodrigues | A - RC/DTO |
| JOAO MANUEL FERNANDES LONGO | João Manuel Fernandes Longo | E - 2º DTO |
| Joao Longo | João Manuel Fernandes Longo | E - 2º DTO |
| ANTONIO MANUEL CARACA BAIAO | António Manuel Caroça Beirão | C - 1º DTO |
| Antonio Beirao | António Manuel Caroça Beirão | C - 1º DTO |
| MARIA ALDINA SEQUEIRA | Maria Albina Correia Sequeira | B - RC/ESQ |
| Aldina Sequeira | Maria Albina Correia Sequeira | B - RC/ESQ |
| CRISTINA MARIA BERTOLO GOUVEIA | Cristina Maria Bertolo Gouveia | D - 1º ESQ |
| Cristina Gouveia | Cristina Maria Bertolo Gouveia | D - 1º ESQ |
| ALEXANDRE MARTINS DA SILVA | Cristina Maria Bertolo Gouveia | D - 1º ESQ |
| JOSE MANUEL COSTA RICARDO | José Manuel Costa Ricardo | F - 2º ESQ |
| Jose Ricardo | José Manuel Costa Ricardo | F - 2º ESQ |
| CARLOTA LOPES BERTOLO GOUVEIA | Cristina Maria Bertolo Gouveia | D - 1º ESQ |

---

## 🔧 Troubleshooting

### Error: "No se encontró ningún edificio"

```bash
# Verificar que existe al menos un edificio
docker exec postgres-master psql -U postgres -d gestor_condominos -c "SELECT id, name FROM buildings LIMIT 1;"
```

### Error: "Member not found"

```bash
# Verificar nombres de miembros en la BD
docker exec postgres-master psql -U postgres -d gestor_condominos -c "SELECT name, fraction FROM members;"
```

Si el nombre no coincide, actualizar el mapeo en `scripts/import-bank-csv.js` línea 21-38.

### Transacciones Duplicadas

```bash
# Ver transacciones duplicadas por fecha y descripción
docker exec postgres-master psql -U postgres -d gestor_condominos -c "
SELECT
  transaction_date,
  description,
  COUNT(*) as duplicates
FROM transactions
GROUP BY transaction_date, description
HAVING COUNT(*) > 1;
"
```

Para eliminar duplicados:

```sql
-- Eliminar todas menos la primera (soft delete)
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY transaction_date, description ORDER BY created_at) as rn
  FROM transactions
)
UPDATE transactions
SET deleted_at = NOW(), deleted_by = (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1)
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
```

---

## 📅 Mantenimiento

### Importación Mensual

1. Descargar extracto del mes desde el banco (formato CSV)
2. Ejecutar el script de importación
3. Verificar que no haya duplicados
4. Revisar categorías no reconocidas
5. Confirmar balance mensual

### Backup Antes de Importar

```bash
# Crear backup de la tabla transactions
docker exec postgres-master pg_dump -U postgres -d gestor_condominos -t transactions > backup_transactions_$(date +%Y%m%d).sql
```

---

**Última actualización**: 22 Noviembre 2025
**Versión**: 1.0
**Autor**: Claude Code
