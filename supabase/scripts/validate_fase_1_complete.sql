-- ============================================================================
-- VALIDAÇÃO FASE 1 COMPLETA
-- ============================================================================
-- Verificar que todas as estruturas da Fase 1 foram aplicadas corretamente
-- ============================================================================

-- 1. Verificar extensões
SELECT 
  'EXTENSIONS' as check_type,
  extname as name,
  'OK' as status
FROM pg_extension 
WHERE extname IN ('citext', 'postgis')
ORDER BY extname;

-- 2. Verificar colunas adicionadas em profiles
SELECT 
  'PROFILES_COLUMNS' as check_type,
  column_name as name,
  data_type,
  CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULLABLE' END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('handle', 'profile_type', 'is_public', 'show_contact_email', 'show_phone', 'show_linked_profiles')
ORDER BY column_name;

-- 3. Verificar índices em profiles
SELECT 
  'PROFILES_INDEXES' as check_type,
  indexname as name,
  indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND indexname IN ('idx_profiles_handle', 'idx_profiles_type', 'idx_profiles_user_active', 'idx_profiles_public_active', 'unique_personal_per_user', 'unique_driver_per_user')
ORDER BY indexname;

-- 4. Verificar profile_members
SELECT 
  'PROFILE_MEMBERS' as check_type,
  column_name as name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profile_members'
  AND column_name IN ('role', 'permissions')
ORDER BY column_name;

-- 5. Verificar profile_links
SELECT 
  'PROFILE_LINKS' as check_type,
  'table_exists' as name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_links') 
    THEN 'OK' ELSE 'MISSING' END as status;

-- 6. Verificar business_data
SELECT 
  'BUSINESS_DATA' as check_type,
  column_name as name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'business_data'
  AND column_name IN ('show_business_links', 'business_category')
ORDER BY column_name;

-- 7. Verificar professional_data
SELECT 
  'PROFESSIONAL_DATA' as check_type,
  column_name as name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'professional_data'
  AND column_name IN ('show_professional_links', 'professional_category')
ORDER BY column_name;

-- 8. Verificar driver_data
SELECT 
  'DRIVER_DATA' as check_type,
  column_name as name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'driver_data'
ORDER BY column_name;

-- 9. Verificar admin_users
SELECT 
  'ADMIN_USERS' as check_type,
  'table_exists' as name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') 
    THEN 'OK' ELSE 'MISSING' END as status;

-- 10. Verificar profile_audit_log
SELECT 
  'PROFILE_AUDIT_LOG' as check_type,
  'table_exists' as name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_audit_log') 
    THEN 'OK' ELSE 'MISSING' END as status;

-- 11. Verificar triggers
SELECT 
  'TRIGGERS' as check_type,
  trigger_name as name,
  event_object_table as table_name
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND trigger_name IN (
    'validate_profile_handle_trigger',
    'validate_profile_type_trigger', 
    'enforce_business_data_profile_type',
    'enforce_professional_data_profile_type',
    'enforce_driver_data_profile_type'
  )
ORDER BY trigger_name;
