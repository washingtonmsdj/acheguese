-- ============================================================================
-- FIX: Remover policies legadas que permitem acesso amplo
-- ============================================================================
-- PROBLEMA: Policy "Active profiles viewable" permite anon/auth ver todos perfis
-- SOLUÇÃO: Remover policy legada
-- ============================================================================

DROP POLICY IF EXISTS "Active profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Users manage own profiles" ON profiles;

COMMENT ON TABLE profiles IS 'Multi-perfil: policies legadas removidas (apenas RLS multi-perfil)';
