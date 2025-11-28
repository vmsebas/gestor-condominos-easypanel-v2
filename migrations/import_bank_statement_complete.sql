-- =====================================================
-- IMPORTAÇÃO COMPLETA DO EXTRATO BPI (2024-2025)
-- Total de transações: 63
-- Período: 2025-01-08 a 2025-11-13
-- =====================================================

-- Receitas: 26 transações
-- Despesas: 37 transações

-- Resumo de pagamentos por membro:
--   aldina: 1 pagamentos = €156.78
--   antonio: 1 pagamentos = €487.62
--   cristina: 1 pagamentos = €684.24
--   joao: 10 pagamentos = €635.72
--   jose: 1 pagamentos = €1629.24
--   vitor: 12 pagamentos = €444.21

DO $$
DECLARE
    v_building_id UUID := 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';
    v_period_2024_id UUID;
    v_period_2025_id UUID;
    v_aldina_id UUID;
    v_antonio_id UUID;
    v_cristina_id UUID;
    v_joao_id UUID;
    v_jose_id UUID;
    v_vitor_id UUID;
BEGIN

    -- Buscar IDs de períodos financeiros
    SELECT id INTO v_period_2024_id FROM financial_periods WHERE year = 2024;
    SELECT id INTO v_period_2025_id FROM financial_periods WHERE year = 2025;

    -- Buscar IDs de membros
    SELECT id INTO v_aldina_id FROM members WHERE name LIKE 'Maria Albina%';
    SELECT id INTO v_antonio_id FROM members WHERE name LIKE 'António%';
    SELECT id INTO v_cristina_id FROM members WHERE name LIKE 'Cristina%';
    SELECT id INTO v_joao_id FROM members WHERE name LIKE 'João%';
    SELECT id INTO v_jose_id FROM members WHERE name LIKE 'José%';
    SELECT id INTO v_vitor_id FROM members WHERE name LIKE 'Vítor%';

    -- =============================================
    -- ANO 2025 (63 transações)
    -- =============================================

    -- Receitas 2025
    INSERT INTO transactions (
        id, building_id, period_id, member_id,
        transaction_date, transaction_type, description, amount,
        is_fee_payment, payment_method, year
    ) VALUES
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-11-13', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-11-10', 'income', 'TRF CR SEPA+ 0000030 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-10-13', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-10-08', 'income', 'TRF CR SEPA+ 0000029 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-09-15', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-09-08', 'income', 'TRF CR SEPA+ 0000028 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_aldina_id, '2025-08-29', 'income', 'DEPOSITO EM NUMERARIO', 156.78, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-08-13', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-08-08', 'income', 'TRF CR SEPA+ 0000027 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-07-14', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-07-08', 'income', 'TRF CR SEPA+ 0000026 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-06-13', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-06-09', 'income', 'TRF CR SEPA+ 0000025 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-05-08', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-05-08', 'income', 'TRF CR SEPA+ 0000024 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-04-30', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-04-14', 'income', 'TRF CR SEPA+ 0000023 DE JOAO MANUEL FERNANDES LONGO', 43.54, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-04-01', 'income', 'TRF CR SEPA+ 0000022 DE JOAO MANUEL FERNANDES LONGO', 130.62, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_joao_id, '2025-03-30', 'income', 'TRF 21 DE JOAO MANUEL FERNANDES LONGO', 156.78, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-03-26', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_jose_id, '2025-02-26', 'income', 'TRF 20 DE JOSE MANUEL COSTA RICARDO', 1629.24, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_antonio_id, '2025-02-24', 'income', 'TRF CR SEPA+ 0000019 DE ANTONIO MANUEL CARACA BAIAO', 487.62, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cristina_id, '2025-02-13', 'income', 'TRF CR INTRAB 125 DE CRISTINA MARIA BERTOLO GOUVEIA', 684.24, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-02-02', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-01-31', 'income', 'TRF CR INTRAB 657 DE VITOR MANUEL SEBASTIAN RODRIGUES', 156.78, true, 'Transferência Bancária', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, v_vitor_id, '2025-01-08', 'income', 'TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES', 26.13, true, 'Transferência Bancária', 2025);

    -- Despesas 2025
    INSERT INTO transactions (
        id, building_id, period_id, category_id,
        transaction_date, transaction_type, description, amount,
        is_fee_payment, payment_method, year
    ) VALUES
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-11-07', 'expense', 'IMPOSTO DE SELO OUT 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-11-07', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS OUT 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-10-27', 'expense', 'DD SU ELETRICIDADE, S.A. 100000862991', 6.82, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-10-07', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS SET 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-10-07', 'expense', 'IMPOSTO DE SELO SET 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-09-26', 'expense', 'DD SU ELETRICIDADE, S.A. 100000862991', 6.59, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-09-05', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS AGO 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-09-05', 'expense', 'IMPOSTO DE SELO AGO 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-08-28', 'expense', 'DD SU ELETRICIDADE, S.A. 100000862991', 6.93, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-08-07', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS JUL 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-08-07', 'expense', 'IMPOSTO DE SELO JUL 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-07-28', 'expense', 'DD SU ELETRICIDADE, S.A. 100000862991', 6.65, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-07-08', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS JUN 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-07-08', 'expense', 'IMPOSTO DE SELO JUN 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-06-30', 'expense', 'DD SU ELETRICIDADE, S.A. 100000862991', 6.93, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-06-10', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS MAI 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-06-10', 'expense', 'IMPOSTO DE SELO MAI 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-05-29', 'expense', 'COBR SEPA SU ELETRICIDADE S.A.', 6.65, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-05-13', 'expense', 'IMPOSTO DE SELO ABR 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-05-09', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS ABR 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-04-08', 'expense', 'IMPOSTO DE SELO MAR 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-04-07', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS MAR 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-04-05', 'expense', 'COBR SEPA SU ELETRICIDADE S.A.', 6.93, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-03-13', 'expense', 'IMPOSTO DE SELO FEV 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-03-10', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS FEV 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-03-08', 'expense', 'COBR SEPA SU ELETRICIDADE S.A.', 6.47, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-02-11', 'expense', 'COBR SEPA SU ELETRICIDADE S.A.', 5.89, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e03', '2025-02-11', 'expense', 'LEVANTAMENTO EM ATM BPI', 50.00, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-02-10', 'expense', 'IMPOSTO DE SELO JAN 2025', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-02-07', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS JAN 2025', 7.99, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e06', '2025-02-07', 'expense', 'COBR SEPA FIDELIDADE COMPANHIA DE SEGUROS', 807.15, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e08', '2025-02-03', 'expense', 'COMPRA COPIMATICA LDA', 12.13, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e03', '2025-01-31', 'expense', 'TRF CRED SEPA+ TRANSFERENCIA ATM', 753.13, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-01-13', 'expense', 'PAGAMENTO DE SERVICOS 696752477', 1.04, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-01-13', 'expense', 'IMPOSTO DE SELO DEZ 2024', 0.32, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04', '2025-01-08', 'expense', 'PAGAMENTO DE SERVICOS 576954380', 9.26, false, 'Débito Direto', 2025),
        (uuid_generate_v4(), v_building_id, v_period_2025_id, 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', '2025-01-08', 'expense', 'MANUTENCAO DE CONTA VALOR NEGOCIOS DEZ 2024', 7.99, false, 'Débito Direto', 2025);

END $$;

-- Recalcular todos os saldos dos membros
SELECT * FROM recalculate_all_period_balances();

-- Verificar totais por ano
SELECT
    year,
    transaction_type,
    COUNT(*) AS num_transacoes,
    SUM(amount) AS total
FROM transactions
WHERE year IN (2024, 2025)
  AND deleted_at IS NULL
GROUP BY year, transaction_type
ORDER BY year, transaction_type;

-- Verificar saldos dos membros em 2025
SELECT
    m.name,
    mpb.quota_expected_annual,
    mpb.quota_paid_total,
    mpb.balance,
    mpb.status
FROM member_period_balance mpb
JOIN members m ON mpb.member_id = m.id
JOIN financial_periods fp ON mpb.period_id = fp.id
WHERE fp.year = 2025
ORDER BY m.name;
