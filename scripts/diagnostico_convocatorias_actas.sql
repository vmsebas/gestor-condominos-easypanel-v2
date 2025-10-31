-- ============================================
-- SCRIPT DE DIAGNÓSTICO: Convocatorias y Actas
-- Gestor Condominios - PostgreSQL
-- Creado: 25 Oct 2025
-- ============================================

-- 1. VISTA GENERAL: Estado de todas las convocatorias y actas
SELECT
  '=== RESUMEN GENERAL ===' as seccion;

SELECT
  c.assembly_number,
  c.date as fecha_reunion,
  c.status as conv_status,
  c.minutes_created as tiene_acta,
  m.minute_number as acta_num,
  m.status as acta_status,
  CASE
    WHEN c.date > CURRENT_DATE THEN '📅 Futura'
    WHEN c.date = CURRENT_DATE THEN '🔴 HOY'
    WHEN c.date < CURRENT_DATE AND m.id IS NULL THEN '⚠️ Pasada sin acta'
    WHEN c.date < CURRENT_DATE AND m.id IS NOT NULL THEN '✅ Celebrada'
  END as estado_reunion
FROM convocatorias c
LEFT JOIN minutes m ON m.convocatoria_id = c.id
ORDER BY c.date DESC;

-- 2. INCONSISTENCIAS: Detectar problemas de datos
SELECT
  '=== VERIFICAR INCONSISTENCIAS ===' as seccion;

SELECT
  c.assembly_number,
  'Flag minutes_created incorrecto' as problema,
  c.minutes_created as flag_actual,
  CASE WHEN m.id IS NOT NULL THEN 'true' ELSE 'false' END as deberia_ser
FROM convocatorias c
LEFT JOIN minutes m ON m.convocatoria_id = c.id
WHERE (c.minutes_created = true AND m.id IS NULL)
   OR (c.minutes_created = false AND m.id IS NOT NULL);

-- 3. REUNIONES PENDIENTES: Convocatorias sin acta que ya pasaron
SELECT
  '=== REUNIONES PENDIENTES DE ACTA ===' as seccion;

SELECT
  c.assembly_number,
  c.date as fecha_reunion,
  CURRENT_DATE - c.date as dias_desde_reunion,
  c.status as conv_status
FROM convocatorias c
LEFT JOIN minutes m ON m.convocatoria_id = c.id
WHERE c.date < CURRENT_DATE
  AND m.id IS NULL
  AND c.status = 'sent'
ORDER BY c.date DESC;

-- 4. PRÓXIMAS REUNIONES: Convocatorias futuras
SELECT
  '=== PRÓXIMAS REUNIONES ===' as seccion;

SELECT
  c.assembly_number,
  c.assembly_type,
  c.date as fecha_reunion,
  c.time as hora,
  c.date - CURRENT_DATE as dias_restantes,
  c.status
FROM convocatorias c
WHERE c.date >= CURRENT_DATE
ORDER BY c.date ASC;

-- 5. ESTADÍSTICAS GENERALES
SELECT
  '=== ESTADÍSTICAS ===' as seccion;

SELECT
  'Total Convocatorias' as metrica,
  COUNT(*) as valor
FROM convocatorias
UNION ALL
SELECT
  'Convocatorias Enviadas',
  COUNT(*)
FROM convocatorias WHERE status = 'sent'
UNION ALL
SELECT
  'Convocatorias Borrador',
  COUNT(*)
FROM convocatorias WHERE status = 'draft'
UNION ALL
SELECT
  'Total Actas',
  COUNT(*)
FROM minutes
UNION ALL
SELECT
  'Actas Firmadas',
  COUNT(*)
FROM minutes WHERE status = 'signed'
UNION ALL
SELECT
  'Actas Borrador',
  COUNT(*)
FROM minutes WHERE status = 'draft';

-- 6. RELACIÓN 1:1 Convocatoria-Acta
SELECT
  '=== VERIFICAR RELACIÓN 1:1 ===' as seccion;

SELECT
  convocatoria_id,
  COUNT(*) as num_actas,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ Correcto'
    WHEN COUNT(*) > 1 THEN '❌ DUPLICADO'
  END as validacion
FROM minutes
WHERE convocatoria_id IS NOT NULL
GROUP BY convocatoria_id
HAVING COUNT(*) > 1;

-- Si no hay resultados, mostrar mensaje OK
SELECT CASE
  WHEN (SELECT COUNT(*) FROM minutes WHERE convocatoria_id IS NOT NULL GROUP BY convocatoria_id HAVING COUNT(*) > 1) IS NULL
  THEN '✅ Todas las relaciones son 1:1 correctas'
  ELSE ''
END as resultado;

-- 7. ACTAS SIN CONVOCATORIA (huérfanas)
SELECT
  '=== ACTAS HUÉRFANAS ===' as seccion;

SELECT
  minute_number,
  meeting_date,
  status,
  'Sin convocatoria asociada' as problema
FROM minutes
WHERE convocatoria_id IS NULL;
