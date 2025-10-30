# 🗑️ Opções de Proteção para Eliminação de Actas e Convocatorias

## 🔍 Problema Atual

**Erro**: Ao tentar eliminar Acta #31
- ❌ **401 Unauthorized** - Sem permissões adequadas
- ❌ **400 Bad Request** - Violação de foreign keys (6 tabelas dependentes)

### Tabelas Dependentes:
1. `attendance_sheets` - Folhas de presença
2. `meeting_members` - Membros presentes
3. `minute_agenda_items` - Pontos da ordem do dia
4. `tasks` - Tarefas relacionadas
5. `communication_logs` - Logs de comunicação
6. `minute_signatures` - Assinaturas digitais

---

## 📋 5 Opções de Proteção (do mais simples ao mais seguro)

### **OPÇÃO 1**: Soft Delete (Recomendada) ⭐

**Como funciona:**
- Não elimina os dados fisicamente da BD
- Marca como "eliminado" com timestamp
- Permite recuperação fácil
- Mantém histórico e auditoria completa

**Implementação:**
```sql
-- Adicionar campos
ALTER TABLE minutes ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE minutes ADD COLUMN deleted_by UUID REFERENCES users(id);

-- Ao "eliminar"
UPDATE minutes
SET deleted_at = NOW(), deleted_by = $user_id
WHERE id = $acta_id;

-- Nas queries
SELECT * FROM minutes WHERE deleted_at IS NULL;
```

**Frontend:**
```typescript
// Botão "Eliminar" muda para "Arquivar"
// Dialog de confirmação simples:
"Arquivar esta acta? Poderá restaurá-la posteriormente."
```

**Vantagens:**
- ✅ Seguro - não perde dados
- ✅ Reversível - pode restaurar
- ✅ Rápido de implementar
- ✅ Mantém integridade referencial
- ✅ Auditoria completa

**Desvantagens:**
- ⚠️ BD cresce ao longo do tempo
- ⚠️ Precisa criar UI para "restaurar"

---

### **OPÇÃO 2**: Confirmação com Código PIN

**Como funciona:**
- Utilizador deve introduzir código numérico correto
- Código definido nas configurações do utilizador
- Validação no backend

**Implementação:**

**BD:**
```sql
ALTER TABLE users ADD COLUMN deletion_pin VARCHAR(6);
```

**Frontend:**
```typescript
// Dialog de confirmação
const DeleteActaDialog = () => {
  const [pin, setPin] = useState('');

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>⚠️ Eliminar Acta #31</DialogTitle>
          <DialogDescription>
            Esta ação eliminará PERMANENTEMENTE:
            - A acta e todos os seus dados
            - 3 pontos da ordem do dia
            - 1 folha de presença
            - Todas as assinaturas digitais
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Esta ação NÃO PODE SER REVERTIDA!
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Label>Introduza o seu PIN para confirmar:</Label>
          <Input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="******"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(pin)}
            disabled={pin.length !== 6}
          >
            Eliminar Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Backend:**
```javascript
router.delete('/:id/confirm', authenticate, async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;
  const userId = req.user.id;

  // Validar PIN
  const user = await pool.query(
    'SELECT deletion_pin FROM users WHERE id = $1',
    [userId]
  );

  if (user.rows[0].deletion_pin !== pin) {
    return errorResponse(res, 'PIN incorreto', 401);
  }

  // Eliminar em transação
  await deleteMinuteWithDependencies(id);

  return successResponse(res, { message: 'Acta eliminada' });
});
```

**Vantagens:**
- ✅ Proteção adicional contra eliminação acidental
- ✅ Fácil de usar
- ✅ Rápido

**Desvantagens:**
- ⚠️ Utilizador pode esquecer o PIN
- ⚠️ PIN pode ser partilhado
- ⚠️ Eliminação é permanente

---

### **OPÇÃO 3**: Confirmação com Palavra de Segurança

**Como funciona:**
- Utilizador deve escrever uma palavra específica para confirmar
- Exemplos: "ELIMINAR", "CONFIRMAR", ou nome da acta

**Implementação:**

**Frontend:**
```typescript
const DeleteActaDialog = () => {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = `ELIMINAR ACTA 31`;

  return (
    <Dialog>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Acta #31 Permanentemente
          </DialogTitle>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            <strong>Esta ação é PERMANENTE e IRREVERSÍVEL!</strong>
            <br />
            Será eliminado:
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>Acta e todos os seus dados</li>
              <li>3 pontos da ordem do dia com votações</li>
              <li>Folha de presença</li>
              <li>Todas as assinaturas digitais</li>
              <li>Histórico e logs relacionados</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label>
            Para confirmar, escreva exatamente:
            <code className="block mt-1 p-2 bg-muted rounded text-sm">
              {expectedText}
            </code>
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Escreva aqui..."
            autoComplete="off"
          />
          {confirmText && confirmText !== expectedText && (
            <p className="text-sm text-destructive">
              ⚠️ Texto não corresponde. Verifique maiúsculas.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={confirmText !== expectedText}
          >
            Eliminar Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Vantagens:**
- ✅ Utilizador lê e confirma o que vai ser eliminado
- ✅ Reduz eliminações acidentais
- ✅ Não precisa memorizar códigos

**Desvantagens:**
- ⚠️ Pode ser aborrecido de escrever
- ⚠️ Eliminação é permanente

---

### **OPÇÃO 4**: Período de Quarentena (Papelera) ⭐⭐

**Como funciona:**
- Ao "eliminar", move para "Papelera" (quarentena) por 30 dias
- Durante esse período, pode restaurar
- Após 30 dias, eliminação automática permanente

**Implementação:**

**BD:**
```sql
-- Adicionar campos
ALTER TABLE minutes ADD COLUMN trashed_at TIMESTAMP;
ALTER TABLE minutes ADD COLUMN trashed_by UUID REFERENCES users(id);
ALTER TABLE minutes ADD COLUMN auto_delete_at TIMESTAMP;

-- Trigger para auto-delete após 30 dias
CREATE OR REPLACE FUNCTION auto_delete_trashed_minutes()
RETURNS void AS $$
BEGIN
  DELETE FROM minutes
  WHERE auto_delete_at IS NOT NULL
    AND auto_delete_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Frontend:**
```typescript
// Vista "Papelera"
const PapeleraView = () => {
  const trashedMinutes = useTrashedMinutes();

  return (
    <div>
      <h2>🗑️ Papelera de Actas</h2>
      <p className="text-sm text-muted-foreground">
        As actas aqui listadas serão eliminadas permanentemente após 30 dias.
      </p>

      {trashedMinutes.map(minute => (
        <Card key={minute.id}>
          <CardHeader>
            <CardTitle>Acta #{minute.minute_number}</CardTitle>
            <CardDescription>
              Eliminada há {formatDistanceToNow(minute.trashed_at)} por {minute.trashed_by_name}
              <br />
              <strong className="text-destructive">
                Eliminação permanente em: {format(minute.auto_delete_at, 'dd/MM/yyyy HH:mm')}
              </strong>
            </CardDescription>
          </CardHeader>
          <CardFooter className="space-x-2">
            <Button onClick={() => restoreMinute(minute.id)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletePermanently(minute.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Agora
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
```

**Backend:**
```javascript
// Endpoint "eliminar" (move para papelera)
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await pool.query(`
    UPDATE minutes
    SET
      trashed_at = NOW(),
      trashed_by = $1,
      auto_delete_at = NOW() + INTERVAL '30 days'
    WHERE id = $2
  `, [userId, id]);

  return successResponse(res, {
    message: 'Acta movida para a papelera. Será eliminada permanentemente em 30 dias.'
  });
});

// Endpoint restaurar
router.post('/:id/restore', authenticate, async (req, res) => {
  const { id } = req.params;

  await pool.query(`
    UPDATE minutes
    SET
      trashed_at = NULL,
      trashed_by = NULL,
      auto_delete_at = NULL
    WHERE id = $1
  `, [id]);

  return successResponse(res, { message: 'Acta restaurada com sucesso' });
});
```

**Vantagens:**
- ✅ Seguro - permite recuperação
- ✅ Elimina automaticamente dados antigos
- ✅ UX familiar (como email)
- ✅ Reduz erros

**Desvantagens:**
- ⚠️ Mais complexo de implementar
- ⚠️ Precisa job agendado para limpeza

---

### **OPÇÃO 5**: Proteção Multi-Nível (Máxima Segurança) 🔒

**Como funciona:**
- Combina múltiplas proteções:
  1. Verificação de permissões (só admin/manager)
  2. Verificação de estado (só pode eliminar drafts)
  3. Confirmação com palavra-passe
  4. Período de quarentena de 7 dias
  5. Log de auditoria completo

**Implementação:**

**Backend:**
```javascript
router.delete('/:id', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user.id;

    // 1. Verificar acta existe e carregar dados
    const minuteResult = await client.query(
      'SELECT * FROM minutes WHERE id = $1',
      [id]
    );

    if (minuteResult.rows.length === 0) {
      return errorResponse(res, 'Acta não encontrada', 404);
    }

    const minute = minuteResult.rows[0];

    // 2. Verificar estado (só pode eliminar drafts)
    if (minute.status !== 'draft') {
      return errorResponse(
        res,
        'Não é possível eliminar actas finalizadas. Estado: ' + minute.status,
        403
      );
    }

    // 3. Verificar se tem assinaturas
    const signaturesResult = await client.query(
      'SELECT COUNT(*) as count FROM minute_signatures WHERE minute_id = $1',
      [id]
    );

    if (parseInt(signaturesResult.rows[0].count) > 0) {
      return errorResponse(
        res,
        'Não é possível eliminar actas com assinaturas. Tem ' +
        signaturesResult.rows[0].count + ' assinatura(s).',
        403
      );
    }

    // 4. Validar palavra-passe do utilizador
    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const isPasswordValid = await bcrypt.compare(
      password,
      userResult.rows[0].password_hash
    );

    if (!isPasswordValid) {
      return errorResponse(res, 'Palavra-passe incorreta', 401);
    }

    // 5. Mover para quarentena (não eliminar ainda)
    await client.query(`
      UPDATE minutes
      SET
        trashed_at = NOW(),
        trashed_by = $1,
        auto_delete_at = NOW() + INTERVAL '7 days',
        status = 'trashed'
      WHERE id = $2
    `, [userId, id]);

    // 6. Log de auditoria
    await client.query(`
      INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      ) VALUES ($1, 'DELETE_MINUTE', 'minutes', $2, $3, NOW())
    `, [
      userId,
      id,
      JSON.stringify({
        minute_number: minute.minute_number,
        building_id: minute.building_id,
        reason: 'User requested deletion'
      })
    ]);

    await client.query('COMMIT');

    return successResponse(res, {
      message: 'Acta movida para a papelera. Será eliminada permanentemente em 7 dias.',
      can_restore_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});
```

**Frontend:**
```typescript
const DeleteActaDialog = ({ minute }: { minute: Minute }) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const expectedText = `ELIMINAR ${minute.minute_number}`;

  return (
    <Dialog>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            🔒 Eliminação Protegida
          </DialogTitle>
        </DialogHeader>

        {/* Verificações de segurança */}
        <div className="space-y-4">
          {/* 1. Estado */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Estado: <Badge>{minute.status}</Badge>
              {minute.status === 'draft' && ' (Pode ser eliminada)'}
            </AlertDescription>
          </Alert>

          {/* 2. Assinaturas */}
          {minute.signatures_count > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ❌ Esta acta tem {minute.signatures_count} assinatura(s) e NÃO pode ser eliminada.
              </AlertDescription>
            </Alert>
          )}

          {/* 3. Confirmação de texto */}
          <div>
            <Label>Escreva: <code>{expectedText}</code></Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          {/* 4. Palavra-passe */}
          <div>
            <Label>Palavra-passe da conta:</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Aviso */}
          <Alert>
            <AlertDescription>
              A acta será movida para a Papelera e eliminada permanentemente em 7 dias.
              Pode restaurá-la durante esse período.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={
              confirmText !== expectedText ||
              !password ||
              minute.signatures_count > 0
            }
            onClick={() => onConfirm(password)}
          >
            Mover para Papelera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Vantagens:**
- ✅ Máxima segurança
- ✅ Múltiplas verificações
- ✅ Auditoria completa
- ✅ Recuperação possível

**Desvantagens:**
- ⚠️ Complexo de implementar
- ⚠️ UX mais lenta
- ⚠️ Pode ser demasiado restritivo

---

## 🎯 Recomendação Final

### **Para o teu caso, recomendo: OPÇÃO 2 + OPÇÃO 4**

**Combinação ideal:**
1. **Soft Delete com Papelera** (Opção 4)
   - Elimina para papelera por defeito
   - 30 dias para recuperar
   - Limpeza automática

2. **PIN para eliminação permanente** (Opção 2)
   - Quando quiser eliminar permanentemente da papelera
   - Pede PIN de confirmação

**Fluxo:**
```
Utilizador clica "Eliminar Acta"
  ↓
Move para Papelera (sem confirmação, é reversível)
  ↓
Mostra mensagem: "Acta movida para Papelera. Eliminação permanente em 30 dias."
  ↓
[Se quiser eliminar AGORA da papelera]
  ↓
Dialog: "Introduza PIN para eliminação permanente"
  ↓
Validação + Eliminação CASCADE de todas as dependências
```

---

## 🔧 Próximos Passos

Qual opção preferes implementar? Ou quer uma combinação?

Posso implementar qualquer uma dessas opções agora! 🚀
