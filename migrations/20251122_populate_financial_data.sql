-- =====================================================
-- POBLACIÓN DE DATOS FINANCIEROS HISTÓRICOS
-- Fecha: 22 Noviembre 2025
-- Basado en análisis detallado de extractos bancarios
-- =====================================================

DO $$
DECLARE
  v_building_id UUID;
  v_period_2021 UUID;
  v_period_2022 UUID;
  v_period_2023 UUID;
  v_period_2024 UUID;
  v_period_2025 UUID;
  v_vitor_id UUID;
  v_joao_id UUID;
  v_antonio_id UUID;
  v_aldina_id UUID;
  v_cristina_id UUID;
  v_jose_id UUID;
BEGIN
  RAISE NOTICE '🔧 Iniciando población de datos financieros históricos...';

  -- Obtener IDs
  SELECT id INTO v_building_id FROM buildings WHERE deleted_at IS NULL LIMIT 1;
  SELECT id INTO v_period_2021 FROM financial_periods WHERE year = 2021 LIMIT 1;
  SELECT id INTO v_period_2022 FROM financial_periods WHERE year = 2022 LIMIT 1;
  SELECT id INTO v_period_2023 FROM financial_periods WHERE year = 2023 LIMIT 1;
  SELECT id INTO v_period_2024 FROM financial_periods WHERE year = 2024 LIMIT 1;
  SELECT id INTO v_period_2025 FROM financial_periods WHERE year = 2025 LIMIT 1;

  SELECT id INTO v_vitor_id FROM members WHERE name LIKE '%V_tor%' LIMIT 1;
  SELECT id INTO v_joao_id FROM members WHERE name LIKE '%Jo_o%' LIMIT 1;
  SELECT id INTO v_antonio_id FROM members WHERE name LIKE '%Ant_nio%' LIMIT 1;
  SELECT id INTO v_aldina_id FROM members WHERE name LIKE '%Albina%' OR name LIKE '%Aldina%' LIMIT 1;
  SELECT id INTO v_cristina_id FROM members WHERE name LIKE '%Cristina%' LIMIT 1;
  SELECT id INTO v_jose_id FROM members WHERE name LIKE '%Jos_%Costa%' LIMIT 1;

  RAISE NOTICE '   ✅ IDs obtenidos';

  -- =====================================================
  -- VÍTOR (150‰) - Pagó 2021-2024, en 2025 paga con quota antigua
  -- =====================================================

  -- 2021-2024: TODO PAGADO
  INSERT INTO member_period_balance (id, member_id, period_id, building_id, quota_expected_monthly, quota_expected_annual, quota_paid_total, balance, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), v_vitor_id, v_period_2021, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_vitor_id, v_period_2022, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_vitor_id, v_period_2023, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_vitor_id, v_period_2024, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW())
  ON CONFLICT (member_id, period_id) DO UPDATE SET quota_paid_total = EXCLUDED.quota_paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;

  -- 2025: Pagó 11 meses con quota antigua (26.13€)
  INSERT INTO member_period_balance (id, member_id, period_id, building_id, quota_expected_monthly, quota_expected_annual, quota_paid_total, balance, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), v_vitor_id, v_period_2025, v_building_id, 32.66, 391.92, 287.43, -104.49, 'partial', 'Paga con quota antigua, debe regularizar 104.49€', NOW(), NOW())
  ON CONFLICT (member_id, period_id) DO UPDATE SET quota_paid_total = EXCLUDED.quota_paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;

  RAISE NOTICE '   ✅ Vítor: Balances creados';

  -- =====================================================
  -- JOÃO (200‰) - Pagó 2021-2024, en 2025 TODO PAGADO
  -- =====================================================

  INSERT INTO member_period_balance (id, member_id, period_id, building_id, quota_expected_monthly, quota_expected_annual, quota_paid_total, balance, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), v_joao_id, v_period_2021, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_joao_id, v_period_2022, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_joao_id, v_period_2023, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_joao_id, v_period_2024, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_joao_id, v_period_2025, v_building_id, 43.54, 522.48, 522.48, 0, 'paid', 'Al día con quota nueva', NOW(), NOW())
  ON CONFLICT (member_id, period_id) DO UPDATE SET quota_paid_total = EXCLUDED.quota_paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;

  RAISE NOTICE '   ✅ João: Balances creados';

  -- =====================================================
  -- ANTÓNIO (200‰) - Pagó 2021-2024, 2025 TODO PENDIENTE
  -- =====================================================

  INSERT INTO member_period_balance (id, member_id, period_id, building_id, quota_expected_monthly, quota_expected_annual, quota_paid_total, balance, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), v_antonio_id, v_period_2021, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_antonio_id, v_period_2022, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_antonio_id, v_period_2023, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_antonio_id, v_period_2024, v_building_id, 34.84, 418.08, 418.08, 0, 'paid', 'Año cerrado (pago feb 2025)', NOW(), NOW()),
    (uuid_generate_v4(), v_antonio_id, v_period_2025, v_building_id, 43.54, 522.48, 0, -522.48, 'unpaid', 'TODO 2025 pendiente', NOW(), NOW())
  ON CONFLICT (member_id, period_id) DO UPDATE SET quota_paid_total = EXCLUDED.quota_paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;

  RAISE NOTICE '   ✅ António: Balances creados';

  -- =====================================================
  -- ALDINA (150‰) - Pagó 2021-2024, 2025 TODO PENDIENTE
  -- =====================================================

  INSERT INTO member_period_balance (id, member_id, period_id, building_id, quota_expected_monthly, quota_expected_annual, quota_paid_total, balance, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), v_aldina_id, v_period_2021, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado (gran pago ago 2021)', NOW(), NOW()),
    (uuid_generate_v4(), v_aldina_id, v_period_2022, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_aldina_id, v_period_2023, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_aldina_id, v_period_2024, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado (pagos mar y ago 2025)', NOW(), NOW()),
    (uuid_generate_v4(), v_aldina_id, v_period_2025, v_building_id, 32.66, 391.92, 0, -391.92, 'unpaid', 'TODO 2025 pendiente', NOW(), NOW())
  ON CONFLICT (member_id, period_id) DO UPDATE SET quota_paid_total = EXCLUDED.quota_paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;

  RAISE NOTICE '   ✅ Aldina: Balances creados';

  -- =====================================================
  -- CRISTINA (150‰) - Pagó 2021-2024, 2025 TODO PENDIENTE
  -- =====================================================

  INSERT INTO member_period_balance (id, member_id, period_id, building_id, quota_expected_monthly, quota_expected_annual, quota_paid_total, balance, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), v_cristina_id, v_period_2021, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_cristina_id, v_period_2022, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_cristina_id, v_period_2023, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_cristina_id, v_period_2024, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado (pago feb 2025 cerró atrasos)', NOW(), NOW()),
    (uuid_generate_v4(), v_cristina_id, v_period_2025, v_building_id, 32.66, 391.92, 0, -391.92, 'unpaid', 'TODO 2025 pendiente', NOW(), NOW())
  ON CONFLICT (member_id, period_id) DO UPDATE SET quota_paid_total = EXCLUDED.quota_paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;

  RAISE NOTICE '   ✅ Cristina: Balances creados';

  -- =====================================================
  -- JOSÉ (150‰) - Pagó 2021-2024, 2025 TODO PENDIENTE
  -- =====================================================

  INSERT INTO member_period_balance (id, member_id, period_id, building_id, quota_expected_monthly, quota_expected_annual, quota_paid_total, balance, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), v_jose_id, v_period_2021, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_jose_id, v_period_2022, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_jose_id, v_period_2023, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado', NOW(), NOW()),
    (uuid_generate_v4(), v_jose_id, v_period_2024, v_building_id, 26.13, 313.56, 313.56, 0, 'paid', 'Año cerrado (pago feb 2025 cerró 4 años atraso)', NOW(), NOW()),
    (uuid_generate_v4(), v_jose_id, v_period_2025, v_building_id, 32.66, 391.92, 0, -391.92, 'unpaid', 'TODO 2025 pendiente', NOW(), NOW())
  ON CONFLICT (member_id, period_id) DO UPDATE SET quota_paid_total = EXCLUDED.quota_paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;

  RAISE NOTICE '   ✅ José: Balances creados';

  -- =====================================================
  -- ACTUALIZAR CUENTAS CORRIENTES
  -- =====================================================

  UPDATE member_account ma
  SET
    current_balance = (
      SELECT COALESCE(SUM(balance), 0)
      FROM member_period_balance mpb
      WHERE mpb.member_id = ma.member_id
    ),
    total_charged_all_time = (
      SELECT COALESCE(SUM(quota_expected_annual), 0)
      FROM member_period_balance mpb
      WHERE mpb.member_id = ma.member_id
    ),
    total_paid_all_time = (
      SELECT COALESCE(SUM(quota_paid_total), 0)
      FROM member_period_balance mpb
      WHERE mpb.member_id = ma.member_id
    ),
    has_overdue_debt = (
      SELECT COALESCE(SUM(balance), 0) < 0
      FROM member_period_balance mpb
      WHERE mpb.member_id = ma.member_id
    ),
    overdue_amount = (
      SELECT CASE
        WHEN COALESCE(SUM(balance), 0) < 0
        THEN ABS(COALESCE(SUM(balance), 0))
        ELSE 0
      END
      FROM member_period_balance mpb
      WHERE mpb.member_id = ma.member_id
    ),
    updated_at = NOW();

  RAISE NOTICE '   ✅ Cuentas corrientes actualizadas';

  -- =====================================================
  -- RESUMEN FINAL
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMEN FINANCIERO:';
  RAISE NOTICE '══════════════════════════════════════════════';

  RAISE NOTICE '';
  RAISE NOTICE '2025 - Deudas actuales:';
  RAISE NOTICE '   Vítor:    -104.49€ (paga con quota antigua)';
  RAISE NOTICE '   João:        0.00€ (al día)';
  RAISE NOTICE '   António: -522.48€ (todo 2025)';
  RAISE NOTICE '   Aldina:  -391.92€ (todo 2025)';
  RAISE NOTICE '   Cristina: -391.92€ (todo 2025)';
  RAISE NOTICE '   José:    -391.92€ (todo 2025)';
  RAISE NOTICE '';
  RAISE NOTICE '   DEUDA TOTAL 2025: -1,802.73€';
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE '✅ Población de datos históricos completada';

END $$;
