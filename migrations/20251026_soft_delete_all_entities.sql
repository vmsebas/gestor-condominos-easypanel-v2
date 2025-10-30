/**
 * Migration: Soft Delete para todas as entidades principais
 *
 * Adiciona campos deleted_at e deleted_by a todas as tabelas principais
 * para permitir "eliminação" lógica em vez de física.
 *
 * Isto permite:
 * - Ver histórico de registos eliminados
 * - Restaurar registos se necessário
 * - Auditoria completa de eliminações
 * - Conformidade com RGPD (direito ao esquecimento vs. auditoria)
 */

-- =========================================
-- 1. CONVOCATORIAS
-- =========================================
ALTER TABLE convocatorias
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN convocatorias.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN convocatorias.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- 2. MINUTES (ACTAS)
-- =========================================
ALTER TABLE minutes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN minutes.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN minutes.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- 3. MEMBERS (CONDÓMINOS)
-- =========================================
ALTER TABLE members
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN members.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN members.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- 4. TRANSACTIONS (MOVIMENTOS FINANCEIROS)
-- =========================================
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN transactions.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN transactions.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- 5. COMMUNICATION_LOGS (COMUNICAÇÕES)
-- =========================================
ALTER TABLE communication_logs
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN communication_logs.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN communication_logs.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- 6. DOCUMENTS
-- =========================================
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN documents.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN documents.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- 7. TASKS (TAREFAS)
-- =========================================
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN tasks.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN tasks.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- 8. BUILDINGS (EDIFÍCIOS)
-- =========================================
ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

COMMENT ON COLUMN buildings.deleted_at IS 'Data de eliminação lógica (soft delete)';
COMMENT ON COLUMN buildings.deleted_by IS 'Utilizador que eliminou o registo';

-- =========================================
-- ÍNDICES para melhorar performance de queries com deleted_at
-- =========================================
CREATE INDEX IF NOT EXISTS idx_convocatorias_deleted_at ON convocatorias(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_minutes_deleted_at ON minutes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON members(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communication_logs_deleted_at ON communication_logs(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_buildings_deleted_at ON buildings(deleted_at) WHERE deleted_at IS NULL;

-- =========================================
-- VIEWS para facilitar acesso aos registos ativos
-- =========================================

-- Vista de convocatorias ativas
CREATE OR REPLACE VIEW active_convocatorias AS
SELECT * FROM convocatorias WHERE deleted_at IS NULL;

-- Vista de actas ativas
CREATE OR REPLACE VIEW active_minutes AS
SELECT * FROM minutes WHERE deleted_at IS NULL;

-- Vista de membros ativos
CREATE OR REPLACE VIEW active_members AS
SELECT * FROM members WHERE deleted_at IS NULL;

-- Vista de transações ativas
CREATE OR REPLACE VIEW active_transactions AS
SELECT * FROM transactions WHERE deleted_at IS NULL;

-- Vista de comunicações ativas
CREATE OR REPLACE VIEW active_communication_logs AS
SELECT * FROM communication_logs WHERE deleted_at IS NULL;

-- Vista de documentos ativos
CREATE OR REPLACE VIEW active_documents AS
SELECT * FROM documents WHERE deleted_at IS NULL;

-- Vista de tarefas ativas
CREATE OR REPLACE VIEW active_tasks AS
SELECT * FROM tasks WHERE deleted_at IS NULL;

-- Vista de edifícios ativos
CREATE OR REPLACE VIEW active_buildings AS
SELECT * FROM buildings WHERE deleted_at IS NULL;

-- =========================================
-- FUNCTION para restaurar registos
-- =========================================
CREATE OR REPLACE FUNCTION restore_record(
  table_name TEXT,
  record_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  query TEXT;
BEGIN
  -- Validar nome da tabela (segurança)
  IF table_name NOT IN (
    'convocatorias', 'minutes', 'members', 'transactions',
    'communication_logs', 'documents', 'tasks', 'buildings'
  ) THEN
    RAISE EXCEPTION 'Tabela não suportada: %', table_name;
  END IF;

  -- Construir e executar query de restauro
  query := format(
    'UPDATE %I SET deleted_at = NULL, deleted_by = NULL WHERE id = $1',
    table_name
  );

  EXECUTE query USING record_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_record IS 'Restaura um registo eliminado logicamente (soft delete)';

-- =========================================
-- FUNCTION para obter estatísticas de histórico
-- =========================================
CREATE OR REPLACE FUNCTION get_deleted_stats(building_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  entity_type TEXT,
  total_deleted BIGINT,
  deleted_last_30_days BIGINT,
  oldest_deletion TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'convocatorias'::TEXT,
         COUNT(*),
         COUNT(*) FILTER (WHERE deleted_at > NOW() - INTERVAL '30 days'),
         MIN(deleted_at)
  FROM convocatorias
  WHERE deleted_at IS NOT NULL
    AND (building_id_param IS NULL OR building_id = building_id_param)

  UNION ALL

  SELECT 'minutes'::TEXT,
         COUNT(*),
         COUNT(*) FILTER (WHERE deleted_at > NOW() - INTERVAL '30 days'),
         MIN(deleted_at)
  FROM minutes
  WHERE deleted_at IS NOT NULL
    AND (building_id_param IS NULL OR building_id = building_id_param)

  UNION ALL

  SELECT 'members'::TEXT,
         COUNT(*),
         COUNT(*) FILTER (WHERE deleted_at > NOW() - INTERVAL '30 days'),
         MIN(deleted_at)
  FROM members
  WHERE deleted_at IS NOT NULL
    AND (building_id_param IS NULL OR building_id = building_id_param)

  UNION ALL

  SELECT 'transactions'::TEXT,
         COUNT(*),
         COUNT(*) FILTER (WHERE deleted_at > NOW() - INTERVAL '30 days'),
         MIN(deleted_at)
  FROM transactions
  WHERE deleted_at IS NOT NULL
    AND (building_id_param IS NULL OR building_id = building_id_param)

  UNION ALL

  SELECT 'communication_logs'::TEXT,
         COUNT(*),
         COUNT(*) FILTER (WHERE deleted_at > NOW() - INTERVAL '30 days'),
         MIN(deleted_at)
  FROM communication_logs
  WHERE deleted_at IS NOT NULL
    AND (building_id_param IS NULL OR building_id = building_id_param)

  UNION ALL

  SELECT 'documents'::TEXT,
         COUNT(*),
         COUNT(*) FILTER (WHERE deleted_at > NOW() - INTERVAL '30 days'),
         MIN(deleted_at)
  FROM documents
  WHERE deleted_at IS NOT NULL
    AND (building_id_param IS NULL OR building_id = building_id_param)

  UNION ALL

  SELECT 'tasks'::TEXT,
         COUNT(*),
         COUNT(*) FILTER (WHERE deleted_at > NOW() - INTERVAL '30 days'),
         MIN(deleted_at)
  FROM tasks
  WHERE deleted_at IS NOT NULL
    AND (building_id_param IS NULL OR building_id = building_id_param);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_deleted_stats IS 'Obtém estatísticas de registos eliminados (soft delete)';
