-- =====================================================
-- CRIAR TRANSAÇÕES HISTÓRICAS PARA PAGAMENTOS EXISTENTES
-- =====================================================
-- Este script cria transações na tabela transactions para corresponder
-- aos pagamentos já registados em member_period_balance
-- =====================================================

-- Para cada member_period_balance que tem quota_paid_total > 0
-- criar uma transação correspondente SE não existir já

INSERT INTO transactions (
    id,
    building_id,
    period_id,
    member_id,
    transaction_date,
    transaction_type,
    description,
    amount,
    is_fee_payment,
    payment_method,
    reference_number,
    year,
    notes,
    created_at
)
SELECT
    uuid_generate_v4(),
    fp.building_id,
    mpb.period_id,
    mpb.member_id,
    fp.start_date, -- Data de início do período como data de pagamento
    'income',
    'Pagamento histórico quota ' || fp.year || ' - Importação inicial',
    mpb.quota_paid_total,
    true, -- is_fee_payment
    'Transferência Bancária',
    'HIST-' || fp.year || '-' || SUBSTRING(m.id::text, 1, 8),
    fp.year,
    'Transação criada automaticamente para corresponder a pagamentos históricos já registados em member_period_balance',
    mpb.created_at
FROM member_period_balance mpb
JOIN financial_periods fp ON mpb.period_id = fp.id
JOIN members m ON mpb.member_id = m.id
WHERE mpb.quota_paid_total > 0
  -- Evitar duplicados: só criar se não existir já uma transação para este membro neste período
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.period_id = mpb.period_id
        AND t.member_id = mpb.member_id
        AND t.is_fee_payment = true
        AND t.deleted_at IS NULL
  );

-- Mostrar resumo do que foi criado
SELECT
    fp.year,
    COUNT(*) as transacoes_criadas,
    SUM(mpb.quota_paid_total) as total_valor
FROM member_period_balance mpb
JOIN financial_periods fp ON mpb.period_id = fp.id
WHERE mpb.quota_paid_total > 0
GROUP BY fp.year
ORDER BY fp.year;
