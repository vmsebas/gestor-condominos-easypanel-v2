-- Mejorar la relación entre documentos y miembros
-- Agregar campo para relacionar documentos con miembros específicos
ALTER TABLE documents 
ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- Crear índice para mejorar la performance de consultas
CREATE INDEX idx_documents_member_id ON documents(member_id);

-- Comentario para documentar el campo
COMMENT ON COLUMN documents.member_id IS 'ID del miembro asociado con este documento (opcional)';