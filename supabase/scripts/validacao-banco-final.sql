-- ============================================================================
-- VALIDAÇÃO FINAL DO BANCO
-- Queries para evidenciar estrutura e dados
-- ============================================================================

-- 1. TABELAS E VIEWS
SELECT 
  schemaname, 
  tablename as nome,
  'table' as tipo
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'business_data', 'professional_data', 'driver_data', 'profile_members', 'profile_links')
UNION ALL
SELECT 
  schemaname,
  viewname as nome,
  'view' as tipo
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE 'public_%'
ORDER BY tipo, nome;

-- 2. FUNCTIONS/RPCs
SELECT 
  routine_name as nome,
  routine_type as tipo,
  security_type as seguranca
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE 'create_profile%'
    OR routine_name LIKE 'transfer_%'
    OR routine_name LIKE 'delete_profile%'
    OR routine_name LIKE 'admin_%'
  )
ORDER BY routine_name;

-- 3. POLICIES (RLS)
SELECT 
  tablename,
  policyname as nome,
  cmd as comando,
  qual as condicao
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'profile_members', 'profile_links')
ORDER BY tablename, policyname;

-- 4. TRIGGERS
SELECT 
  trigger_name as nome,
  event_object_table as tabela,
  action_statement as acao
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('profiles', 'business_data', 'professional_data', 'driver_data', 'profile_members')
ORDER BY event_object_table, trigger_name;

-- 5. CONSTRAINTS
SELECT 
  tc.table_name as tabela,
  tc.constraint_name as nome,
  tc.constraint_type as tipo
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'business_data', 'professional_data', 'driver_data', 'profile_members', 'profile_links')
  AND tc.constraint_type IN ('UNIQUE', 'CHECK')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 6. PERFIS EXISTENTES (SAMPLE)
SELECT 
  profile_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_public THEN 1 END) as publicos,
  COUNT(CASE WHEN is_active THEN 1 END) as ativos
FROM profiles
GROUP BY profile_type
ORDER BY profile_type;

-- 7. EXTENSÕES EXISTENTES
SELECT 
  'business_data' as extensao,
  COUNT(*) as total
FROM business_data
UNION ALL
SELECT 
  'professional_data' as extensao,
  COUNT(*) as total
FROM professional_data
UNION ALL
SELECT 
  'driver_data' as extensao,
  COUNT(*) as total
FROM driver_data;

-- 8. MEMBERS EXISTENTES
SELECT 
  p.profile_type,
  pm.role,
  COUNT(*) as total
FROM profile_members pm
JOIN profiles p ON p.id = pm.profile_id
GROUP BY p.profile_type, pm.role
ORDER BY p.profile_type, pm.role;

-- 9. LINKS EXISTENTES
SELECT 
  link_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_public THEN 1 END) as publicos
FROM profile_links
GROUP BY link_type
ORDER BY link_type;
