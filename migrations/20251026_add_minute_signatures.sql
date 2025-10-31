-- Migration: Add minute_signatures table for legal compliance
-- Date: 2025-10-26
-- Purpose: Store digital signatures and rubrics for meeting minutes

-- Tabela para guardar assinaturas digitais e rubricas
CREATE TABLE IF NOT EXISTS minute_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  minute_id UUID NOT NULL REFERENCES minutes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Tipo de assinante
  signer_type VARCHAR(50) NOT NULL CHECK (signer_type IN ('president', 'secretary', 'member')),
  signer_name VARCHAR(255) NOT NULL,

  -- Assinaturas (Base64 PNG)
  signature TEXT, -- Assinatura completa (última página)
  rubric TEXT, -- Rubrica para páginas intermédias

  -- Assinatura com Chave Móvel Digital (CMD)
  cmd_signature TEXT, -- Token da assinatura CMD (se usada)
  cmd_timestamp TIMESTAMP, -- Timestamp da CMD
  cmd_certificate TEXT, -- Certificado digital da CMD

  -- Metadados de segurança
  signed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_minute_signatures_minute_id ON minute_signatures(minute_id);
CREATE INDEX IF NOT EXISTS idx_minute_signatures_signer_type ON minute_signatures(signer_type);

-- Comentários
COMMENT ON TABLE minute_signatures IS 'Assinaturas digitais e rubricas das actas (Art. 19º LPH)';
COMMENT ON COLUMN minute_signatures.signature IS 'Assinatura completa em Base64 PNG (última página)';
COMMENT ON COLUMN minute_signatures.rubric IS 'Rubrica em Base64 PNG (páginas intermédias)';
COMMENT ON COLUMN minute_signatures.cmd_signature IS 'Token de assinatura da Chave Móvel Digital';
