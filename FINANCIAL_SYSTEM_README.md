# 💰 Sistema de Gestão Financeira - Gestor Condominios

## 📅 Implementado: 23 Novembro 2025

---

## 🎯 Visão Geral

Sistema completo de gestão financeira com **dados reais** do extrato bancário BPI, triggers automáticos para atualização de saldos e relatórios detalhados por período e membro.

## ✅ Funcionalidades Implementadas

### 1. **Base de Dados** (4 Tabelas Novas)

#### `financial_periods` - Períodos Financeiros Anuais
- Períodos de 2021 a 2025
- Quotas mensais diferenciadas (150‰ e 200‰)
- Totais de receitas, despesas e saldo
- Orçamento aprovado e reservas

#### `member_period_balance` - Saldo por Membro/Ano
- Quota esperada anual
- Quota paga (total de transações)
- Saldo (esperado - pago)
- Status: `paid`, `partial`, `unpaid`
- Data do último pagamento

#### `member_account` - Conta Global do Membro
- Saldo atual acumulado
- Total cobrado (histórico completo)
- Total pago (histórico completo)
- Dívidas em atraso (has_overdue_debt)
- Valor em atraso (overdue_amount)

#### `member_monthly_tracking` - Tracking Mensal Detalhado
- Acompanhamento mês a mês
- Quota esperada vs paga por mês
- Transações vinculadas

### 2. **Triggers Automáticos**

#### `update_member_period_balance_on_payment()`
**O que faz:**
- Dispara APÓS inserir/atualizar transação com `is_fee_payment=true`
- Recalcula automaticamente:
  - `quota_paid_total` (soma de todas as transações do período)
  - `balance` (quota_expected - quota_paid)
  - `status` (paid/partial/unpaid)
  - `last_payment_date`
- Atualiza `member_account` globalmente
- Se não existir `member_period_balance`, cria automaticamente

#### `recalculate_on_transaction_delete()`
**O que faz:**
- Dispara ao fazer soft delete de transação
- Recalcula todos os saldos afetados

#### `recalculate_all_period_balances()`
**Função manual:**
- Recalcula TODOS os saldos de TODOS os membros
- Útil para correções e migrações
- Uso: `SELECT * FROM recalculate_all_period_balances();`

### 3. **API Endpoints** (server/routes/financial-periods.cjs)

#### `GET /api/financial-periods?building_id={id}`
Lista todos os períodos financeiros do edifício.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "year": 2025,
      "monthly_quota_150": "32.66",
      "monthly_quota_200": "43.54",
      "annual_budget_expected": "2612.50",
      "total_income": "4037.81",
      "total_expenses": "1759.48",
      "balance": "2278.33",
      "is_closed": false
    }
  ]
}
```

#### `GET /api/financial-periods/:year/summary?building_id={id}`
Resumo completo de um ano específico com todos os membros.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { /* dados do período */ },
    "balances": [
      {
        "member_id": "uuid",
        "member_name": "Nome",
        "fraction": "E",
        "permilage": "200.0000",
        "quota_expected_annual": "522.48",
        "quota_paid_total": "487.62",
        "balance": "34.86",
        "status": "partial",
        "last_payment_date": "2025-02-24"
      }
    ],
    "totals": {
      "expected_total": 2612.64,
      "paid_total": 4037.81,
      "balance_total": -1425.17,
      "members_count": 6,
      "paid_count": 3,
      "partial_count": 3,
      "unpaid_count": 0
    }
  }
}
```

#### `GET /api/financial-periods/member/:member_id/history`
Histórico completo de um membro em todos os anos.

#### `GET /api/financial-periods/dashboard-summary?building_id={id}`
Dashboard financeiro completo para a home page.

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "member_name": "Nome",
        "current_balance": "-391.92",
        "financial_status": "debtor",
        "total_charged": "1646.16",
        "total_paid": "1254.24",
        "permilage": "150.0000",
        "fraction": "D"
      }
    ],
    "current_year_detail": [ /* detalhes 2025 */ ],
    "stats": {
      "total_debt": 0,
      "total_charged": 10954.08,
      "total_paid": 9700.00,
      "members_count": 6,
      "debtors_count": 3,
      "settled_count": 3
    },
    "current_year": 2025
  }
}
```

### 4. **Frontend** (src/components/finance/FinancialPeriodsTab.tsx)

#### Tab "Períodos" na página Finanças
- ✅ Lista de anos (2021-2025) em cards
- ✅ Indicadores visuais por ano:
  - Quota esperada anual
  - Total recebido
  - Saldo do período
  - Status: Aberto/Fechado
- ✅ Botão "Ver Resumo" por ano
- ✅ Modal com lista completa de membros:
  - Nome, fração, permilagem
  - Quota esperada vs paga
  - Saldo individual
  - Status com cores (verde=pago, amarelo=parcial, vermelho=não pago)
  - Data do último pagamento
- ✅ Totais calculados automaticamente

### 5. **Dados Reais Importados do Extrato BPI**

#### 📊 Ano 2025 (Dados Reais do Extrato BPI - Importados 23 Nov 2025)

**RECEITAS (26 transações)**: €4,037.81
- **Vítor**: 12 pagamentos = €444.21
- **João**: 10 pagamentos = €635.72
- **António**: 1 pagamento = €487.62
- **Cristina**: 1 pagamento = €684.24
- **Aldina**: 1 pagamento = €156.78
- **José**: 1 pagamento = €1,629.24 (anos anteriores acumulados)

**DESPESAS (37 transações)**: €1,783.98
- 🏢 **Seguros**: €807.15 (Fidelidade - seguro anual)
- 🧹 **Limpeza**: €803.13 (Vicencia - 2 pagamentos)
- 🏦 **Despesas Bancárias**: €83.10 (manutenção + impostos)
- 💡 **Electricidade**: ~€54 (SU Eletricidade - 8 meses)
- 📋 **Administração**: €12.13 (Copimatica)

**SALDO LÍQUIDO 2025**: **+€2,253.83**

#### Estado Atual por Membro (2025):

| Membro | Fração | Esperado | Pago | Saldo | Estado |
|--------|--------|----------|------|-------|--------|
| **Aldina** | C | €391.92 | €156.78 | **Deve €235.14** | ⚠️ Parcial |
| **António** | E | €522.48 | €487.62 | **Deve €34.86** | ⚠️ Parcial |
| **João** | F | €522.48 | €635.72 | **Crédito €113.24** | ✅ Pago |
| **José** | B | €391.92 | €1,629.24 | **Crédito €1,237.32** | ✅ Pago |
| **Cristina** | D | €391.92 | €684.24 | **Crédito €292.32** | ✅ Pago |
| **Vítor** | A | €391.92 | €444.21 | **Crédito €52.29** | ✅ Pago |

### 6. **Categorias de Transações**

#### Receitas (Income):
- **Quotas Mensais** - Pagamentos regulares dos condóminos

#### Despesas (Expense):
- **Electricidade** - SU Eletricidade (débito direto mensal)
- **Limpeza** - Vicencia (pagamentos periódicos)
- **Seguros** - Fidelidade/Allianz (pagamento anual)
- **Despesas Bancárias** - Manutenção conta + impostos selo
- **Administração** - Material de escritório, etc
- **Manutenção** - Reparações e conservação
- **Água** - Consumo de água (quando aplicável)

---

## 🔧 Como Funciona

### Fluxo de Pagamento Automático:

```
1. Inserir Transação
   ↓
   INSERT INTO transactions (
       period_id,          -- Vincular ao período (ex: 2025)
       member_id,          -- Vincular ao membro
       transaction_type,   -- 'income'
       amount,             -- Valor pago
       is_fee_payment,     -- true (é pagamento de quota)
       transaction_date
   )
   ↓
2. Trigger Dispara Automaticamente
   ↓
   update_member_period_balance_on_payment()
   ↓
3. Cálculos Automáticos
   ↓
   - Soma TODAS as transações do membro no período
   - Calcula: quota_paid_total
   - Calcula: balance = quota_expected - quota_paid
   - Determina: status (paid/partial/unpaid)
   - Atualiza: last_payment_date
   ↓
4. Atualização em Cascata
   ↓
   - member_period_balance atualizado
   - member_account recalculado (totais históricos)
   ↓
5. API Retorna Dados Atualizados
   ↓
6. Frontend Mostra em Tempo Real
```

### Exemplo Prático:

```sql
-- Registrar pagamento de Vítor (€26.13 da quota de novembro)
INSERT INTO transactions (
    id, building_id, period_id, member_id,
    transaction_date, transaction_type,
    description, amount,
    is_fee_payment, payment_method, year
)
SELECT
    uuid_generate_v4(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    fp.id,
    m.id,
    '2025-11-13',
    'income',
    'Quota Novembro 2025',
    26.13,
    true,
    'Transferência Bancária',
    2025
FROM members m, financial_periods fp
WHERE m.name LIKE 'Vítor%' AND fp.year = 2025;

-- TRIGGER DISPARA AUTOMATICAMENTE!
-- member_period_balance de Vítor em 2025 é atualizado:
--   quota_paid_total: €418.08 → €444.21
--   balance: -€26.16 → -€52.29
--   status: 'paid'
--   last_payment_date: '2025-11-13'
```

---

## 📊 Relatórios Disponíveis

### 1. **Resumo por Ano**
```sql
SELECT * FROM financial_periods WHERE year = 2025;
```

### 2. **Membros em Dívida**
```sql
SELECT
    m.name,
    mpb.balance,
    mpb.last_payment_date
FROM member_period_balance mpb
JOIN members m ON mpb.member_id = m.id
JOIN financial_periods fp ON mpb.period_id = fp.id
WHERE fp.year = 2025
  AND mpb.balance > 0  -- balance positivo = deve dinheiro
ORDER BY mpb.balance DESC;
```

### 3. **Histórico Completo de um Membro**
```sql
SELECT
    fp.year,
    mpb.quota_expected_annual,
    mpb.quota_paid_total,
    mpb.balance,
    mpb.status
FROM member_period_balance mpb
JOIN financial_periods fp ON mpb.period_id = fp.id
WHERE mpb.member_id = 'uuid-do-membro'
ORDER BY fp.year DESC;
```

### 4. **Despesas por Categoria (2025)**
```sql
SELECT
    tc.name,
    COUNT(t.id) AS num_transacoes,
    SUM(t.amount) AS total
FROM transactions t
JOIN transaction_categories tc ON t.category_id = tc.id
WHERE t.year = 2025
  AND t.transaction_type = 'expense'
GROUP BY tc.name
ORDER BY total DESC;
```

---

## 🚀 Próximas Funcionalidades Sugeridas

### Curto Prazo:
1. ✅ **Dashboard Melhorado** - Gráficos de receitas vs despesas
2. ✅ **Alertas de Morosidade** - Notificações automáticas para membros em dívida
3. ✅ **Exportação de Relatórios** - PDF/Excel com resumos financeiros
4. ✅ **Previsão de Caixa** - Projeção de receitas e despesas futuras

### Médio Prazo:
5. ✅ **Importação Automática** - Upload de extrato bancário (CSV/OFX)
6. ✅ **Reconciliação Bancária** - Match automático de transações
7. ✅ **Orçamento Anual** - Planeamento e controlo orçamental
8. ✅ **Relatórios Legais** - Demonstrações financeiras para assembleia

### Longo Prazo:
9. ✅ **Integração MULTIBANCO** - Geração de referências MB automáticas
10. ✅ **Portal do Condómino** - Acesso individual para consultar saldos
11. ✅ **Pagamentos Online** - MB WAY, cartão de crédito
12. ✅ **IA para Categorização** - Classificação automática de despesas

---

## 📁 Estrutura de Ficheiros

```
gestor-condominos/
├── server/
│   ├── routes/
│   │   └── financial-periods.cjs  ← API endpoints
│   └── config/
│       └── database.cjs           ← Pool de conexão
│
├── src/
│   ├── components/
│   │   └── finance/
│   │       └── FinancialPeriodsTab.tsx  ← Tab Períodos
│   ├── lib/
│   │   └── api.ts                 ← Client API
│   └── pages/
│       └── Financas.tsx           ← Página principal
│
└── migrations/
    ├── create_financial_tables.sql        ← Criação de tabelas
    ├── populate_financial_periods.sql     ← População inicial
    ├── create_payment_triggers.sql        ← Triggers automáticos
    ├── create_historical_transactions.sql ← Transações históricas
    ├── import_2025_payments.sql           ← Pagamentos 2025
    └── import_2025_expenses.sql           ← Despesas 2025
```

---

## 🔐 Segurança

- ✅ Todas as queries usam **prepared statements** (proteção contra SQL injection)
- ✅ Autenticação obrigatória para todos os endpoints
- ✅ **Soft delete** em todas as transações (deleted_at)
- ✅ Auditoria completa (created_at, updated_at, created_by_user_id)
- ✅ Foreign keys garantem integridade referencial

---

## 📞 Suporte

Para dúvidas ou melhorias, consulte:
- 📄 Documentação da API: `server/routes/financial-periods.cjs`
- 🎨 Componente UI: `src/components/finance/FinancialPeriodsTab.tsx`
- 🗄️ Esquema da BD: `migrations/create_financial_tables.sql`

---

**Última atualização**: 23 Novembro 2025
**Versão**: 1.0.0
**Status**: ✅ Produção com dados reais
