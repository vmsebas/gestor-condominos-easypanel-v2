-- =====================================================
-- CRIAR CATEGORIAS E IMPORTAR DESPESAS DE 2025
-- =====================================================

-- Criar categorias que faltam
INSERT INTO transaction_categories (id, building_id, name, type, description)
VALUES
    ('a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e06', 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc', 'Seguros', 'expense', 'Seguros do condomínio (Fidelidade, Allianz)'),
    ('a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07', 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc', 'Despesas Bancárias', 'expense', 'Manutenção conta, impostos selo, comissões'),
    ('a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e08', 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc', 'Administração', 'expense', 'Despesas administrativas do condomínio')
ON CONFLICT (id) DO NOTHING;

-- Buscar IDs necessários
DO $$
DECLARE
    v_building_id UUID := 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';
    v_period_2025_id UUID;
    v_cat_luz UUID := 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04';
    v_cat_seguros UUID := 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e06';
    v_cat_banco UUID := 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07';
    v_cat_admin UUID := 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e08';
    v_cat_limpeza UUID := 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e03';
BEGIN
    SELECT id INTO v_period_2025_id FROM financial_periods WHERE year = 2025;

    -- ===========================================
    -- DESPESAS DE LUZ (SU ELETRICIDADE)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, category_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, year, notes)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-03-08', 'expense', 'SU Eletricidade - Fevereiro', 6.47, false, 'Débito Direto', 2025, 'COBR SEPA SU ELETRICIDADE S.A.'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-04-05', 'expense', 'SU Eletricidade - Março', 6.93, false, 'Débito Direto', 2025, 'COBR SEPA SU ELETRICIDADE S.A.'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-05-29', 'expense', 'SU Eletricidade - Abril', 6.65, false, 'Débito Direto', 2025, 'COBR SEPA SU ELETRICIDADE S.A.'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-06-30', 'expense', 'SU Eletricidade - Maio', 6.93, false, 'Débito Direto', 2025, 'DD SU ELETRICIDADE, S.A.'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-07-28', 'expense', 'SU Eletricidade - Junho', 6.65, false, 'Débito Direto', 2025, 'DD SU ELETRICIDADE, S.A.'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-08-28', 'expense', 'SU Eletricidade - Julho', 6.93, false, 'Débito Direto', 2025, 'DD SU ELETRICIDADE, S.A.'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-09-26', 'expense', 'SU Eletricidade - Agosto', 6.59, false, 'Débito Direto', 2025, 'DD SU ELETRICIDADE, S.A.'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_luz, '2025-10-27', 'expense', 'SU Eletricidade - Setembro', 6.82, false, 'Débito Direto', 2025, 'DD SU ELETRICIDADE, S.A.');

    -- ===========================================
    -- DESPESAS BANCÁRIAS
    -- ===========================================
    -- Manutenção de conta (€7.99 mensais)
    INSERT INTO transactions (id, building_id, period_id, category_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, year, notes)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-02-07', 'expense', 'Manutenção conta - Janeiro', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS JAN 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-03-10', 'expense', 'Manutenção conta - Fevereiro', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS FEV 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-04-07', 'expense', 'Manutenção conta - Março', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS MAR 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-05-09', 'expense', 'Manutenção conta - Abril', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS ABR 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-06-10', 'expense', 'Manutenção conta - Maio', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS MAI 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-07-08', 'expense', 'Manutenção conta - Junho', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS JUN 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-08-07', 'expense', 'Manutenção conta - Julho', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS JUL 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-09-05', 'expense', 'Manutenção conta - Agosto', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS AGO 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-10-07', 'expense', 'Manutenção conta - Setembro', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS SET 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-11-07', 'expense', 'Manutenção conta - Outubro', 7.99, false, 'Débito Automático', 2025, 'MANUTENCAO DE CONTA VALOR NEGOCIOS OUT 2025');

    -- Impostos de Selo (€0.32 mensais)
    INSERT INTO transactions (id, building_id, period_id, category_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, year, notes)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-02-10', 'expense', 'Imposto Selo - Janeiro', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO JAN 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-03-13', 'expense', 'Imposto Selo - Fevereiro', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO FEV 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-04-08', 'expense', 'Imposto Selo - Março', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO MAR 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-05-13', 'expense', 'Imposto Selo - Abril', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO ABR 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-06-10', 'expense', 'Imposto Selo - Maio', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO MAI 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-07-08', 'expense', 'Imposto Selo - Junho', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO JUN 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-08-07', 'expense', 'Imposto Selo - Julho', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO JUL 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-09-05', 'expense', 'Imposto Selo - Agosto', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO AGO 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-10-07', 'expense', 'Imposto Selo - Setembro', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO SET 2025'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_banco, '2025-11-07', 'expense', 'Imposto Selo - Outubro', 0.32, false, 'Débito Automático', 2025, 'IMPOSTO DE SELO OUT 2025');

    -- ===========================================
    -- SEGUROS
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, category_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, year, notes)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_seguros, '2025-02-07', 'expense', 'Seguro Condomínio - Fidelidade Anual', 807.15, false, 'Débito Direto', 2025, 'COBR SEPA FIDELIDADE COMPANHIA DE SEGUROS');

    -- ===========================================
    -- ADMINISTRAÇÃO
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, category_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, year, notes)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_admin, '2025-02-03', 'expense', 'Copimatica - Material escritório', 12.13, false, 'Compra', 2025, 'COMPRA COPIMATICA LDA');

    -- ===========================================
    -- LIMPEZA (Vicencia)
    -- ===========================================
    INSERT INTO transactions (id, building_id, period_id, category_id, transaction_date, transaction_type, description, amount, is_fee_payment, payment_method, year, notes)
    VALUES
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_limpeza, '2025-01-31', 'expense', 'Limpeza - Vicencia', 753.13, false, 'Transferência SEPA+', 2025, 'TRF CRED SEPA+ TRANSFERENCIA ATM'),
    (uuid_generate_v4(), v_building_id, v_period_2025_id, v_cat_limpeza, '2025-02-11', 'expense', 'Limpeza - Vicencia (Levantamento ATM)', 50.00, false, 'ATM', 2025, 'LEVANTAMENTO EM ATM BPI');

END $$;

-- Mostrar resumo de despesas por categoria
SELECT
    tc.name AS categoria,
    COUNT(t.id) AS num_transacoes,
    SUM(t.amount) AS total_gasto
FROM transactions t
JOIN transaction_categories tc ON t.category_id = tc.id
WHERE t.year = 2025
  AND t.transaction_type = 'expense'
  AND t.deleted_at IS NULL
GROUP BY tc.id, tc.name
ORDER BY total_gasto DESC;

-- Mostrar totais de 2025
SELECT
    'RECEITAS' AS tipo,
    COUNT(*) AS num_transacoes,
    SUM(amount) AS total
FROM transactions
WHERE year = 2025 AND transaction_type = 'income' AND deleted_at IS NULL
UNION ALL
SELECT
    'DESPESAS' AS tipo,
    COUNT(*) AS num_transacoes,
    SUM(amount) AS total
FROM transactions
WHERE year = 2025 AND transaction_type = 'expense' AND deleted_at IS NULL
UNION ALL
SELECT
    'SALDO' AS tipo,
    NULL AS num_transacoes,
    (SELECT SUM(amount) FROM transactions WHERE year = 2025 AND transaction_type = 'income' AND deleted_at IS NULL) -
    (SELECT SUM(amount) FROM transactions WHERE year = 2025 AND transaction_type = 'expense' AND deleted_at IS NULL) AS total;
