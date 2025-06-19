-- Agregar segunda dirección opcional para miembros
ALTER TABLE members 
ADD COLUMN secondary_address TEXT,
ADD COLUMN secondary_postal_code VARCHAR(10),
ADD COLUMN secondary_city VARCHAR(100),
ADD COLUMN secondary_country VARCHAR(100) DEFAULT 'Portugal';

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN members.secondary_address IS 'Dirección alternativa si no vive en el edificio';
COMMENT ON COLUMN members.secondary_postal_code IS 'Código postal de la dirección alternativa';
COMMENT ON COLUMN members.secondary_city IS 'Ciudad de la dirección alternativa';
COMMENT ON COLUMN members.secondary_country IS 'País de la dirección alternativa';