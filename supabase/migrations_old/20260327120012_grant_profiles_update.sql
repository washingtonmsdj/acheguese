-- ============================================================================
-- FIX: Conceder acesso UPDATE em profiles
-- ============================================================================

GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT ON profiles TO authenticated;
GRANT DELETE ON profiles TO authenticated;

COMMENT ON TABLE profiles IS 'Multi-perfil: tabela base (SELECT/UPDATE/INSERT/DELETE granted)';
