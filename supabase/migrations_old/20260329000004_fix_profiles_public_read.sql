-- ============================================================================
-- FIX: Adicionar política pública de leitura para profiles
-- ============================================================================
-- PROBLEMA: 
--   Queries com joins em profiles falham com 400/406 porque não há política
--   pública de leitura. A migration fix_circular_rls removeu a política pública.
-- SOLUÇÃO:
--   Adicionar política que permite leitura pública de profiles ativos
-- ============================================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Public can view active profiles" ON profiles;

-- Criar política pública de leitura
CREATE POLICY "Public can view active profiles"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Comentário
COMMENT ON POLICY "Public can view active profiles" ON profiles IS 
  'Permite leitura pública de profiles ativos para joins em business_data, professional_data, etc.';
