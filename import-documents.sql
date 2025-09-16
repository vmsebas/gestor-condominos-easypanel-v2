-- Import documents separately
BEGIN;

-- Create sample documents
INSERT INTO documents (building_id, member_id, name, original_name, file_path, file_size, mime_type, file_extension, category, description, uploaded_by, created_at, updated_at)
VALUES 
  (
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Regulamento do Condomínio',
    'regulamento_condominio_2025.pdf',
    '/documents/regulamento_condominio_2025.pdf',
    524288,
    'application/pdf',
    'pdf',
    'legal',
    'Regulamento interno do condomínio aprovado em assembleia',
    'admin@example.com',
    '2025-01-15 10:00:00',
    '2025-01-15 10:00:00'
  ),
  (
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Ata Assembleia Nº 28',
    'ata_assembleia_28_2025.pdf',
    '/documents/ata_assembleia_28_2025.pdf',
    312456,
    'application/pdf',
    'pdf',
    'minutes',
    'Ata da assembleia ordinária número 28 realizada em 10/02/2025',
    'admin@example.com',
    '2025-02-11 09:30:00',
    '2025-02-11 09:30:00'
  ),
  (
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Orçamento 2025',
    'orcamento_2025_aprovado.xlsx',
    '/documents/orcamento_2025_aprovado.xlsx',
    45678,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsx',
    'financial',
    'Orçamento aprovado para o exercício de 2025',
    'admin@example.com',
    '2025-02-10 15:00:00',
    '2025-02-10 15:00:00'
  ),
  (
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Contrato Limpeza',
    'contrato_limpeza_2025.pdf',
    '/documents/contrato_limpeza_2025.pdf',
    234567,
    'application/pdf',
    'pdf',
    'contracts',
    'Contrato com empresa de limpeza para 2025',
    'admin@example.com',
    '2025-01-05 11:00:00',
    '2025-01-05 11:00:00'
  ),
  (
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Apólice de Seguro',
    'apolice_seguro_2025.pdf',
    '/documents/apolice_seguro_2025.pdf',
    456789,
    'application/pdf',
    'pdf',
    'insurance',
    'Apólice de seguro multirriscos do condomínio',
    'admin@example.com',
    '2025-01-10 14:30:00',
    '2025-01-10 14:30:00'
  );

-- Verify import
DO $$
DECLARE
  v_documents_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_documents_count FROM documents;
  
  RAISE NOTICE '✅ Documentos importados: %', v_documents_count;
END $$;

COMMIT;