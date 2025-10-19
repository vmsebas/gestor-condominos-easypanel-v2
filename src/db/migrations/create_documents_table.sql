-- Tabla para gestión de documentos digitales
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  
  -- Información del archivo
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(10) NOT NULL,
  
  -- Metadatos
  category VARCHAR(50) NOT NULL DEFAULT 'general', -- 'financial', 'legal', 'maintenance', 'meeting', 'general'
  subcategory VARCHAR(50),
  tags TEXT[], -- Array de tags para búsqueda
  description TEXT,
  
  -- Control de versiones
  version INTEGER DEFAULT 1,
  parent_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  is_current_version BOOLEAN DEFAULT true,
  
  -- Permisos y acceso
  visibility VARCHAR(20) DEFAULT 'building', -- 'public', 'building', 'members_only', 'admin_only'
  is_confidential BOOLEAN DEFAULT false,
  access_level VARCHAR(20) DEFAULT 'read', -- 'read', 'edit', 'admin'
  
  -- Auditoría
  uploaded_by VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  
  -- Índices para búsqueda
  search_vector tsvector,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_documents_building_id ON documents(building_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_documents_current_version ON documents(is_current_version) WHERE is_current_version = true;

-- Función para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar search_vector
DROP TRIGGER IF EXISTS update_document_search_trigger ON documents;
CREATE TRIGGER update_document_search_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

-- Tabla para compartir documentos con miembros específicos
CREATE TABLE IF NOT EXISTS document_shares (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'read', -- 'read', 'edit'
  shared_by VARCHAR(100),
  shared_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  UNIQUE(document_id, member_id)
);

-- Tabla para categorías personalizadas
CREATE TABLE IF NOT EXISTS document_categories (
  id SERIAL PRIMARY KEY,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Color hex para UI
  icon VARCHAR(50) DEFAULT 'folder', -- Nombre del icono
  parent_category_id INTEGER REFERENCES document_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(building_id, name)
);

-- Insertar categorías por defecto
INSERT INTO document_categories (building_id, name, description, color, icon) 
SELECT 
  b.id,
  category.name,
  category.description,
  category.color,
  category.icon
FROM buildings b
CROSS JOIN (
  VALUES 
    ('Financiero', 'Documentos financieros y contables', '#10b981', 'calculator'),
    ('Legal', 'Contratos, normativas y documentos legales', '#f59e0b', 'scale'),
    ('Manutenção', 'Relatórios e documentos de manutenção', '#8b5cf6', 'wrench'),
    ('Reuniones', 'Actas, convocatorias y documentos de reuniones', '#3b82f6', 'users'),
    ('Seguros', 'Pólizas y documentos de seguros', '#ef4444', 'shield'),
    ('Correspondencia', 'Cartas y comunicaciones oficiales', '#06b6d4', 'mail'),
    ('Planos', 'Planos técnicos y arquitectónicos', '#84cc16', 'blueprint'),
    ('General', 'Documentos generales del condominio', '#6b7280', 'folder')
) AS category(name, description, color, icon)
ON CONFLICT (building_id, name) DO NOTHING;