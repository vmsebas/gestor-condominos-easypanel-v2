-- =====================================================
-- MIGRATION: Sistema Financiero Híbrido
-- Fecha: 22 Noviembre 2025
-- Objetivo: Añadir tablas para gestión completa sin romper nada existente
-- =====================================================

-- =====================================================
-- PASO 1: Completar períodos históricos (2021-2023)
-- =====================================================

-- Obtener building_id del primer edificio
DO $$
DECLARE
  v_building_id UUID;
BEGIN
  SELECT id INTO v_building_id FROM buildings WHERE deleted_at IS NULL LIMIT 1;

  -- Crear períodos 2021-2023 si no existen
  INSERT INTO financial_periods (
    id, building_id, year, start_date, end_date,
    is_closed, created_at, updated_at
  )
  SELECT
    uuid_generate_v4(),
    v_building_id,
    y,
    make_date(y, 1, 1),
    make_date(y, 12, 31),
    true, -- Años pasados están cerrados
    NOW(),
    NOW()
  FROM generate_series(2021, 2023) AS y
  WHERE NOT EXISTS (
    SELECT 1 FROM financial_periods
    WHERE building_id = v_building_id AND year = y
  );

END $$;

-- =====================================================
-- PASO 2: Añadir columnas de quotas a financial_periods
-- =====================================================

ALTER TABLE financial_periods
ADD COLUMN IF NOT EXISTS monthly_quota_150 NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS monthly_quota_200 NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS annual_budget_expected NUMERIC(10,2);

-- Actualizar quotas históricas
UPDATE financial_periods
SET
  monthly_quota_150 = 26.13,
  monthly_quota_200 = 34.84,
  annual_budget_expected = 2375.00
WHERE year BETWEEN 2021 AND 2024;

UPDATE financial_periods
SET
  monthly_quota_150 = 32.66,
  monthly_quota_200 = 43.54,
  annual_budget_expected = 2612.50
WHERE year = 2025;

-- =====================================================
-- PASO 3: Crear tabla member_period_balance
-- =====================================================

CREATE TABLE IF NOT EXISTS member_period_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES financial_periods(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  -- Quotas esperadas (según permilagem)
  quota_expected_monthly NUMERIC(10,2) NOT NULL,
  quota_expected_annual NUMERIC(10,2) NOT NULL,

  -- Pagos realizados
  quota_paid_total NUMERIC(10,2) DEFAULT 0,
  num_payments INTEGER DEFAULT 0,

  -- Balance (deuda o adelanto)
  balance NUMERIC(10,2) DEFAULT 0, -- Negativo = deuda, Positivo = adelanto

  -- Tracking de pagos
  first_payment_date DATE,
  last_payment_date DATE,

  -- Estado
  status VARCHAR(20) DEFAULT 'unpaid', -- 'paid', 'partial', 'unpaid', 'overdue'
  overdue_months INTEGER DEFAULT 0,

  -- Notas
  notes TEXT,
  admin_notes TEXT,

  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: un balance por miembro por período
  UNIQUE(member_id, period_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_member_period_balance_member ON member_period_balance(member_id);
CREATE INDEX IF NOT EXISTS idx_member_period_balance_period ON member_period_balance(period_id);
CREATE INDEX IF NOT EXISTS idx_member_period_balance_building ON member_period_balance(building_id);
CREATE INDEX IF NOT EXISTS idx_member_period_balance_status ON member_period_balance(status);

-- =====================================================
-- PASO 4: Crear tabla member_monthly_tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS member_monthly_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES financial_periods(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  -- Mes específico
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Quota del mes
  quota_expected NUMERIC(10,2) NOT NULL,
  quota_paid NUMERIC(10,2) DEFAULT 0,
  balance NUMERIC(10,2) DEFAULT 0,

  -- Tracking
  is_paid BOOLEAN DEFAULT false,
  payment_date DATE,
  payment_transaction_id UUID REFERENCES transactions(id),

  -- Método de pago si es conocido
  payment_method VARCHAR(50),

  -- Notas
  notes TEXT,

  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: un tracking por miembro por mes
  UNIQUE(member_id, period_id, year, month)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_member_monthly_tracking_member ON member_monthly_tracking(member_id);
CREATE INDEX IF NOT EXISTS idx_member_monthly_tracking_period ON member_monthly_tracking(period_id);
CREATE INDEX IF NOT EXISTS idx_member_monthly_tracking_year_month ON member_monthly_tracking(year, month);
CREATE INDEX IF NOT EXISTS idx_member_monthly_tracking_is_paid ON member_monthly_tracking(is_paid);

-- =====================================================
-- PASO 5: Crear tabla member_account (cuenta corriente)
-- =====================================================

CREATE TABLE IF NOT EXISTS member_account (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relación
  member_id UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  -- Saldo actual (negativo = deuda, positivo = adelanto)
  current_balance NUMERIC(10,2) DEFAULT 0,

  -- Totales acumulados
  total_charged_all_time NUMERIC(10,2) DEFAULT 0,
  total_paid_all_time NUMERIC(10,2) DEFAULT 0,

  -- Estadísticas
  num_transactions INTEGER DEFAULT 0,
  first_transaction_date DATE,
  last_transaction_date DATE,

  -- Estado
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'blocked'
  has_overdue_debt BOOLEAN DEFAULT false,
  overdue_amount NUMERIC(10,2) DEFAULT 0,

  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_member_account_member ON member_account(member_id);
CREATE INDEX IF NOT EXISTS idx_member_account_building ON member_account(building_id);
CREATE INDEX IF NOT EXISTS idx_member_account_status ON member_account(status);

-- =====================================================
-- PASO 6: Crear tabla account_movements (movimientos)
-- =====================================================

CREATE TABLE IF NOT EXISTS account_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  period_id UUID REFERENCES financial_periods(id),

  -- Fecha del movimiento
  transaction_date DATE NOT NULL,

  -- Tipo de movimiento
  type VARCHAR(20) NOT NULL, -- 'charge' (cargo), 'payment' (pago), 'adjustment' (ajuste)

  -- Importes
  amount DECIMAL(10,2) NOT NULL, -- Positivo = entrada, Negativo = salida
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,

  -- Descripción
  description TEXT NOT NULL,
  category VARCHAR(50), -- 'quota', 'fine', 'extraordinary', etc

  -- Referencia a transacción real (si existe)
  reference_transaction_id UUID REFERENCES transactions(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Auditoría
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Índices
  CONSTRAINT account_movements_type_check CHECK (type IN ('charge', 'payment', 'adjustment'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_account_movements_member ON account_movements(member_id);
CREATE INDEX IF NOT EXISTS idx_account_movements_period ON account_movements(period_id);
CREATE INDEX IF NOT EXISTS idx_account_movements_date ON account_movements(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_account_movements_type ON account_movements(type);

-- =====================================================
-- PASO 7: Triggers para actualización automática
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers en las nuevas tablas
CREATE TRIGGER update_member_period_balance_updated_at
  BEFORE UPDATE ON member_period_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_monthly_tracking_updated_at
  BEFORE UPDATE ON member_monthly_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_account_updated_at
  BEFORE UPDATE ON member_account
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASO 8: Vistas útiles
-- =====================================================

-- Vista: Resumen financiero por miembro (todas las épocas)
CREATE OR REPLACE VIEW v_member_financial_summary AS
SELECT
  m.id as member_id,
  m.name as member_name,
  m.fraction,
  m.permilage,
  b.id as building_id,
  b.name as building_name,

  -- Saldo actual
  COALESCE(ma.current_balance, 0) as current_balance,

  -- Totales históricos
  COALESCE(ma.total_charged_all_time, 0) as total_charged,
  COALESCE(ma.total_paid_all_time, 0) as total_paid,

  -- Estado
  CASE
    WHEN COALESCE(ma.current_balance, 0) < 0 THEN 'debtor'
    WHEN COALESCE(ma.current_balance, 0) > 0 THEN 'advance'
    ELSE 'settled'
  END as financial_status,

  -- Última transacción
  ma.last_transaction_date

FROM members m
INNER JOIN buildings b ON m.building_id = b.id
LEFT JOIN member_account ma ON ma.member_id = m.id
WHERE m.deleted_at IS NULL;

-- Vista: Deuda por período
CREATE OR REPLACE VIEW v_member_period_debt AS
SELECT
  mpb.member_id,
  m.name as member_name,
  fp.year,
  fp.id as period_id,
  mpb.quota_expected_annual,
  mpb.quota_paid_total,
  mpb.balance,
  mpb.status,
  mpb.last_payment_date
FROM member_period_balance mpb
INNER JOIN members m ON mpb.member_id = m.id
INNER JOIN financial_periods fp ON mpb.period_id = fp.id
WHERE m.deleted_at IS NULL
ORDER BY fp.year DESC, m.name;

-- =====================================================
-- PASO 9: Comentarios para documentación
-- =====================================================

COMMENT ON TABLE member_period_balance IS 'Balance financiero de cada miembro por período anual';
COMMENT ON TABLE member_monthly_tracking IS 'Tracking mensual detallado de pagos de cada miembro';
COMMENT ON TABLE member_account IS 'Cuenta corriente de cada miembro con saldo acumulado';
COMMENT ON TABLE account_movements IS 'Movimientos de cuenta corriente (estilo extracto bancario)';

COMMENT ON COLUMN member_period_balance.balance IS 'Negativo = deuda, Positivo = adelanto';
COMMENT ON COLUMN member_account.current_balance IS 'Saldo actual: negativo = debe, positivo = tiene a favor';
COMMENT ON COLUMN account_movements.amount IS 'Positivo = ingreso/pago, Negativo = cargo/gasto';

-- =====================================================
-- PASO 10: Datos de ejemplo para testing (OPCIONAL)
-- =====================================================

-- Crear cuentas para todos los miembros existentes
INSERT INTO member_account (member_id, building_id)
SELECT m.id, m.building_id
FROM members m
WHERE m.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM member_account ma WHERE ma.member_id = m.id
  );

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

-- Verificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  - member_period_balance';
  RAISE NOTICE '  - member_monthly_tracking';
  RAISE NOTICE '  - member_account';
  RAISE NOTICE '  - account_movements';
  RAISE NOTICE 'Vistas creadas:';
  RAISE NOTICE '  - v_member_financial_summary';
  RAISE NOTICE '  - v_member_period_debt';
  RAISE NOTICE 'Períodos históricos: 2021-2025';
END $$;
