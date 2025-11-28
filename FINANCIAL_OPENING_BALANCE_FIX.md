# 🔧 Correção: Opening Balance no Frontend

**Data**: 23 Novembro 2025
**Problema Identificado**: Frontend não mostra saldos de anos anteriores

---

## ❌ Problema Reportado pelo Utilizador

User viu no frontend:
```
Total Esperado: 2612,64 €
Total Pago: 1079,93 €
Dívida Total: 1750,53 €
```

E disse: **"el balance está mal o te falta info del extracto"**

---

## 🔍 Análise do Problema

### Dados na Base de Dados (CORRETOS):

```sql
Total Esperado 2025: 2.612,64 €
Total Pago (para 2025): 1.079,93 €  ✅ João (635.72) + Vítor (444.21)
Dívida de 2025: 1.750,53 €  ✅ (esperado - pago)
Crédito Anos Anteriores: -1.956,31 €  ⬅️ ISTO NÃO APARECE!
Balance Total Real: -205,78 €  ⬅️ ISTO TAMBÉM NÃO!
```

### O Que Está a Acontecer:

1. **António, Cristina, José e Aldina** pagaram em 2025, mas esses pagos foram para **anos anteriores**
2. Script `fix_opening_balances_2025.sql` marcou corretamente:
   - `is_prior_year_payment = true` nas transações
   - `quota_paid_total = 0.00` para esses membros (não pagaram 2025)
   - `opening_balance` com crédito negativo (pagaram adiantado)

3. **Frontend só mostra `balance` (dívida 2025), não mostra `opening_balance`**

---

## 📊 Situação Real por Condómino

| Condómino | Quota 2025 | Pago 2025 | **Crédito Anterior** | Dívida 2025 | **Balance TOTAL** | **Estado Real** |
|-----------|------------|-----------|----------------------|-------------|-------------------|-----------------|
| **António** | 522,48 € | 0 € | **-487,62 €** | 522,48 € | **34,86 €** | Deve apenas 34,86 € (não 522,48 €!) |
| **Cristina** | 391,92 € | 0 € | **-292,32 €** | 391,92 € | **99,60 €** | Deve apenas 99,60 € |
| **José** | 391,92 € | 0 € | **-1.237,32 €** | 391,92 € | **-845,40 €** | **TEM CRÉDITO de 845,40 €!** |
| **João** | 522,48 € | 635,72 € | **113,24 €** | 0 € | **0 €** | Al día ✅ (abateu dívida anterior) |
| **Aldina** | 391,92 € | 0 € | **-156,78 €** | 391,92 € | **235,14 €** | Deve 235,14 € |
| **Vítor** | 391,92 € | 444,21 € | **104,49 €** | 52,29 € | **156,78 €** | Deve 156,78 € (não 52,29 €!) |

### Exemplo José (Caso Mais Evidente):

**Extrato mostra**: Pagou **1.629,24 €** em 26/02/2025

**Realidade**:
- Esse pagamento foi para anos anteriores (2021-2024)
- Ainda não pagou nada de 2025
- Tem tanto crédito (-1.237,32 €) que mesmo devendo 391,92 € de 2025, acaba com **CRÉDITO de 845,40 €**!

**Frontend mostra**:
- ❌ Pago: 0 €
- ❌ Balance: 391,92 € (deve)

**Deveria mostrar**:
- ✅ Pago 2025: 0 €
- ✅ Dívida 2025: 391,92 €
- ✅ **Crédito Anos Anteriores: -1.237,32 €**
- ✅ **Balance Total: -845,40 €** (TEM CRÉDITO!)

---

## ✅ Correção Aplicada

### 1. API Atualizada

**Arquivo**: `server/routes/financial-periods.cjs`

**Antes**:
```sql
SELECT
  mpb.quota_expected_annual,
  mpb.quota_paid_total,
  mpb.balance,
  mpb.status
FROM member_period_balance mpb
```

**Depois** (✅ CORRIGIDO):
```sql
SELECT
  mpb.quota_expected_annual,
  mpb.quota_paid_total,
  mpb.balance,  -- Dívida de 2025
  mpb.opening_balance,  -- ⬅️ NOVO!
  (mpb.opening_balance + mpb.balance) as balance_total_real,  -- ⬅️ NOVO!
  mpb.status
FROM member_period_balance mpb
```

**Totais Atualizados**:
```javascript
{
  expected_total: 2612.64,
  paid_total: 1079.93,
  balance_2025: 1750.53,  // ⬅️ Renomeado (antes era balance_total)
  opening_balance_total: -1956.31,  // ⬅️ NOVO!
  balance_total_real: -205.78,  // ⬅️ NOVO!
  members_count: 6,
  paid_count: 1,
  partial_count: 1,
  unpaid_count: 4
}
```

---

## 🎨 O Que o Frontend Precisa Mostrar AGORA

### Cards de Resumo (Topo):

**ANTES** (❌ Incompleto):
```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  Total Esperado     │  │   Total Pago        │  │   Dívida Total      │
│    2.612,64 €       │  │    1.079,93 €       │  │    1.750,53 €       │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

**DEPOIS** (✅ Completo):
```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  Total Esperado     │  │   Total Pago        │  │   Dívida 2025       │  │  Balance Total      │
│    2.612,64 €       │  │    1.079,93 €       │  │    1.750,53 €       │  │   -205,78 €        │
│                     │  │   (para 2025)       │  │   (só 2025)         │  │  (CRÉDITO!)        │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│ Crédito Anos        │  │  Taxa Cobrança      │
│ Anteriores          │  │      41.3%          │
│   -1.956,31 €       │  │   (1080/2613)       │
└─────────────────────┘  └─────────────────────┘
```

### Tabela por Condómino:

**ANTES** (❌ Incompleto):
```
Condómino    Quota Anual    Pago    Balance    Estado
António      522,48 €       0 €     522,48 €   Pendente  ❌ Parece que deve muito!
José         391,92 €       0 €     391,92 €   Pendente  ❌ Mas tem CRÉDITO!
```

**DEPOIS** (✅ Completo) - **OPÇÃO A: Duas Colunas**:
```
Condómino    Quota     Pago      Dívida    Crédito       Balance    Estado
                       2025      2025      Anterior      TOTAL
────────────────────────────────────────────────────────────────────────────
António      522,48€   0,00€     522,48€   -487,62€      34,86€     Parcial
Cristina     391,92€   0,00€     391,92€   -292,32€      99,60€     Parcial
José         391,92€   0,00€     391,92€   -1.237,32€   -845,40€    Crédito 💚
João         522,48€   635,72€   0,00€     113,24€       0,00€      Al día ✅
Aldina       391,92€   0,00€     391,92€   -156,78€      235,14€    Deve
Vítor        391,92€   444,21€   52,29€    104,49€       156,78€    Deve
```

**OPÇÃO B: Tooltip/Expandible** (mais limpo):
```
Condómino    Quota     Balance TOTAL    Estado     [i]
────────────────────────────────────────────────────────
António      522,48€   34,86€           Parcial    [▼]
  └─ Detalhe:
     • Pago 2025: 0,00 €
     • Dívida 2025: 522,48 €
     • Crédito Anos Anteriores: -487,62 €
     • Balance Total: 34,86 €

José         391,92€   -845,40€  💚     Crédito    [▼]
  └─ Detalhe:
     • Pago 2025: 0,00 €
     • Dívida 2025: 391,92 €
     • Crédito Anos Anteriores: -1.237,32 €
     • Balance Total: -845,40 € (TEM CRÉDITO!)
```

---

## 🛠️ Código Frontend para Atualizar

### 1. Componente `FinancialPeriodsTab.tsx` ou similar

**Antes**:
```typescript
// Cards de resumo
<div className="grid grid-cols-3 gap-4">
  <Card>
    <CardTitle>Total Esperado</CardTitle>
    <div>{totals.expected_total} €</div>
  </Card>
  <Card>
    <CardTitle>Total Pago</CardTitle>
    <div>{totals.paid_total} €</div>
  </Card>
  <Card>
    <CardTitle>Dívida Total</CardTitle>
    <div>{totals.balance_total} €</div>  {/* ❌ ERRADO */}
  </Card>
</div>
```

**Depois** (✅ CORRIGIDO):
```typescript
// Cards de resumo
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardTitle>Total Esperado</CardTitle>
    <div className="text-2xl">{totals.expected_total} €</div>
  </Card>

  <Card>
    <CardTitle>Total Pago</CardTitle>
    <div className="text-2xl">{totals.paid_total} €</div>
    <div className="text-sm text-muted-foreground">Para 2025</div>
  </Card>

  <Card>
    <CardTitle>Dívida 2025</CardTitle>
    <div className="text-2xl text-amber-600">{totals.balance_2025} €</div>
    <div className="text-sm text-muted-foreground">Só deste ano</div>
  </Card>

  <Card className={totals.balance_total_real < 0 ? 'border-green-500' : 'border-red-500'}>
    <CardTitle>Balance Total</CardTitle>
    <div className={`text-2xl ${totals.balance_total_real < 0 ? 'text-green-600' : 'text-red-600'}`}>
      {totals.balance_total_real} €
    </div>
    <div className="text-sm text-muted-foreground">
      {totals.balance_total_real < 0 ? 'CRÉDITO' : 'DEVE'}
    </div>
  </Card>
</div>

{/* Card adicional para Crédito Anos Anteriores */}
{totals.opening_balance_total !== 0 && (
  <Card className="mt-4 bg-blue-50 dark:bg-blue-950">
    <CardContent className="flex items-center justify-between pt-6">
      <div>
        <p className="text-sm font-medium">Crédito Acumulado Anos Anteriores</p>
        <p className="text-xs text-muted-foreground">
          Pagamentos de anos anteriores que ainda não foram aplicados
        </p>
      </div>
      <div className="text-2xl font-bold text-blue-600">
        {Math.abs(totals.opening_balance_total)} €
      </div>
    </CardContent>
  </Card>
)}
```

### 2. Tabela de Condóminos

**Opção A: Mostrar Todas as Colunas**:
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Condómino</TableHead>
      <TableHead>Quota 2025</TableHead>
      <TableHead>Pago 2025</TableHead>
      <TableHead>Dívida 2025</TableHead>
      <TableHead>Crédito Anterior</TableHead>  {/* NOVO */}
      <TableHead>Balance Total</TableHead>  {/* NOVO */}
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {balances.map((member) => (
      <TableRow key={member.id}>
        <TableCell>{member.member_name}</TableCell>
        <TableCell>{member.quota_expected_annual} €</TableCell>
        <TableCell>{member.quota_paid_total} €</TableCell>
        <TableCell>{member.balance} €</TableCell>
        <TableCell className={member.opening_balance < 0 ? 'text-green-600' : 'text-red-600'}>
          {member.opening_balance} €
        </TableCell>
        <TableCell className={member.balance_total_real < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
          {member.balance_total_real} €
        </TableCell>
        <TableCell>
          {member.balance_total_real < 0 ? (
            <Badge variant="success">Crédito</Badge>
          ) : member.balance_total_real === 0 ? (
            <Badge variant="default">Al día</Badge>
          ) : (
            <Badge variant="destructive">Deve</Badge>
          )}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Opção B: Tooltip ou Expandible** (RECOMENDADO - mais limpo):
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Condómino</TableHead>
      <TableHead>Quota 2025</TableHead>
      <TableHead>Balance Total</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead></TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {balances.map((member) => (
      <React.Fragment key={member.id}>
        <TableRow>
          <TableCell>{member.member_name}</TableCell>
          <TableCell>{member.quota_expected_annual} €</TableCell>
          <TableCell className={member.balance_total_real < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {member.balance_total_real} €
            {member.opening_balance !== 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="inline ml-2 h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">Detalhe:</p>
                    <p>• Pago 2025: {member.quota_paid_total} €</p>
                    <p>• Dívida 2025: {member.balance} €</p>
                    <p className={member.opening_balance < 0 ? 'text-green-600' : 'text-red-600'}>
                      • Crédito Anos Anteriores: {member.opening_balance} €
                    </p>
                    <p className="font-bold">Balance Total: {member.balance_total_real} €</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </TableCell>
          <TableCell>
            {member.balance_total_real < 0 ? (
              <Badge variant="success">Crédito</Badge>
            ) : member.balance_total_real === 0 ? (
              <Badge variant="default">Al día</Badge>
            ) : (
              <Badge variant="destructive">Deve</Badge>
            )}
          </TableCell>
          <TableCell>
            <Button variant="ghost" size="sm" onClick={() => toggleExpand(member.id)}>
              {expandedRows.includes(member.id) ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Button>
          </TableCell>
        </TableRow>

        {/* Row expandida com detalhes */}
        {expandedRows.includes(member.id) && (
          <TableRow>
            <TableCell colSpan={5} className="bg-muted/30">
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Pago 2025</p>
                    <p className="text-lg">{member.quota_paid_total} €</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dívida 2025</p>
                    <p className="text-lg">{member.balance} €</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Crédito Anos Anteriores</p>
                    <p className={`text-lg ${member.opening_balance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {member.opening_balance} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium font-bold">Balance Total</p>
                    <p className={`text-xl font-bold ${member.balance_total_real < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {member.balance_total_real} €
                    </p>
                  </div>
                </div>
                {member.notes && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{member.notes}</p>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    ))}
  </TableBody>
</Table>
```

---

## 📊 Dados da API Atualizados

### Endpoint: `GET /api/financial-periods/2025/summary?building_id=xxx`

**Response NOVA** (com opening_balance):
```json
{
  "success": true,
  "data": {
    "period": {
      "id": "...",
      "year": 2025,
      "monthly_quota_150": "32.66",
      "monthly_quota_200": "43.54"
    },
    "balances": [
      {
        "id": "...",
        "member_id": "...",
        "member_name": "António Manuel Caroça Beirão",
        "fraction": "Fração E",
        "permilage": "200.0000",
        "quota_expected_annual": "522.48",
        "quota_paid_total": "0.00",
        "balance": "522.48",
        "opening_balance": "-487.62",  // ⬅️ NOVO!
        "balance_total_real": "34.86",  // ⬅️ NOVO!
        "status": "unpaid",
        "last_payment_date": null
      },
      {
        "member_name": "José Manuel Costa Ricardo",
        "quota_expected_annual": "391.92",
        "quota_paid_total": "0.00",
        "balance": "391.92",
        "opening_balance": "-1237.32",  // ⬅️ CRÉDITO GRANDE!
        "balance_total_real": "-845.40",  // ⬅️ TEM CRÉDITO!
        "status": "unpaid"
      }
      // ... outros membros
    ],
    "totals": {
      "expected_total": 2612.64,
      "paid_total": 1079.93,
      "balance_2025": 1750.53,  // ⬅️ Renomeado (antes balance_total)
      "opening_balance_total": -1956.31,  // ⬅️ NOVO!
      "balance_total_real": -205.78,  // ⬅️ NOVO!
      "members_count": 6,
      "paid_count": 1,
      "partial_count": 1,
      "unpaid_count": 4
    }
  }
}
```

---

## ✅ Checklist de Implementação Frontend

- [ ] Atualizar cards de resumo (4-6 cards em vez de 3)
- [ ] Adicionar card "Balance Total" com cor verde/vermelho
- [ ] Adicionar card "Crédito Anos Anteriores" (se != 0)
- [ ] Atualizar tabela de condóminos:
  - [ ] Opção A: Adicionar colunas "Crédito Anterior" e "Balance Total"
  - [ ] Opção B: Adicionar tooltip/expandible com detalhes (RECOMENDADO)
- [ ] Atualizar badges de estado:
  - [ ] "Crédito" (verde) se balance_total_real < 0
  - [ ] "Al día" (azul) se balance_total_real == 0
  - [ ] "Deve" (vermelho) se balance_total_real > 0
- [ ] Adicionar legenda explicativa:
  - [ ] "Dívida 2025: Quanto deve do ano corrente"
  - [ ] "Crédito Anterior: Pagos de anos anteriores"
  - [ ] "Balance Total: Situação real do condómino"

---

## 🎯 Resultado Esperado

Depois da atualização do frontend, quando user vir:

**José Manuel Costa Ricardo**:
- Quota 2025: 391,92 €
- Pago 2025: 0,00 €
- Dívida 2025: 391,92 €
- **Crédito Anos Anteriores: -1.237,32 €**
- **Balance Total: -845,40 € (CRÉDITO!) 💚**
- Estado: **Crédito** (badge verde)

Em vez de só ver:
- Balance: 391,92 € (Pendente) ❌ (parece que deve muito!)

---

**✅ API já está CORRIGIDA e a devolver os dados corretos!**
**⏳ Frontend precisa ser atualizado para mostrar opening_balance e balance_total_real**

---

**Última atualização**: 23 Novembro 2025
**API**: ✅ Corrigida
**Frontend**: ⏳ Pendente atualização
