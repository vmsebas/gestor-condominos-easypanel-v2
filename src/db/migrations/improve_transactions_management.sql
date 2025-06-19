-- Mejorar la gestión de transacciones
-- Asegurar que existe la columna member_id en transactions (por si no existe)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'member_id') THEN
        ALTER TABLE transactions ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Crear índice para mejorar la performance
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);

-- Agregar columnas adicionales para mejor gestión de transacciones
DO $$ 
BEGIN 
    -- Campo para marcar si la transacción está confirmada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'is_confirmed') THEN
        ALTER TABLE transactions ADD COLUMN is_confirmed BOOLEAN DEFAULT true;
    END IF;
    
    -- Campo para tracking de cambios (audit trail)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'last_modified_by') THEN
        ALTER TABLE transactions ADD COLUMN last_modified_by VARCHAR(255);
    END IF;
    
    -- Campo para notas del administrador
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'admin_notes') THEN
        ALTER TABLE transactions ADD COLUMN admin_notes TEXT;
    END IF;
END $$;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN transactions.member_id IS 'ID del miembro asociado con esta transacción (opcional)';
COMMENT ON COLUMN transactions.is_confirmed IS 'Indica si la transacción está confirmada y no debe ser modificada';
COMMENT ON COLUMN transactions.last_modified_by IS 'Usuario que modificó la transacción por última vez';
COMMENT ON COLUMN transactions.admin_notes IS 'Notas administrativas sobre la transacción';