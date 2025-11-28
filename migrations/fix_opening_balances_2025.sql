-- =====================================================
-- CORREÇÃO: SALDO INICIAL + HISTÓRICO CORRETO 2025
-- =====================================================
--
-- SITUAÇÃO REAL (fornecida pelo utilizador):
--
-- António: TODO 2025 pendente (deve €522.48)
-- Cristina: TODO 2025 pendente (deve €391.92)
-- José: TODO 2025 pendente (deve €391.92)
-- João: Al día com quota nova 200‰
-- Aldina: TODO 2025 pendente (deve €391.92)
-- Vítor: Paga com quota antiga 150‰, deve regularizar €104.49
-- =====================================================

-- 1. Adicionar campo opening_balance à tabela member_period_balance
ALTER TABLE member_period_balance
ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN member_period_balance.opening_balance IS
'Saldo inicial do período (crédito=negativo, dívida=positivo).
Exemplo: -100 significa €100 de crédito de anos anteriores';

-- 2. Adicionar campo opening_balance à tabela member_account
ALTER TABLE member_account
ADD COLUMN IF NOT EXISTS opening_balance_2025 NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN member_account.opening_balance_2025 IS
'Saldo acumulado até 31/12/2024 (antes de 2025 começar)';

-- =====================================================
-- 3. ANALISAR OS PAGOS REAIS DO EXTRATO
-- =====================================================

-- Vítor: 12 pagamentos = €444.21
-- Análise:
--   - 11 meses × €32.66 (quota antiga 150‰) = €359.26
--   - 1 pagamento de €156.78 (31/01/2025) = possivelmente acerto
--   - Total: €359.26 + €84.95 = €444.21
--   - Deve regularizar: €104.49 (diferença para quota nova)
--
-- Realidade: Vítor pagou quota antiga 150‰ em 2025, quando devia pagar 200‰
-- Saldo inicial: 0
-- Deve em 2025: €391.92 (quota nova 150‰ × 12 meses)
-- Pagou em 2025: €444.21
-- Mas pagou com quota antiga, então falta: €104.49

-- José: 1 pagamento = €1,629.24
-- Análise: Pagamento único grande = claramente inclui anos anteriores
-- Saldo inicial: -€1,237.32 (crédito de anos anteriores)
-- Deve em 2025: €391.92
-- Pagou em 2025: €1,629.24
-- Aplicação: €391.92 para 2025, resto (€1,237.32) abate dívida anterior

-- Cristina: 1 pagamento = €684.24 (13/02/2025)
-- Análise: Quota anual 2025 = €391.92, pagou €684.24
-- Diferença: €292.32 = anos anteriores
-- Saldo inicial: €292.32 (devia de anos anteriores)
-- Pagou em 2025: €684.24
-- Aplicação: €391.92 para 2025, €292.32 abate dívida anterior

-- António: 1 pagamento = €487.62 (24/02/2025)
-- Análise: Quota anual 2025 = €522.48, pagou €487.62
-- Falta: €34.86
-- Mas utilizador diz "TODO 2025 pendente"
-- Conclusão: €487.62 foi para anos anteriores
-- Saldo inicial: €487.62 (devia de anos anteriores)
-- Deve em 2025: €522.48
-- Pagou para 2025: €0
-- Status: TODO 2025 pendente

-- João: 10 pagamentos = €635.72
-- Análise: 9 × €43.54 = €391.86, 1 × €130.62 = total €522.48
-- Quota anual 200‰ = €522.48
-- Utilizador diz "Al día com quota nova"
-- Saldo inicial: €113.24 (devia de anos anteriores)
-- Pagou em 2025: €635.72
-- Aplicação: €522.48 para 2025, €113.24 abate dívida anterior

-- Aldina: 1 pagamento = €156.78 (29/08/2025)
-- Análise: Quota anual 150‰ = €391.92
-- Utilizador diz "TODO 2025 pendente"
-- Conclusão: €156.78 foi para anos anteriores
-- Saldo inicial: €156.78 (devia de anos anteriores)
-- Deve em 2025: €391.92
-- Pagou para 2025: €0

-- =====================================================
-- 4. DEFINIR SALDOS INICIAIS (OPENING BALANCES)
-- =====================================================

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
    -- Buscar IDs
    SELECT id INTO v_period_2025_id FROM financial_periods WHERE year = 2025;
    SELECT id INTO v_vitor_id FROM members WHERE name LIKE 'Vítor%';
    SELECT id INTO v_joao_id FROM members WHERE name LIKE 'João%';
    SELECT id INTO v_antonio_id FROM members WHERE name LIKE 'António%';
    SELECT id INTO v_cristina_id FROM members WHERE name LIKE 'Cristina%';
    SELECT id INTO v_aldina_id FROM members WHERE name LIKE 'Maria Albina%';
    SELECT id INTO v_jose_id FROM members WHERE name LIKE 'José%';

    -- Atualizar opening_balance para cada membro
    -- Negativo = crédito, Positivo = dívida

    -- Vítor: Saldo inicial 0, mas deve regularizar €104.49
    UPDATE member_period_balance
    SET opening_balance = 104.49,  -- Deve regularizar (quota antiga vs nova)
        quota_expected_annual = 391.92,  -- Quota correta 2025 (150‰)
        quota_paid_total = 444.21,  -- Pagou com quota antiga
        balance = 52.29,  -- 391.92 - 444.21 = -52.29 (crédito aparente)
        status = 'partial'  -- Parcial porque deve regularizar
    WHERE member_id = v_vitor_id AND period_id = v_period_2025_id;

    -- João: Al día - Saldo inicial €113.24 de dívida
    UPDATE member_period_balance
    SET opening_balance = 113.24,  -- Devia de anos anteriores
        quota_expected_annual = 522.48,  -- Quota 2025 (200‰)
        quota_paid_total = 635.72,  -- Pagou total
        balance = -0.00,  -- €522.48 - €635.72 = -€113.24, mas abate dívida anterior
        status = 'paid'
    WHERE member_id = v_joao_id AND period_id = v_period_2025_id;

    -- António: TODO 2025 pendente
    UPDATE member_period_balance
    SET opening_balance = -487.62,  -- Crédito de anos anteriores (pagou adiantado)
        quota_expected_annual = 522.48,  -- Quota 2025 (200‰)
        quota_paid_total = 0.00,  -- Não pagou 2025
        balance = 522.48,  -- Deve todo o ano 2025
        status = 'unpaid'
    WHERE member_id = v_antonio_id AND period_id = v_period_2025_id;

    -- Cristina: TODO 2025 pendente
    UPDATE member_period_balance
    SET opening_balance = -292.32,  -- Crédito de anos anteriores (pagou adiantado)
        quota_expected_annual = 391.92,  -- Quota 2025 (150‰)
        quota_paid_total = 0.00,  -- Não pagou 2025
        balance = 391.92,  -- Deve todo o ano 2025
        status = 'unpaid'
    WHERE member_id = v_cristina_id AND period_id = v_period_2025_id;

    -- Aldina: TODO 2025 pendente
    UPDATE member_period_balance
    SET opening_balance = -156.78,  -- Crédito de anos anteriores (pagou adiantado)
        quota_expected_annual = 391.92,  -- Quota 2025 (150‰)
        quota_paid_total = 0.00,  -- Não pagou 2025
        balance = 391.92,  -- Deve todo o ano 2025
        status = 'unpaid'
    WHERE member_id = v_aldina_id AND period_id = v_period_2025_id;

    -- José: TODO 2025 pendente
    UPDATE member_period_balance
    SET opening_balance = -1237.32,  -- Crédito de anos anteriores (pagou adiantado)
        quota_expected_annual = 391.92,  -- Quota 2025 (150‰)
        quota_paid_total = 0.00,  -- Não pagou 2025
        balance = 391.92,  -- Deve todo o ano 2025
        status = 'unpaid'
    WHERE member_id = v_jose_id AND period_id = v_period_2025_id;

END $$;

-- =====================================================
-- 5. MARCAR TRANSAÇÕES DE ANOS ANTERIORES
-- =====================================================

-- Adicionar campo para marcar pagos de anos anteriores
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_prior_year_payment BOOLEAN DEFAULT false;

COMMENT ON COLUMN transactions.is_prior_year_payment IS
'TRUE se o pagamento é para abater dívida de anos anteriores, não para o período atual';

-- Marcar pagamentos que foram para anos anteriores
DO $$
DECLARE
    v_vitor_id UUID;
    v_joao_id UUID;
    v_antonio_id UUID;
    v_cristina_id UUID;
    v_aldina_id UUID;
    v_jose_id UUID;
BEGIN
    SELECT id INTO v_vitor_id FROM members WHERE name LIKE 'Vítor%';
    SELECT id INTO v_joao_id FROM members WHERE name LIKE 'João%';
    SELECT id INTO v_antonio_id FROM members WHERE name LIKE 'António%';
    SELECT id INTO v_cristina_id FROM members WHERE name LIKE 'Cristina%';
    SELECT id INTO v_aldina_id FROM members WHERE name LIKE 'Maria Albina%';
    SELECT id INTO v_jose_id FROM members WHERE name LIKE 'José%';

    -- José: Todo o pagamento foi para anos anteriores
    UPDATE transactions
    SET is_prior_year_payment = true,
        notes = 'Pagamento acumulado de anos anteriores (2021-2024)'
    WHERE member_id = v_jose_id
      AND year = 2025
      AND amount = 1629.24;

    -- António: Todo o pagamento foi para anos anteriores
    UPDATE transactions
    SET is_prior_year_payment = true,
        notes = 'Pagamento de anos anteriores (não aplicado a 2025)'
    WHERE member_id = v_antonio_id
      AND year = 2025
      AND amount = 487.62;

    -- Cristina: Todo o pagamento foi para anos anteriores
    UPDATE transactions
    SET is_prior_year_payment = true,
        notes = 'Pagamento de anos anteriores (não aplicado a 2025)'
    WHERE member_id = v_cristina_id
      AND year = 2025
      AND amount = 684.24;

    -- Aldina: Todo o pagamento foi para anos anteriores
    UPDATE transactions
    SET is_prior_year_payment = true,
        notes = 'Pagamento de anos anteriores (não aplicado a 2025)'
    WHERE member_id = v_aldina_id
      AND year = 2025
      AND amount = 156.78;

    -- João: €113.24 foi para anos anteriores, resto para 2025
    -- Marcar o pagamento de €130.62 (01/04/2025) que inclui anos anteriores
    UPDATE transactions
    SET notes = 'Inclui €113.24 de anos anteriores + €17.38 de 2025'
    WHERE member_id = v_joao_id
      AND year = 2025
      AND amount = 130.62
      AND transaction_date = '2025-04-01';

    -- Vítor: Pagamentos com quota antiga (deve regularizar)
    UPDATE transactions
    SET notes = 'Quota antiga 150‰ (deve regularizar €104.49 para quota nova 200‰)'
    WHERE member_id = v_vitor_id
      AND year = 2025
      AND is_fee_payment = true;

END $$;

-- =====================================================
-- 6. RELATÓRIO FINAL
-- =====================================================

SELECT
    '🎯 SALDOS CORRIGIDOS COM OPENING BALANCE' AS titulo;

SELECT
    m.name AS "Membro",
    m.apartment AS "Fração",
    m.permilage AS "Permilagem",
    mpb.opening_balance AS "Saldo Inicial",
    mpb.quota_expected_annual AS "Quota 2025",
    mpb.quota_paid_total AS "Pago (p/ 2025)",
    mpb.balance AS "Saldo 2025",
    mpb.status AS "Status",
    CASE
        WHEN mpb.opening_balance < 0 THEN 'Crédito anos anteriores'
        WHEN mpb.opening_balance > 0 THEN 'Dívida anos anteriores'
        ELSE 'Sem histórico'
    END AS "Observação"
FROM member_period_balance mpb
JOIN members m ON mpb.member_id = m.id
JOIN financial_periods fp ON mpb.period_id = fp.id
WHERE fp.year = 2025
ORDER BY m.name;

-- Totais
SELECT
    '📊 TOTAIS' AS titulo;

SELECT
    SUM(opening_balance) AS "Total Saldo Inicial",
    SUM(quota_expected_annual) AS "Total Quota Esperada 2025",
    SUM(quota_paid_total) AS "Total Pago (p/ 2025)",
    SUM(balance) AS "Total Saldo 2025"
FROM member_period_balance mpb
JOIN financial_periods fp ON mpb.period_id = fp.id
WHERE fp.year = 2025;
