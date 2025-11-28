# 📊 Propuesta Sistema Financiero Completo

## 🎯 Objetivo

Gestionar completamente las finanzas del condominio a partir de extractos bancarios CSV, mostrando:
- **En Miembros**: Historial de pagos de cada condómino
- **En Finanzas**: Gastos categorizados y balance general

---

## ✅ Lo Que Ya Existe

### Base de Datos ✅
- ✅ Tabla `transactions` (33 columnas completas)
- ✅ Tabla `transaction_categories` (categorías jerárquicas)
- ✅ Tabla `members` (con quotas configuradas)
- ✅ Relaciones FK: building_id, member_id, category_id

### Frontend ✅
- ✅ Página `Financas.tsx` implementada
- ✅ Componente `FinancialDashboard` funcional
- ✅ Componente `TransactionManagementDialog`
- ✅ Hooks `useFinancialSummary`, `useTransactions`

---

## 🆕 Lo Que Se Ha Creado

### 1. Script de Importación CSV ✅

**Archivo**: `scripts/import-bank-csv.js`

**Funcionalidades**:
- ✅ Lee CSV bancario con formato BPI
- ✅ Identifica automáticamente condóminos por nombre
- ✅ Mapea categorías del banco a nuestras categorías
- ✅ Crea categorías automáticamente si no existen
- ✅ Inserta transacciones vinculadas a miembros
- ✅ Marca pagos de quotas con `is_fee_payment=true`
- ✅ Manejo de errores y resumen estadístico

**Uso**:
```bash
node scripts/import-bank-csv.js data/extracto-banco.csv
```

### 2. Guía Completa ✅

**Archivo**: `FINANCIAL-IMPORT-GUIDE.md`

**Contenido**:
- ✅ Formato esperado del CSV
- ✅ Instrucciones paso a paso
- ✅ Verificación de datos importados
- ✅ Mapeo de condóminos y categorías
- ✅ Troubleshooting común
- ✅ Mantenimiento mensual

---

## 🔄 Flujo Completo de Uso

### 1️⃣ Preparación (Una vez)

```bash
# 1. Instalar dependencias
npm install csv-parse pg

# 2. Crear directorio para CSVs
mkdir -p data
```

### 2️⃣ Importación Mensual

```bash
# 1. Descargar extracto bancario del mes
#    Formato: CSV con columnas del BPI

# 2. Copiar al directorio del proyecto
cp ~/Downloads/extracto-nov-2025.csv data/

# 3. Ejecutar importación
node scripts/import-bank-csv.js data/extracto-nov-2025.csv

# Salida esperada:
# ✅ 145 transacciones importadas
# ⏭️  3 omitidas (importe 0)
# ❌ 2 errores (revisar manualmente)
```

### 3️⃣ Verificación en Base de Datos

```sql
-- Ver resumen de transacciones
SELECT
  type,
  COUNT(*) as total,
  SUM(amount) as total_amount
FROM transactions
GROUP BY type;

-- Resultado esperado:
-- income  | 145 | 3,487.50€
-- expense | 50  | 1,234.89€
```

### 4️⃣ Visualización en UI

**En Miembros** (src/pages/Miembros.tsx):
- Click en un condómino
- Tab "Pagamentos"
- Ver historial completo de pagos

**En Finanzas** (src/pages/Financas.tsx):
- Dashboard con balance
- Gráficos de ingresos/gastos
- Transacciones recientes
- Filtros por categoría y fecha

---

## 📊 Datos del Extracto Bancario Analizado

### Ingresos Identificados

| Condómino | Fração | Quota Mensual | Último Pago | Total Pagado (2025) |
|-----------|---------|---------------|-------------|---------------------|
| **Vítor** | A - RC/DTO | 26.13€ | 13/11/2025 | 287.43€ (11 meses) |
| **João** | E - 2º DTO | 43.54€ | 10/11/2025 | 478.94€ (11 meses) |
| **António** | C - 1º DTO | varies | - | 1,629.24€ (acumulado) |
| **Aldina** | B - RC/ESQ | irregular | - | 156.78€ |
| **Cristina** | D - 1º ESQ | annual | - | 684.24€ |
| **José** | F - 2º ESQ | irregular | 26/02/2025 | 1,629.24€ |

### Gastos Mensuales Recurrentes

| Categoría | Proveedor | Frecuencia | Importe Medio |
|-----------|-----------|------------|---------------|
| **Luz** | SU Eletricidade | Mensual | 6.50€ - 16.42€ |
| **Banco** | BPI | Mensual | 7.99€ (manutenção) + 0.32€ (selo) |
| **Seguros** | Fidelidade/Allianz | Anual | 807.15€ (2025) |
| **Limpeza** | Vicencia | Anual | 650€ (efectivo) |

### Gastos Ocasionales

| Categoría | Descripción | Última Vez | Importe |
|-----------|-------------|------------|---------|
| **Administração** | Copimatica | 03/02/2025 | 12.13€ |
| **Manutenção** | Jose Rodrigues | 09/01/2024 | 100€ |
| **Cartão** | BPI Disponibilização | 08/09/2021 | 20€ |

---

## 🎨 Mejoras Propuestas para la UI

### 1. Página de Miembros - Nueva Tab "Pagamentos"

**Componente**: `src/components/members/MemberPaymentsTab.tsx` (a crear)

```typescript
interface MemberPaymentsTabProps {
  memberId: string;
  memberName: string;
}

// Features:
- 📅 Calendario de pagos (verde=pagado, rojo=pendiente)
- 📊 Gráfico de evolución de pagos
- 💰 Total pagado vs esperado
- 🔔 Estado de deuda (al día / atrasado X meses)
- 📄 Historial completo paginado
- 🖨️  Exportar a PDF (certificado de no deuda)
```

### 2. Página de Finanzas - Dashboard Mejorado

**Mejoras en**: `src/pages/Financas.tsx`

```typescript
// Nuevas secciones a añadir:

1. **KPIs Principales** (Cards en la parte superior)
   - Balance Actual
   - Ingresos del Mes
   - Gastos del Mes
   - Tasa de Cobro (% condóminos al día)

2. **Gráficos**
   - Pie Chart: Gastos por Categoría
   - Line Chart: Evolución Mensual
   - Bar Chart: Ingresos vs Gastos
   - Area Chart: Balance Acumulado

3. **Transacciones Recientes**
   - Tabla mejorada con filtros
   - Búsqueda por descripción
   - Exportar a Excel/CSV
   - Botón "Importar CSV" (llama al script)

4. **Alertas Inteligentes**
   - Condóminos con > 2 meses de atraso
   - Gastos que exceden presupuesto
   - Saldo bajo (< 500€)
```

### 3. Nueva Página: Categorías Financieras

**Archivo**: `src/pages/CategoriasFinanceiras.tsx` (a crear)

```typescript
// Features:
- CRUD de categorías
- Asignación de presupuesto por categoría
- Gráfico: Presupuesto vs Real
- Alertas si se excede el presupuesto
- Categorías jerárquicas (padre/hijo)
```

---

## 🗂️ Estructura de Categorías Propuesta

### Categorías de Ingresos

```
📥 INGRESOS
├── 💰 Quotas
│   ├── Quota Mensual
│   ├── Quota Extraordinária
│   └── Multas por Atraso
├── 🔄 Reembolsos
│   ├── Reembolso Seguros
│   └── Reembolso Outros
└── 💵 Prestamos de Sócios
```

### Categorías de Gastos

```
📤 GASTOS
├── 🏠 Despesas Comuns
│   ├── 💡 Eletricidade
│   ├── 💧 Água (si aplica)
│   ├── 🗑️  Lixo (si aplica)
│   └── 🧹 Limpeza
├── 🏦 Despesas Bancárias
│   ├── Manutenção de Conta
│   ├── Imposto de Selo
│   └── Comissões
├── 🛡️  Seguros
│   ├── Seguro Multirriscos
│   └── Responsabilidad Civil
├── 🔧 Manutenção e Conservação
│   ├── Reparações
│   ├── Pintura
│   └── Outros
├── 📋 Administração
│   ├── Honorários Administrador
│   ├── Papelaria
│   └── Outros
└── 🚨 Despesas Extraordinárias
    ├── Obras
    └── Outros
```

---

## 📈 Reporting y Estadísticas

### Relatórios Automáticos Mensuales

**Componente**: `src/components/reports/MonthlyReport.tsx` (a crear)

```typescript
// Contenido del reporte:
1. Balance del mes (ingresos - gastos)
2. Comparativa vs mes anterior
3. Top 5 gastos del mes
4. Condóminos morosos
5. Proyección del balance anual
6. Gráfico de tendencia
```

**Generación Automática**:
- PDF descargable
- Email automático a todos los condóminos
- Archivo en carpeta `/reports/YYYY-MM.pdf`

### Relatório Anual de Contas

**Componente**: `src/components/reports/AnnualReport.tsx` (a crear)

```typescript
// Contenido del reporte:
1. Resumen ejecutivo
2. Balance anual completo
3. Gastos por categoría (12 meses)
4. Ingresos por condómino
5. Proyección para próximo año
6. Recomendaciones de ahorro
```

---

## 🔐 Permisos y Roles

### Roles Propuestos

| Rol | Ver Finanzas | Editar Transacciones | Importar CSV | Ver Datos Otros Condóminos |
|-----|--------------|----------------------|--------------|----------------------------|
| **Admin** | ✅ Todo | ✅ Todo | ✅ | ✅ |
| **Manager** | ✅ Todo | ✅ Todo | ✅ | ✅ |
| **Condómino** | ✅ Solo sus pagos | ❌ | ❌ | ❌ |

---

## 🚀 Plan de Implementación

### Fase 1: Importación Básica (HECHO ✅)
- ✅ Script de importación CSV
- ✅ Mapeo de condóminos
- ✅ Creación automática de categorías
- ✅ Guía de uso

### Fase 2: UI - Miembros (Próximo)
- ⏳ Tab "Pagamentos" en MemberFormDialog
- ⏳ Historial de pagos por condómino
- ⏳ Estado de deuda
- ⏳ Exportar certificado de no deuda

### Fase 3: UI - Finanzas (Próximo)
- ⏳ Mejorar dashboard con KPIs
- ⏳ Gráficos interactivos
- ⏳ Filtros avanzados en transacciones
- ⏳ Botón "Importar CSV" en UI

### Fase 4: Categorías (Próximo)
- ⏳ CRUD de categorías
- ⏳ Presupuesto por categoría
- ⏳ Alertas de exceso de presupuesto

### Fase 5: Reportes (Futuro)
- ⏳ Reporte mensual automático
- ⏳ Reporte anual de cuentas
- ⏳ Exportar a Excel/PDF

---

## 🧪 Testing del Script de Importación

### Test con Archivo de Ejemplo

```bash
# 1. Crear directorio de datos
mkdir -p /Users/mini-server/docker-apps/apps/gestor-condominos/data

# 2. Guardar el CSV del usuario en un archivo
# (El usuario debe proporcionar el archivo completo)

# 3. Ejecutar importación de prueba
cd /Users/mini-server/docker-apps/apps/gestor-condominos
node scripts/import-bank-csv.js /tmp/extracto-banco-sample.csv

# 4. Verificar en BD
docker exec postgres-master psql -U postgres -d gestor_condominos -c "
SELECT COUNT(*) as total FROM transactions;
SELECT COUNT(*) as total FROM transaction_categories;
"
```

---

## 📝 Próximos Pasos Recomendados

### Inmediato (Esta Sesión)
1. ✅ Crear script de importación
2. ✅ Crear guía de uso
3. ⏳ **Probar con CSV real del usuario**
4. ⏳ Verificar que los datos se importan correctamente

### Corto Plazo (Próxima Sesión)
1. Crear tab "Pagamentos" en Miembros
2. Mejorar dashboard de Finanzas
3. Añadir botón "Importar CSV" en UI
4. Crear endpoint API para importación

### Medio Plazo
1. Sistema de categorías con CRUD
2. Presupuestos por categoría
3. Alertas automáticas
4. Reportes mensuales

### Largo Plazo
1. Integración con banco (API bancaria)
2. Recordatorios automáticos de pago
3. Pasarela de pago online (MB Way, Multibanco)
4. App móvil para condóminos

---

## 💡 Beneficios del Sistema

### Para el Administrador
- ✅ Importación automática de extractos bancarios
- ✅ Categorización automática de gastos
- ✅ Detección automática de pagos de condóminos
- ✅ Reportes mensuales automáticos
- ✅ Visión completa del estado financiero

### Para los Condóminos
- ✅ Transparencia total de sus pagos
- ✅ Certificado de no deuda inmediato
- ✅ Histórico completo de pagos
- ✅ Notificaciones de deuda pendiente

### Para la Comunidad
- ✅ Balance transparente
- ✅ Control de gastos por categoría
- ✅ Cumplimiento legal (obligación de presentar cuentas)
- ✅ Previsión de gastos futuros

---

**Creado**: 22 Noviembre 2025
**Versión**: 1.0
**Estado**: ✅ Script implementado, listo para testing
