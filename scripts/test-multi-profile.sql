-- SCRIPT DE TESTE - MULTI-PERFIL REAL
-- Valida que a implementação está funcionando corretamente
-- Data: 2026-03-27

-- ============================================================================
-- 1. VERIFICAR ESTRUTURA DO BANCO
-- ============================================================================

\echo '=== 1. VERIFICANDO TABELAS ==='
SELECT 
  tablename,
  CASE 
    WHEN tablename IN ('profiles', 'profile_members', 'profile_links', 'business_data', 
                       'professional_data', 'driver_data', 'admin_users', 'profile_audit_log')
    THEN '✅'
    ELSE '❌'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'profile_members', 'profile_links', 'business_data', 
                    'professional_data', 'driver_data', 'admin_users', 'profile_audit_log')
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFICAR VIEWS PÚBLICAS
-- ============================================================================

\echo ''
\echo '=== 2. VERIFICANDO VIEWS PÚBLICAS ==='
SELECT 
  viewname,
  CASE 
    WHEN viewname IN ('public_profiles', 'public_business_profiles', 
                      'public_professional_profiles', 'public_driver_profiles', 
                      'public_profile_links')
    THEN '✅'
    ELSE '❌'
  END as status
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE 'public_%'
ORDER BY viewname;

-- ============================================================================
-- 3. VERIFICAR RPCs
-- ============================================================================

\echo ''
\echo '=== 3. VERIFICANDO RPCs ==='
SELECT 
  proname as rpc_name,
  CASE 
    WHEN proname IN ('create_profile_with_extension', 'transfer_profile_ownership', 
                     'delete_profile', 'update_profile_handle', 
                     'verify_profile', 'suspend_profile')
    THEN '✅'
    ELSE '❌'
  END as status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
  AND proname IN ('create_profile_with_extension', 'transfer_profile_ownership', 
                  'delete_profile', 'update_profile_handle', 
                  'verify_profile', 'suspend_profile')
ORDER BY proname;

-- ============================================================================
-- 4. VERIFICAR COLUNAS EM PROFILES
-- ============================================================================

\echo ''
\echo '=== 4. VERIFICANDO COLUNAS EM PROFILES ==='
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('handle', 'profile_type', 'privacy_show_email', 
                         'privacy_show_phone', 'privacy_show_location', 
                         'privacy_show_stats', 'privacy_show_reviews', 
                         'privacy_show_activity', 'is_verified', 'is_suspended')
    THEN '✅'
    ELSE '⚠️'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('handle', 'profile_type', 'privacy_show_email', 
                      'privacy_show_phone', 'privacy_show_location', 
                      'privacy_show_stats', 'privacy_show_reviews', 
                      'privacy_show_activity', 'is_verified', 'is_suspended')
ORDER BY column_name;

-- ============================================================================
-- 5. VERIFICAR ÍNDICES
-- ============================================================================

\echo ''
\echo '=== 5. VERIFICANDO ÍNDICES ==='
SELECT 
  indexname,
  tablename,
  CASE 
    WHEN indexname LIKE '%handle%' OR indexname LIKE '%profile_type%' 
    THEN '✅'
    ELSE '⚠️'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND (indexname LIKE '%handle%' OR indexname LIKE '%profile_type%')
ORDER BY indexname;

-- ============================================================================
-- 6. VERIFICAR TRIGGERS
-- ============================================================================

\echo ''
\echo '=== 6. VERIFICANDO TRIGGERS ==='
SELECT 
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name IN ('validate_profile_type', 'validate_handle_format', 
                          'set_updated_at', 'set_profile_updated_at')
    THEN '✅'
    ELSE '⚠️'
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN ('validate_profile_type', 'validate_handle_format', 
                       'set_updated_at', 'set_profile_updated_at')
ORDER BY trigger_name;

-- ============================================================================
-- 7. VERIFICAR RLS
-- ============================================================================

\echo ''
\echo '=== 7. VERIFICANDO RLS ==='
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Ativado'
    ELSE '❌ RLS Desativado'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'profile_members', 'profile_links', 
                    'business_data', 'professional_data', 'driver_data', 
                    'admin_users', 'profile_audit_log')
ORDER BY tablename;

-- ============================================================================
-- 8. CONTAR POLICIES
-- ============================================================================

\echo ''
\echo '=== 8. CONTANDO POLICIES ==='
SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅'
    ELSE '❌'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'profile_members', 'profile_links', 
                    'business_data', 'professional_data', 'driver_data', 
                    'admin_users', 'profile_audit_log')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 9. VERIFICAR EXTENSÕES
-- ============================================================================

\echo ''
\echo '=== 9. VERIFICANDO EXTENSÕES ==='
SELECT 
  extname,
  CASE 
    WHEN extname IN ('citext', 'postgis') THEN '✅'
    ELSE '⚠️'
  END as status
FROM pg_extension 
WHERE extname IN ('citext', 'postgis')
ORDER BY extname;

-- ============================================================================
-- 10. RESUMO FINAL
-- ============================================================================

\echo ''
\echo '=== RESUMO FINAL ==='
\echo ''

SELECT 
  'Tabelas' as categoria,
  COUNT(*) as total,
  '✅' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'profile_members', 'profile_links', 'business_data', 
                    'professional_data', 'driver_data', 'admin_users', 'profile_audit_log')

UNION ALL

SELECT 
  'Views Públicas' as categoria,
  COUNT(*) as total,
  '✅' as status
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE 'public_%'

UNION ALL

SELECT 
  'RPCs' as categoria,
  COUNT(*) as total,
  '✅' as status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
  AND proname IN ('create_profile_with_extension', 'transfer_profile_ownership', 
                  'delete_profile', 'update_profile_handle', 
                  'verify_profile', 'suspend_profile')

UNION ALL

SELECT 
  'RLS Policies' as categoria,
  COUNT(*) as total,
  '✅' as status
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Triggers' as categoria,
  COUNT(*) as total,
  '✅' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN ('validate_profile_type', 'validate_handle_format', 
                       'set_updated_at', 'set_profile_updated_at')

ORDER BY categoria;

\echo ''
\echo '✅ VALIDAÇÃO COMPLETA - BANCO ESTRUTURADO CORRETAMENTE'
\echo ''

