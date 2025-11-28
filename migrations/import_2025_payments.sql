-- =====================================================
-- IMPORTAÇÃO DE PAGAMENTOS REAIS DE 2025 DO EXTRATO BPI
-- =====================================================

-- Desativar triggers temporariamente
ALTER TABLE transactions DISABLE TRIGGER trg_update_period_balance_on_payment_insert;
ALTER TABLE transactions DISABLE TRIGGER trg_update_period_balance_on_payment_update;

-- Buscar IDs necessários
DO $$
DECLARE
    v_building_id UUID := 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';
    v_period_2025_id UUID;
    v_vitor_id UUID;
    v_joao_id UUID;
    v_antonio_id UUID;
    v_cristina_id UUID;
    v_aldina_id UUID;
    v_jose_id UUID;
BEGIN
    -- Buscar IDs de períodos e membros
    SELECT id INTO v_period_2025_id FROM financial_periods WHERE year = 2025;
    SELECT id INTO v_vitor_id FROM members WHERE name LIKE 'Vítor%';
    SELECT id INTO v_joao_id FROM members WHERE name LIKE 'João%';
    SELECT id INTO v_antonio_id FROM members WHERE name LIKE 'António%';
    SELECT id INTO v_cristina_id FROM members WHERE name LIKE 'Cristina%';
    SELECT id INTO v_aldina_id FROM members WHERE name LIKE 'Maria Albina%';
    SELECT id INTO v_jose_id FROM members WHERE name LIKE 'José%';

    -- ===========================================
    -- PAGAMENTOS DE VÍTOR (€26.13 mensal - 11 pagamentos)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, member_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, reference_number, year)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-01-08', 'income', 'TRF CR INTRAB 492 - Quota Janeiro 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202501', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-01-31', 'income', 'TRF CR INTRAB 657 - Pagamento adicional', 156.78, true, 'Transferência Bancária', 'TRF-657-20250131', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-02-02', 'income', 'TRF CR INTRAB 492 - Quota Fevereiro 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202502', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-03-26', 'income', 'TRF CR INTRAB 492 - Quota Março 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202503', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-04-30', 'income', 'TRF CR INTRAB 492 - Quota Abril 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202504', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-05-08', 'income', 'TRF CR INTRAB 492 - Quota Maio 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202505', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-06-13', 'income', 'TRF CR INTRAB 492 - Quota Junho 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202506', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-07-14', 'income', 'TRF CR INTRAB 492 - Quota Julho 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202507', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-08-13', 'income', 'TRF CR INTRAB 492 - Quota Agosto 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202508', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-09-15', 'income', 'TRF CR INTRAB 492 - Quota Setembro 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202509', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-10-13', 'income', 'TRF CR INTRAB 492 - Quota Outubro 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202510', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-11-13', 'income', 'TRF CR INTRAB 492 - Quota Novembro 2025', 26.13, true, 'Transferência Bancária', 'TRF-492-202511', 2025);

    -- ===========================================
    -- PAGAMENTOS DE JOÃO (€43.54 mensal - 10 pagamentos)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, member_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, reference_number, year)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-04-01', 'income', 'TRF CR SEPA+ 0000022 - Pagamento acumulado (3 meses)', 130.62, true, 'SEPA+', 'SEPA-0000022', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-05-08', 'income', 'TRF CR SEPA+ 0000024 - Quota Maio 2025', 43.54, true, 'SEPA+', 'SEPA-0000024', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-04-14', 'income', 'TRF CR SEPA+ 0000023 - Quota Abril 2025', 43.54, true, 'SEPA+', 'SEPA-0000023', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-06-09', 'income', 'TRF CR SEPA+ 0000025 - Quota Junho 2025', 43.54, true, 'SEPA+', 'SEPA-0000025', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-07-08', 'income', 'TRF CR SEPA+ 0000026 - Quota Julho 2025', 43.54, true, 'SEPA+', 'SEPA-0000026', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-08-08', 'income', 'TRF CR SEPA+ 0000027 - Quota Agosto 2025', 43.54, true, 'SEPA+', 'SEPA-0000027', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-09-08', 'income', 'TRF CR SEPA+ 0000028 - Quota Setembro 2025', 43.54, true, 'SEPA+', 'SEPA-0000028', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-10-08', 'income', 'TRF CR SEPA+ 0000029 - Quota Outubro 2025', 43.54, true, 'SEPA+', 'SEPA-0000029', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-11-10', 'income', 'TRF CR SEPA+ 0000030 - Quota Novembro 2025', 43.54, true, 'SEPA+', 'SEPA-0000030', 2025);

    -- ===========================================
    -- PAGAMENTOS DE ANTÓNIO (3 pagamentos em 2025)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, member_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, reference_number, year)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_antonio_id, '2025-02-24', 'income', 'TRF CR SEPA+ 0000019 - Pagamento acumulado', 487.62, true, 'SEPA+', 'SEPA-0000019', 2025);

    -- ===========================================
    -- PAGAMENTOS DE CRISTINA (1 pagamento em 2025)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, member_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, reference_number, year)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cristina_id, '2025-02-13', 'income', 'TRF CR INTRAB 125 - Pagamento acumulado', 684.24, true, 'Transferência Bancária', 'TRF-125-20250213', 2025);

    -- ===========================================
    -- PAGAMENTOS DE ALDINA/MARIA ALBINA (3 pagamentos em 2025)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, member_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, reference_number, year)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_aldina_id, '2025-03-30', 'income', 'TRF 21 DE JOAO (por conta de Aldina)', 156.78, true, 'Transferência', 'TRF-21-20250330', 2025),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_aldina_id, '2025-08-29', 'income', 'DEPOSITO EM NUMERARIO', 156.78, true, 'Numerário', 'DEP-NUM-20250829', 2025);

    -- ===========================================
    -- PAGAMENTOS DE JOSÉ MANUEL (1 pagamento grande em 2025)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, member_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, reference_number, year)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_jose_id, '2025-02-26', 'income', 'TRF 20 - Pagamento acumulado anos anteriores', 1629.24, true, 'Transferência', 'TRF-20-20250226', 2025);

END $$;

-- Reativar triggers
ALTER TABLE transactions ENABLE TRIGGER trg_update_period_balance_on_payment_insert;
ALTER TABLE transactions ENABLE TRIGGER trg_update_period_balance_on_payment_update;

-- Recalcular todos os balances baseado nas transações reais
SELECT * FROM recalculate_all_period_balances();

-- Mostrar resumo
SELECT
    m.name AS membro,
    COUNT(t.id) AS num_pagamentos,
    SUM(t.amount) AS total_pago_2025
FROM members m
LEFT JOIN transactions t ON t.member_id = m.id AND t.year = 2025 AND t.is_fee_payment = true AND t.deleted_at IS NULL
GROUP BY m.id, m.name
ORDER BY m.name;
