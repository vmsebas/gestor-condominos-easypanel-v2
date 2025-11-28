-- Migration: Create communication_logs table for tracking all communications
-- Date: 2025-11-22
-- Description: Sistema de tracking completo para todas as comunicações (cartas, convocatorias, actas)

-- Create communication_logs table
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  -- Tipo e canal
  communication_type VARCHAR(50) NOT NULL, -- 'convocatoria', 'acta', 'letter', 'quota', 'note'
  communication_subtype VARCHAR(50), -- Subtipo adicional se necessário
  channel VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'correio_certificado'

  -- Conteúdo
  subject TEXT NOT NULL,
  body_preview TEXT, -- Primeiros 200 caracteres do corpo

  -- PDF anexado
  pdf_url VARCHAR(255),
  pdf_filename VARCHAR(255),

  -- Relacionamentos com entidades específicas
  related_letter_id UUID REFERENCES sent_letters(id) ON DELETE SET NULL,
  related_convocatoria_id UUID REFERENCES convocatorias(id) ON DELETE SET NULL,
  related_minute_id UUID REFERENCES minutes(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Tracking de estados
  status VARCHAR(50) NOT NULL DEFAULT 'draft_created',
  -- Estados possíveis: draft_created, sent, delivered, opened, confirmed, failed

  draft_created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Error handling
  error_message TEXT,
  error_code VARCHAR(50),

  -- Metadata adicional (JSONB para flexibilidade)
  metadata JSONB DEFAULT '{}',
  -- Exemplos: { "ip": "85.245.xxx.xxx", "user_agent": "...", "tracking_id": "...", "email_client": "Gmail" }

  -- Timestamps padrão
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_communication_logs_building ON communication_logs(building_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_member ON communication_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_channel ON communication_logs(channel);
CREATE INDEX IF NOT EXISTS idx_communication_logs_status ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created ON communication_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_sent ON communication_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_deleted ON communication_logs(deleted_at) WHERE deleted_at IS NULL;

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_communication_logs_building_type ON communication_logs(building_id, communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_building_status ON communication_logs(building_id, status);
CREATE INDEX IF NOT EXISTS idx_communication_logs_member_created ON communication_logs(member_id, created_at DESC);

-- Trigger para updated_at (assumindo que a função já existe)
CREATE TRIGGER update_communication_logs_updated_at
  BEFORE UPDATE ON communication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE communication_logs IS 'Registo completo de todas as comunicações enviadas (cartas, convocatorias, actas, etc)';
COMMENT ON COLUMN communication_logs.status IS 'Estados: draft_created, sent, delivered, opened, confirmed, failed';
COMMENT ON COLUMN communication_logs.metadata IS 'JSONB com informação adicional: IP, user agent, tracking IDs, etc';
COMMENT ON COLUMN communication_logs.communication_type IS 'Tipo: convocatoria, acta, letter, quota, note';
COMMENT ON COLUMN communication_logs.channel IS 'Canal: email, whatsapp, correio_certificado';
