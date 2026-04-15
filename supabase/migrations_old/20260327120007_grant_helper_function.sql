-- ============================================================================
-- FIX: Conceder permissão para função helper
-- ============================================================================

GRANT EXECUTE ON FUNCTION is_profile_manager(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_profile_manager(UUID, UUID) TO anon;

COMMENT ON FUNCTION is_profile_manager IS 'Helper: verifica se usuário é manager (GRANTED to authenticated/anon)';
