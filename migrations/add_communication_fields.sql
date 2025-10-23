-- Migration: Add communication fields and logging table
-- Date: 2025-07-21
-- Purpose: Enable email/WhatsApp communication with legal compliance tracking

-- Add communication consent and WhatsApp fields to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS email_consent BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS email_consent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE members ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS whatsapp_consent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS preferred_communication VARCHAR(20) DEFAULT 'email'; -- 'email', 'whatsapp', 'both'

COMMENT ON COLUMN members.email_consent IS 'Consentimento para comunicações por email (Lei n.º 8/2022)';
COMMENT ON COLUMN members.email_consent_date IS 'Data do consentimento para email';
COMMENT ON COLUMN members.whatsapp_number IS 'Número WhatsApp com código país (+351...)';
COMMENT ON COLUMN members.whatsapp_consent IS 'Consentimento para comunicações informais por WhatsApp';
COMMENT ON COLUMN members.whatsapp_consent_date IS 'Data do consentimento para WhatsApp';

-- Create communication logs table for tracking all communications
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  -- Communication type and details
  communication_type VARCHAR(50) NOT NULL, -- 'convocatoria', 'acta', 'quota', 'note', 'letter'
  communication_subtype VARCHAR(50), -- 'ordinary', 'extraordinary', 'monthly', 'annual', etc.
  channel VARCHAR(20) NOT NULL, -- 'email', 'whatsapp'

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'draft_created', -- 'draft_created', 'sent', 'opened', 'confirmed', 'failed'

  -- Content and metadata
  subject TEXT,
  body_preview TEXT, -- First 200 chars for reference
  full_content TEXT, -- Complete message content
  pdf_url TEXT, -- URL or path to generated PDF
  pdf_filename VARCHAR(255),

  -- Related entities
  related_convocatoria_id UUID REFERENCES convocatorias(id) ON DELETE SET NULL,
  related_minute_id UUID REFERENCES minutes(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Tracking timestamps
  draft_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Additional metadata (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_logs_member_id ON communication_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_building_id ON communication_logs(building_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_status ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_communication_logs_channel ON communication_logs(channel);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at ON communication_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_convocatoria ON communication_logs(related_convocatoria_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_minute ON communication_logs(related_minute_id);

-- Add comments for documentation
COMMENT ON TABLE communication_logs IS 'Registo de todas as comunicações enviadas aos condóminos (email, WhatsApp, etc.)';
COMMENT ON COLUMN communication_logs.communication_type IS 'Tipo de comunicação: convocatoria, acta, quota, note, letter';
COMMENT ON COLUMN communication_logs.channel IS 'Canal utilizado: email ou whatsapp';
COMMENT ON COLUMN communication_logs.status IS 'Estado: draft_created, sent, opened, confirmed, failed';
COMMENT ON COLUMN communication_logs.metadata IS 'Dados adicionais em formato JSON (flexível para diferentes tipos de comunicação)';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_communication_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_communication_logs_updated_at ON communication_logs;
CREATE TRIGGER trigger_communication_logs_updated_at
  BEFORE UPDATE ON communication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_logs_updated_at();

-- Sample data: Mark existing members with email consent (if they have email)
UPDATE members
SET
  email_consent = true,
  email_consent_date = CURRENT_TIMESTAMP
WHERE
  email IS NOT NULL
  AND email != ''
  AND email_consent IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Added communication fields to members table';
  RAISE NOTICE 'Created communication_logs table';
  RAISE NOTICE 'Updated existing members with email consent';
END $$;
