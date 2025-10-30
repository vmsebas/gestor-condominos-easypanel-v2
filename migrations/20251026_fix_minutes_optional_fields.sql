/**
 * Migration: Fix Minutes Table - Make president_name and secretary_name nullable
 *
 * Problema: Quando se cria uma acta a partir de uma convocatoria,
 * ainda não se sabe quem será o Presidente e Secretário da mesa.
 * Estes campos devem ser preenchidos durante o workflow da acta.
 *
 * Solução: Tornar os campos nullable e adicionar valores default vazios
 * para permitir a criação da acta antes de ter esta informação.
 */

-- Tornar president_name nullable
ALTER TABLE minutes
ALTER COLUMN president_name DROP NOT NULL;

-- Tornar secretary_name nullable
ALTER TABLE minutes
ALTER COLUMN secretary_name DROP NOT NULL;

-- Comentário sobre os campos
COMMENT ON COLUMN minutes.president_name IS 'Nome do Presidente da mesa (preenchido durante o workflow)';
COMMENT ON COLUMN minutes.secretary_name IS 'Nome do Secretário da mesa (preenchido durante o workflow)';
