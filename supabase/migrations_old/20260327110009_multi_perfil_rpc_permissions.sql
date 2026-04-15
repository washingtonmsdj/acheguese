-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - RPC PERMISSIONS
-- ============================================================================
-- Definir permissões explícitas e defensivas para todas as RPCs
-- ============================================================================

-- ============================================================================
-- RPCs DE USUÁRIO: Apenas authenticated
-- ============================================================================

-- create_profile_with_extension
REVOKE EXECUTE ON FUNCTION create_profile_with_extension FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_profile_with_extension FROM anon;
GRANT EXECUTE ON FUNCTION create_profile_with_extension TO authenticated;

-- transfer_profile_ownership
REVOKE EXECUTE ON FUNCTION transfer_profile_ownership FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION transfer_profile_ownership FROM anon;
GRANT EXECUTE ON FUNCTION transfer_profile_ownership TO authenticated;

-- delete_profile
REVOKE EXECUTE ON FUNCTION delete_profile FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION delete_profile FROM anon;
GRANT EXECUTE ON FUNCTION delete_profile TO authenticated;

-- update_profile_handle
REVOKE EXECUTE ON FUNCTION update_profile_handle FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_profile_handle FROM anon;
GRANT EXECUTE ON FUNCTION update_profile_handle TO authenticated;

-- ============================================================================
-- RPCs ADMIN: Apenas service_role
-- ============================================================================

-- verify_profile
REVOKE EXECUTE ON FUNCTION verify_profile FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION verify_profile FROM anon;
REVOKE EXECUTE ON FUNCTION verify_profile FROM authenticated;
GRANT EXECUTE ON FUNCTION verify_profile TO service_role;

-- suspend_profile
REVOKE EXECUTE ON FUNCTION suspend_profile FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION suspend_profile FROM anon;
REVOKE EXECUTE ON FUNCTION suspend_profile FROM authenticated;
GRANT EXECUTE ON FUNCTION suspend_profile TO service_role;

-- ============================================================================
-- RESUMO DE PERMISSÕES
-- ============================================================================

-- RPCs de usuário (authenticated):
-- - create_profile_with_extension
-- - transfer_profile_ownership
-- - delete_profile
-- - update_profile_handle

-- RPCs admin (service_role apenas):
-- - verify_profile
-- - suspend_profile

COMMENT ON FUNCTION create_profile_with_extension IS 'PERMISSION: authenticated only';
COMMENT ON FUNCTION transfer_profile_ownership IS 'PERMISSION: authenticated only';
COMMENT ON FUNCTION delete_profile IS 'PERMISSION: authenticated only';
COMMENT ON FUNCTION update_profile_handle IS 'PERMISSION: authenticated only';
COMMENT ON FUNCTION verify_profile IS 'PERMISSION: service_role only';
COMMENT ON FUNCTION suspend_profile IS 'PERMISSION: service_role only';
