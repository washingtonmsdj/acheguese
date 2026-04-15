-- Migration: Rename profile_id to seller_id in classifieds table
-- Description: Alinha nomenclatura com o código da aplicação
-- Date: 2026-03-26

-- Renomeia a coluna
ALTER TABLE classifieds RENAME COLUMN profile_id TO seller_id;

-- Atualiza o índice
DROP INDEX IF EXISTS idx_classifieds_profile_id;
CREATE INDEX idx_classifieds_seller_id ON classifieds(seller_id);

-- Atualiza a policy
DROP POLICY IF EXISTS "Owners manage own classifieds" ON classifieds;
CREATE POLICY "Owners manage own classifieds" ON classifieds 
  FOR ALL TO authenticated
  USING (seller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Comentário
COMMENT ON COLUMN classifieds.seller_id IS 'ID do perfil do vendedor';
