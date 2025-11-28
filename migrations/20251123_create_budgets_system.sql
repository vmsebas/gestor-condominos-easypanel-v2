-- =====================================================
-- SISTEMA DE PRESUPUESTOS (OBRIGATÓRIO POR LEI)
-- =====================================================
-- Art. 1432º do Código Civil Português:
-- "A assembleia de condóminos deve reunir-se ordinariamente uma vez
-- por ano para deliberar sobre o orçamento das despesas do ano seguinte"
--
-- Lei da Propriedade Horizontal (LPH) - Dec-Lei 268/94:
-- - Obrigatório aprovar orçamento anual na assembleia ordinária
-- - Deve incluir previsão de despesas e rateio por condómino
-- =====================================================

-- Tabela: budgets (Orçamentos Anuais)
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES financial_periods(id) ON DELETE CASCADE,

    -- Informação Básica
    budget_year INTEGER NOT NULL,
    budget_name VARCHAR(255), -- Ex: "Orçamento 2025", "Orçamento Extraordinário 2025"
    budget_type VARCHAR(50) DEFAULT 'annual', -- 'annual', 'extraordinary', 'revision'

    -- Totais do Orçamento
    total_budgeted NUMERIC(12,2) DEFAULT 0, -- Total previsto
    total_spent NUMERIC(12,2) DEFAULT 0,    -- Total gasto (calculado automaticamente)
    variance NUMERIC(12,2) DEFAULT 0,       -- Diferença (budgeted - spent)
    variance_percentage NUMERIC(5,2) DEFAULT 0, -- % de variação

    -- Estado do Orçamento
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected', 'active', 'closed'

    -- Aprovação em Assembleia
    assembly_date DATE, -- Data da assembleia que aprovou
    minute_id UUID REFERENCES minutes(id), -- Acta da assembleia
    approved_by VARCHAR(255), -- Nome do presidente da mesa
    approval_votes_favor INTEGER, -- Votos a favor
    approval_votes_against INTEGER, -- Votos contra
    approval_votes_abstained INTEGER, -- Abstenções
    approval_permilage NUMERIC(7,4), -- Permilagem total que votou a favor

    -- Notas e Observações
    description TEXT, -- Descrição geral do orçamento
    notes TEXT, -- Notas adicionais

    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    deleted_at TIMESTAMP NULL, -- Soft delete

    -- Índices e Constraints
    CONSTRAINT unique_budget_per_period UNIQUE(building_id, period_id, budget_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budgets_building_id ON budgets(building_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period_id ON budgets(period_id);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(budget_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_deleted_at ON budgets(deleted_at);

-- Comentários
COMMENT ON TABLE budgets IS 'Orçamentos anuais obrigatórios por lei (Art. 1432º CC)';
COMMENT ON COLUMN budgets.status IS 'draft=rascunho, submitted=submetido, approved=aprovado, active=em execução, closed=encerrado';
COMMENT ON COLUMN budgets.budget_type IS 'annual=anual ordinário, extraordinary=extraordinário, revision=revisão';

-- =====================================================
-- Tabela: budget_items (Items do Orçamento por Categoria)
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES transaction_categories(id),

    -- Informação do Item
    item_name VARCHAR(255) NOT NULL, -- Ex: "Electricidade", "Limpeza", "Seguros"
    item_description TEXT, -- Descrição detalhada

    -- Valores
    amount_budgeted NUMERIC(12,2) NOT NULL DEFAULT 0, -- Valor previsto
    amount_spent NUMERIC(12,2) DEFAULT 0,             -- Valor gasto (calculado)
    amount_variance NUMERIC(12,2) DEFAULT 0,          -- Diferença
    variance_percentage NUMERIC(5,2) DEFAULT 0,       -- % de variação

    -- Rateio por Condómino (opcional)
    is_shared BOOLEAN DEFAULT true, -- Se é rateado por todos ou não

    -- Frequência e Estimativas
    frequency VARCHAR(50), -- 'monthly', 'quarterly', 'annual', 'one-time'
    estimated_monthly NUMERIC(12,2), -- Estimativa mensal (se aplicável)

    -- Notas
    notes TEXT,

    -- Ordem de Apresentação
    display_order INTEGER DEFAULT 0,

    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category_id ON budget_items(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_deleted_at ON budget_items(deleted_at);

-- Comentários
COMMENT ON TABLE budget_items IS 'Items individuais do orçamento por categoria de despesa';
COMMENT ON COLUMN budget_items.is_shared IS 'TRUE se rateado por todos os condóminos, FALSE se específico';
COMMENT ON COLUMN budget_items.frequency IS 'Frequência da despesa: monthly, quarterly, annual, one-time';

-- =====================================================
-- TRIGGER: Atualizar total do orçamento quando items mudam
-- =====================================================
CREATE OR REPLACE FUNCTION update_budget_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar totais do orçamento
    UPDATE budgets
    SET
        total_budgeted = (
            SELECT COALESCE(SUM(amount_budgeted), 0)
            FROM budget_items
            WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
            AND deleted_at IS NULL
        ),
        total_spent = (
            SELECT COALESCE(SUM(amount_spent), 0)
            FROM budget_items
            WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
            AND deleted_at IS NULL
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);

    -- Calcular variance
    UPDATE budgets
    SET
        variance = total_budgeted - total_spent,
        variance_percentage = CASE
            WHEN total_budgeted > 0 THEN
                ((total_budgeted - total_spent) / total_budgeted) * 100
            ELSE 0
        END
    WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT/UPDATE/DELETE em budget_items
DROP TRIGGER IF EXISTS trigger_update_budget_totals_insert ON budget_items;
CREATE TRIGGER trigger_update_budget_totals_insert
AFTER INSERT ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_budget_totals();

DROP TRIGGER IF EXISTS trigger_update_budget_totals_update ON budget_items;
CREATE TRIGGER trigger_update_budget_totals_update
AFTER UPDATE ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_budget_totals();

DROP TRIGGER IF EXISTS trigger_update_budget_totals_delete ON budget_items;
CREATE TRIGGER trigger_update_budget_totals_delete
AFTER UPDATE OF deleted_at ON budget_items
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION update_budget_totals();

-- =====================================================
-- TRIGGER: Atualizar amount_spent quando transações são criadas
-- =====================================================
CREATE OR REPLACE FUNCTION update_budget_item_spent()
RETURNS TRIGGER AS $$
DECLARE
    v_budget_id UUID;
    v_budget_item_id UUID;
BEGIN
    -- Encontrar o orçamento ativo para este período
    SELECT b.id INTO v_budget_id
    FROM budgets b
    WHERE b.period_id = NEW.period_id
    AND b.status = 'active'
    AND b.deleted_at IS NULL
    LIMIT 1;

    IF v_budget_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Encontrar o budget_item correspondente à categoria
    SELECT bi.id INTO v_budget_item_id
    FROM budget_items bi
    WHERE bi.budget_id = v_budget_id
    AND bi.category_id = NEW.category_id
    AND bi.deleted_at IS NULL
    LIMIT 1;

    IF v_budget_item_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Atualizar amount_spent do budget_item
    UPDATE budget_items
    SET amount_spent = (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE category_id = NEW.category_id
        AND period_id = NEW.period_id
        AND transaction_type = 'expense'
        AND deleted_at IS NULL
    )
    WHERE id = v_budget_item_id;

    -- Calcular variance do item
    UPDATE budget_items
    SET
        amount_variance = amount_budgeted - amount_spent,
        variance_percentage = CASE
            WHEN amount_budgeted > 0 THEN
                ((amount_budgeted - amount_spent) / amount_budgeted) * 100
            ELSE 0
        END
    WHERE id = v_budget_item_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger em transactions para atualizar budget_items
DROP TRIGGER IF EXISTS trigger_update_budget_item_spent ON transactions;
CREATE TRIGGER trigger_update_budget_item_spent
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
WHEN (NEW.transaction_type = 'expense' OR OLD.transaction_type = 'expense')
EXECUTE FUNCTION update_budget_item_spent();

-- =====================================================
-- FUNÇÃO: Criar orçamento a partir do ano anterior
-- =====================================================
CREATE OR REPLACE FUNCTION create_budget_from_previous_year(
    p_building_id UUID,
    p_new_year INTEGER,
    p_increase_percentage NUMERIC DEFAULT 3.0 -- Inflação estimada 3%
)
RETURNS UUID AS $$
DECLARE
    v_new_period_id UUID;
    v_prev_period_id UUID;
    v_prev_budget_id UUID;
    v_new_budget_id UUID;
BEGIN
    -- Buscar período do novo ano
    SELECT id INTO v_new_period_id
    FROM financial_periods
    WHERE year = p_new_year;

    IF v_new_period_id IS NULL THEN
        RAISE EXCEPTION 'Financial period for year % not found', p_new_year;
    END IF;

    -- Buscar período do ano anterior
    SELECT id INTO v_prev_period_id
    FROM financial_periods
    WHERE year = p_new_year - 1;

    IF v_prev_period_id IS NULL THEN
        RAISE EXCEPTION 'Previous year financial period not found';
    END IF;

    -- Buscar orçamento do ano anterior
    SELECT id INTO v_prev_budget_id
    FROM budgets
    WHERE building_id = p_building_id
    AND period_id = v_prev_period_id
    AND budget_type = 'annual'
    AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_prev_budget_id IS NULL THEN
        RAISE EXCEPTION 'No budget found for previous year';
    END IF;

    -- Criar novo orçamento
    INSERT INTO budgets (
        building_id,
        period_id,
        budget_year,
        budget_name,
        budget_type,
        status,
        description
    )
    VALUES (
        p_building_id,
        v_new_period_id,
        p_new_year,
        'Orçamento ' || p_new_year,
        'annual',
        'draft',
        'Orçamento criado automaticamente com base no ano anterior'
    )
    RETURNING id INTO v_new_budget_id;

    -- Copiar items do ano anterior com aumento de inflação
    INSERT INTO budget_items (
        budget_id,
        category_id,
        item_name,
        item_description,
        amount_budgeted,
        is_shared,
        frequency,
        estimated_monthly,
        display_order
    )
    SELECT
        v_new_budget_id,
        category_id,
        item_name,
        item_description,
        ROUND(amount_budgeted * (1 + p_increase_percentage / 100), 2),
        is_shared,
        frequency,
        ROUND(estimated_monthly * (1 + p_increase_percentage / 100), 2),
        display_order
    FROM budget_items
    WHERE budget_id = v_prev_budget_id
    AND deleted_at IS NULL;

    RETURN v_new_budget_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: Resumo de orçamentos com comparação
-- =====================================================
CREATE OR REPLACE VIEW budget_summary AS
SELECT
    b.id AS budget_id,
    b.budget_year,
    b.budget_name,
    b.budget_type,
    b.status,
    fp.year AS period_year,
    bld.name AS building_name,
    b.total_budgeted,
    b.total_spent,
    b.variance,
    b.variance_percentage,
    b.assembly_date,
    b.approved_by,
    COUNT(bi.id) AS items_count,
    ROUND((b.total_spent / NULLIF(b.total_budgeted, 0)) * 100, 2) AS execution_percentage
FROM budgets b
JOIN financial_periods fp ON b.period_id = fp.id
JOIN buildings bld ON b.building_id = bld.id
LEFT JOIN budget_items bi ON bi.budget_id = b.id AND bi.deleted_at IS NULL
WHERE b.deleted_at IS NULL
GROUP BY b.id, fp.year, bld.name;

COMMENT ON VIEW budget_summary IS 'Resumo de orçamentos com estatísticas de execução';

-- =====================================================
-- SEED DATA: Orçamento exemplo para 2025
-- =====================================================
DO $$
DECLARE
    v_building_id UUID := 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';
    v_period_2025_id UUID;
    v_budget_id UUID;
    v_cat_luz UUID;
    v_cat_limpeza UUID;
    v_cat_seguros UUID;
    v_cat_banco UUID;
    v_cat_admin UUID;
BEGIN
    -- Buscar período 2025
    SELECT id INTO v_period_2025_id
    FROM financial_periods
    WHERE year = 2025;

    IF v_period_2025_id IS NULL THEN
        RAISE NOTICE 'Financial period 2025 not found, skipping seed data';
        RETURN;
    END IF;

    -- Buscar categorias
    SELECT id INTO v_cat_luz FROM transaction_categories WHERE LOWER(name) = 'electricidade';
    SELECT id INTO v_cat_limpeza FROM transaction_categories WHERE LOWER(name) = 'limpeza';
    SELECT id INTO v_cat_seguros FROM transaction_categories WHERE LOWER(name) = 'seguros';
    SELECT id INTO v_cat_banco FROM transaction_categories WHERE LOWER(name) = 'despesas bancárias';
    SELECT id INTO v_cat_admin FROM transaction_categories WHERE LOWER(name) = 'administração';

    -- Criar orçamento 2025 se não existir
    INSERT INTO budgets (
        building_id,
        period_id,
        budget_year,
        budget_name,
        budget_type,
        status,
        description
    )
    VALUES (
        v_building_id,
        v_period_2025_id,
        2025,
        'Orçamento 2025',
        'annual',
        'active', -- Já está ativo
        'Orçamento anual aprovado em Assembleia Ordinária'
    )
    ON CONFLICT (building_id, period_id, budget_type) DO NOTHING
    RETURNING id INTO v_budget_id;

    -- Se já existia, buscar o ID
    IF v_budget_id IS NULL THEN
        SELECT id INTO v_budget_id
        FROM budgets
        WHERE building_id = v_building_id
        AND period_id = v_period_2025_id
        AND budget_type = 'annual';
    END IF;

    -- Adicionar items do orçamento (baseado nos dados reais de 2025)
    INSERT INTO budget_items (budget_id, category_id, item_name, item_description, amount_budgeted, frequency, estimated_monthly, display_order)
    VALUES
        (v_budget_id, v_cat_seguros, 'Seguro Multiriscos', 'Seguro anual do edifício (Fidelidade)', 850.00, 'annual', 70.83, 1),
        (v_budget_id, v_cat_limpeza, 'Limpeza das Áreas Comuns', 'Limpeza quinzenal das escadas e hall de entrada', 900.00, 'monthly', 75.00, 2),
        (v_budget_id, v_cat_luz, 'Electricidade Áreas Comuns', 'Iluminação escadas e hall (SU Eletricidade)', 90.00, 'monthly', 7.50, 3),
        (v_budget_id, v_cat_banco, 'Despesas Bancárias', 'Manutenção de conta + impostos de selo', 100.00, 'monthly', 8.33, 4),
        (v_budget_id, v_cat_admin, 'Material de Escritório', 'Material administrativo e impressões', 50.00, 'quarterly', 4.17, 5)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Budget 2025 created successfully with % items', (SELECT COUNT(*) FROM budget_items WHERE budget_id = v_budget_id);
END $$;

-- =====================================================
-- RELATÓRIO: Execução do Orçamento
-- =====================================================
SELECT
    '📊 ORÇAMENTO 2025 - RESUMO' AS titulo;

SELECT
    b.budget_name AS "Orçamento",
    b.status AS "Estado",
    b.total_budgeted AS "Previsto (€)",
    b.total_spent AS "Gasto (€)",
    b.variance AS "Diferença (€)",
    CONCAT(b.variance_percentage, '%') AS "Variação (%)"
FROM budgets b
JOIN financial_periods fp ON b.period_id = fp.id
WHERE fp.year = 2025
AND b.deleted_at IS NULL;

SELECT
    '📋 ITEMS DO ORÇAMENTO 2025' AS titulo;

SELECT
    bi.item_name AS "Item",
    tc.name AS "Categoria",
    bi.frequency AS "Frequência",
    bi.amount_budgeted AS "Previsto (€)",
    bi.amount_spent AS "Gasto (€)",
    bi.amount_variance AS "Diferença (€)",
    CONCAT(bi.variance_percentage, '%') AS "Variação (%)"
FROM budget_items bi
JOIN budgets b ON bi.budget_id = b.id
LEFT JOIN transaction_categories tc ON bi.category_id = tc.id
JOIN financial_periods fp ON b.period_id = fp.id
WHERE fp.year = 2025
AND bi.deleted_at IS NULL
ORDER BY bi.display_order;
