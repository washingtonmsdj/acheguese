-- ============================================================================
-- VALIDAÇÃO PRÉ-MIGRAÇÃO - FASE 1
-- ============================================================================
-- Executar ANTES de aplicar as migrations da Fase 1
-- Identifica conflitos e dados que precisam de correção
--
-- NOTA: Referenciado em scripts/apply_fase_1.ps1 como pré-validação.
-- Mantido no lugar por essa dependência.
-- As migrations da Fase 1 já foram aplicadas — este script é histórico.
-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 1: Profile Types'
\echo '========================================='

SELECT 
  'Profile Types Existentes' as check_name,
  profile_type,
  COUNT(*) as count
FROM profiles
GROUP BY profile_type
ORDER BY count DESC;

\echo ''
\echo 'Resultado esperado: apenas personal, business, professional, driver'
\echo 'Ação se houver outros: corrigir antes de aplicar migrations'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 2: Múltiplos Personal/Driver'
\echo '========================================='

SELECT 
  'Múltiplos Personal por User' as check_name,
  user_id,
  COUNT(*) as count
FROM profiles
WHERE profile_type = 'personal'
GROUP BY user_id
HAVING COUNT(*) > 1;

SELECT 
  'Múltiplos Driver por User' as check_name,
  user_id,
  COUNT(*) as count
FROM profiles
WHERE profile_type = 'driver'
GROUP BY user_id
HAVING COUNT(*) > 1;

\echo ''
\echo 'Resultado esperado: 0 rows em ambas as queries'
\echo 'Ação se houver duplicatas: decidir qual manter antes de aplicar migration 3'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 3: Membros Inválidos'
\echo '========================================='

SELECT 
  'Membros em Personal/Driver' as check_name,
  pm.id,
  pm.profile_id,
  p.profile_type,
  pm.user_id,
  pm.role
FROM profile_members pm
JOIN profiles p ON pm.profile_id = p.id
WHERE p.profile_type IN ('personal', 'driver');

\echo ''
\echo 'Resultado esperado: 0 rows'
\echo 'Ação se houver membros: remover antes de aplicar migration 6'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 4: Extensões Disponíveis'
\echo '========================================='

SELECT 
  'Extensão PostGIS' as check_name,
  name,
  installed_version,
  CASE 
    WHEN installed_version IS NOT NULL THEN 'JÁ INSTALADA'
    ELSE 'DISPONÍVEL PARA INSTALAÇÃO'
  END as status
FROM pg_available_extensions
WHERE name = 'postgis';

SELECT 
  'Extensão CITEXT' as check_name,
  name,
  installed_version,
  CASE 
    WHEN installed_version IS NOT NULL THEN 'JÁ INSTALADA'
    ELSE 'DISPONÍVEL PARA INSTALAÇÃO'
  END as status
FROM pg_available_extensions
WHERE name = 'citext';

\echo ''
\echo 'Resultado esperado: ambas disponíveis'
\echo 'Ação se não disponível: verificar com DBA/Supabase'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 5: Handles Existentes'
\echo '========================================='

SELECT 
  'Profiles com Handle' as check_name,
  COUNT(*) as count
FROM profiles
WHERE handle IS NOT NULL;

SELECT 
  'Profiles sem Handle' as check_name,
  COUNT(*) as count
FROM profiles
WHERE handle IS NULL;

\echo ''
\echo 'Info: Profiles sem handle precisarão de migração posterior (Fase 8)'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 6: Tabelas Existentes'
\echo '========================================='

SELECT 
  'Tabelas que serão alteradas' as check_name,
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'profile_members', 'business_data', 'professional_data') 
    THEN 'SERÁ ALTERADA'
    ELSE 'OK'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'profile_members', 'business_data', 'professional_data', 
                     'profile_links', 'driver_data', 'admin_users', 'profile_audit_log')
ORDER BY table_name;

\echo ''
\echo 'Info: Tabelas marcadas como SERÁ ALTERADA receberão novos campos'
\echo 'Info: Tabelas não listadas serão criadas'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 7: Owners Múltiplos'
\echo '========================================='

SELECT 
  'Perfis com múltiplos owners' as check_name,
  profile_id,
  COUNT(*) as owner_count
FROM profile_members
WHERE role = 'owner'
GROUP BY profile_id
HAVING COUNT(*) > 1;

\echo ''
\echo 'Resultado esperado: 0 rows'
\echo 'Ação se houver múltiplos: decidir owner único antes de aplicar migration 4'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÃO 8: Business/Professional sem Profile Type'
\echo '========================================='

SELECT 
  'Business Data sem profile_type correto' as check_name,
  bd.id,
  bd.profile_id,
  p.profile_type
FROM business_data bd
JOIN profiles p ON bd.profile_id = p.id
WHERE p.profile_type != 'business' OR p.profile_type IS NULL;

SELECT 
  'Professional Data sem profile_type correto' as check_name,
  pd.id,
  pd.profile_id,
  p.profile_type
FROM professional_data pd
JOIN profiles p ON pd.profile_id = p.id
WHERE p.profile_type != 'professional' OR p.profile_type IS NULL;

\echo ''
\echo 'Resultado esperado: 0 rows em ambas'
\echo 'Ação se houver inconsistências: corrigir profile_type antes de aplicar migrations 7 e 8'
\echo ''

-- ============================================================================

\echo '========================================='
\echo 'RESUMO DA VALIDAÇÃO'
\echo '========================================='
\echo ''
\echo 'Se todas as validações passaram:'
\echo '  ✓ Pode aplicar as migrations com segurança'
\echo ''
\echo 'Se alguma validação falhou:'
\echo '  ✗ Corrigir os dados ANTES de aplicar as migrations'
\echo '  ✗ Consultar FASE_1_ENTREGA.md seção E e G para detalhes'
\echo ''
\echo 'Próximo passo após validação OK:'
\echo '  supabase db push'
\echo ''
\echo '========================================='
