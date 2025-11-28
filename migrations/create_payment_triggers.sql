-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE PAGAMENTOS
-- =====================================================
-- Quando uma transação (pagamento de quota) é inserida/atualizada:
-- 1. Atualiza member_period_balance (quota_paid_total, balance, status, last_payment_date)
-- 2. Atualiza member_account (total_paid_all_time, current_balance)
-- =====================================================

-- FUNÇÃO: Atualizar member_period_balance quando há pagamento
CREATE OR REPLACE FUNCTION update_member_period_balance_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_period_balance_id UUID;
    v_total_paid NUMERIC(12,2);
    v_expected_annual NUMERIC(12,2);
    v_new_balance NUMERIC(12,2);
    v_new_status VARCHAR(20);
BEGIN
    -- Apenas processar se for pagamento (income) de quota (is_fee_payment = true)
    -- com period_id e member_id definidos
    IF NEW.transaction_type = 'income'
       AND NEW.is_fee_payment = true
       AND NEW.period_id IS NOT NULL
       AND NEW.member_id IS NOT NULL THEN

        -- Buscar o ID do member_period_balance correspondente
        SELECT id, quota_expected_annual
        INTO v_period_balance_id, v_expected_annual
        FROM member_period_balance
        WHERE period_id = NEW.period_id
          AND member_id = NEW.member_id;

        -- Se não existir o registo de member_period_balance, criar agora
        IF v_period_balance_id IS NULL THEN
            -- Buscar dados do membro e período para criar registo
            INSERT INTO member_period_balance (
                period_id,
                member_id,
                quota_expected_monthly,
                quota_expected_annual,
                quota_paid_total,
                balance,
                status,
                last_payment_date,
                notes
            )
            SELECT
                fp.id,
                m.id,
                CASE
                    WHEN m.permilage = 150 THEN fp.monthly_quota_150
                    WHEN m.permilage = 200 THEN fp.monthly_quota_200
                    ELSE fp.monthly_quota_150
                END,
                CASE
                    WHEN m.permilage = 150 THEN fp.monthly_quota_150 * 12
                    WHEN m.permilage = 200 THEN fp.monthly_quota_200 * 12
                    ELSE fp.monthly_quota_150 * 12
                END,
                NEW.amount, -- Primeiro pagamento
                (CASE
                    WHEN m.permilage = 150 THEN fp.monthly_quota_150 * 12
                    WHEN m.permilage = 200 THEN fp.monthly_quota_200 * 12
                    ELSE fp.monthly_quota_150 * 12
                END) - NEW.amount, -- Balance = Expected - Paid
                CASE
                    WHEN NEW.amount >= (CASE
                        WHEN m.permilage = 150 THEN fp.monthly_quota_150 * 12
                        WHEN m.permilage = 200 THEN fp.monthly_quota_200 * 12
                        ELSE fp.monthly_quota_150 * 12
                    END) THEN 'paid'
                    WHEN NEW.amount > 0 THEN 'partial'
                    ELSE 'unpaid'
                END,
                NEW.transaction_date,
                'Criado automaticamente ao registrar pagamento'
            FROM financial_periods fp
            JOIN members m ON m.id = NEW.member_id
            WHERE fp.id = NEW.period_id
            RETURNING id, quota_expected_annual INTO v_period_balance_id, v_expected_annual;
        ELSE
            -- Atualizar member_period_balance existente
            -- Calcular total pago (somar todos os pagamentos deste membro neste período)
            -- Calcular total pago (somar TODAS as transações válidas)
            -- IMPORTANTE: O trigger é AFTER INSERT/UPDATE, então NEW já está na tabela
            -- Não precisamos adicionar NEW.amount separadamente!
            SELECT COALESCE(SUM(amount), 0)
            INTO v_total_paid
            FROM transactions
            WHERE period_id = NEW.period_id
              AND member_id = NEW.member_id
              AND transaction_type = 'income'
              AND is_fee_payment = true
              AND deleted_at IS NULL;

            -- Calcular novo balance (pode ser negativo se tiver dívida)
            v_new_balance := v_expected_annual - v_total_paid;

            -- Determinar novo status
            IF v_total_paid >= v_expected_annual THEN
                v_new_status := 'paid';
            ELSIF v_total_paid > 0 THEN
                v_new_status := 'partial';
            ELSE
                v_new_status := 'unpaid';
            END IF;

            -- Atualizar member_period_balance
            UPDATE member_period_balance
            SET quota_paid_total = v_total_paid,
                balance = v_new_balance,
                status = v_new_status,
                last_payment_date = NEW.transaction_date,
                updated_at = NOW()
            WHERE id = v_period_balance_id;
        END IF;

        -- Atualizar member_account (conta global do membro)
        -- Recalcular totais de todos os tempos
        UPDATE member_account ma
        SET total_paid_all_time = (
                SELECT COALESCE(SUM(t.amount), 0)
                FROM transactions t
                WHERE t.member_id = NEW.member_id
                  AND t.transaction_type = 'income'
                  AND t.is_fee_payment = true
                  AND t.deleted_at IS NULL
            ),
            current_balance = (
                SELECT COALESCE(SUM(mpb.balance), 0)
                FROM member_period_balance mpb
                WHERE mpb.member_id = NEW.member_id
            ),
            has_overdue_debt = (
                SELECT EXISTS (
                    SELECT 1
                    FROM member_period_balance mpb
                    JOIN financial_periods fp ON mpb.period_id = fp.id
                    WHERE mpb.member_id = NEW.member_id
                      AND mpb.balance < 0
                      AND fp.year < EXTRACT(YEAR FROM CURRENT_DATE)
                )
            ),
            overdue_amount = (
                SELECT COALESCE(ABS(SUM(mpb.balance)), 0)
                FROM member_period_balance mpb
                JOIN financial_periods fp ON mpb.period_id = fp.id
                WHERE mpb.member_id = NEW.member_id
                  AND mpb.balance < 0
                  AND fp.year < EXTRACT(YEAR FROM CURRENT_DATE)
            ),
            updated_at = NOW()
        WHERE ma.member_id = NEW.member_id;

        -- Se não existir member_account, criar
        IF NOT FOUND THEN
            INSERT INTO member_account (
                member_id,
                current_balance,
                total_charged_all_time,
                total_paid_all_time,
                has_overdue_debt,
                overdue_amount
            )
            SELECT
                NEW.member_id,
                COALESCE(SUM(mpb.balance), 0),
                COALESCE(SUM(mpb.quota_expected_annual), 0),
                NEW.amount,
                false,
                0
            FROM member_period_balance mpb
            WHERE mpb.member_id = NEW.member_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Executar função APÓS inserção de transação
DROP TRIGGER IF EXISTS trg_update_period_balance_on_payment_insert ON transactions;
CREATE TRIGGER trg_update_period_balance_on_payment_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_member_period_balance_on_payment();

-- TRIGGER: Executar função APÓS atualização de transação
DROP TRIGGER IF EXISTS trg_update_period_balance_on_payment_update ON transactions;
CREATE TRIGGER trg_update_period_balance_on_payment_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.amount IS DISTINCT FROM NEW.amount
          OR OLD.period_id IS DISTINCT FROM NEW.period_id
          OR OLD.member_id IS DISTINCT FROM NEW.member_id
          OR OLD.is_fee_payment IS DISTINCT FROM NEW.is_fee_payment)
    EXECUTE FUNCTION update_member_period_balance_on_payment();

-- FUNÇÃO: Recalcular tudo ao eliminar transação (soft delete)
CREATE OR REPLACE FUNCTION recalculate_on_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Se era um pagamento de quota, recalcular tudo
    IF OLD.transaction_type = 'income'
       AND OLD.is_fee_payment = true
       AND OLD.period_id IS NOT NULL
       AND OLD.member_id IS NOT NULL THEN

        -- Recalcular member_period_balance
        UPDATE member_period_balance
        SET quota_paid_total = (
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE period_id = OLD.period_id
                  AND member_id = OLD.member_id
                  AND transaction_type = 'income'
                  AND is_fee_payment = true
                  AND deleted_at IS NULL
            ),
            balance = quota_expected_annual - (
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE period_id = OLD.period_id
                  AND member_id = OLD.member_id
                  AND transaction_type = 'income'
                  AND is_fee_payment = true
                  AND deleted_at IS NULL
            ),
            status = CASE
                WHEN (SELECT COALESCE(SUM(amount), 0)
                      FROM transactions
                      WHERE period_id = OLD.period_id
                        AND member_id = OLD.member_id
                        AND transaction_type = 'income'
                        AND is_fee_payment = true
                        AND deleted_at IS NULL) >= quota_expected_annual THEN 'paid'
                WHEN (SELECT COALESCE(SUM(amount), 0)
                      FROM transactions
                      WHERE period_id = OLD.period_id
                        AND member_id = OLD.member_id
                        AND transaction_type = 'income'
                        AND is_fee_payment = true
                        AND deleted_at IS NULL) > 0 THEN 'partial'
                ELSE 'unpaid'
            END,
            updated_at = NOW()
        WHERE period_id = OLD.period_id AND member_id = OLD.member_id;

        -- Recalcular member_account
        UPDATE member_account
        SET total_paid_all_time = (
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE member_id = OLD.member_id
                  AND transaction_type = 'income'
                  AND is_fee_payment = true
                  AND deleted_at IS NULL
            ),
            current_balance = (
                SELECT COALESCE(SUM(balance), 0)
                FROM member_period_balance
                WHERE member_id = OLD.member_id
            ),
            updated_at = NOW()
        WHERE member_id = OLD.member_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Recalcular ao fazer soft delete
DROP TRIGGER IF EXISTS trg_recalculate_on_delete ON transactions;
CREATE TRIGGER trg_recalculate_on_delete
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
    EXECUTE FUNCTION recalculate_on_transaction_delete();

-- =====================================================
-- COMENTÁRIOS SOBRE O SISTEMA
-- =====================================================
COMMENT ON FUNCTION update_member_period_balance_on_payment() IS
'Atualiza automaticamente member_period_balance e member_account quando uma transação de pagamento de quota é inserida ou atualizada';

COMMENT ON FUNCTION recalculate_on_transaction_delete() IS
'Recalcula member_period_balance e member_account quando uma transação de pagamento é eliminada (soft delete)';
