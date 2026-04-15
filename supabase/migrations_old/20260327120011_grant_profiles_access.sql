-- ============================================================================
-- FIX: Conceder acesso SELECT em profiles para policies funcionarem
-- ============================================================================

GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

COMMENT ON TABLE profiles IS 'Multi-perfil: tabela base (SELECT granted para policies)';
