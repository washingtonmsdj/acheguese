-- ============================================================================
-- DIAGNÓSTICO SQL COMPLETO - EXECUTAR NO SUPABASE DASHBOARD
-- ============================================================================
-- IMPORTANTE: Execute TODO este script e copie os resultados
-- ============================================================================

-- ============================================================================
-- 1. CONFIRMAR SE AS VIEWS EXISTEM NO BANCO REMOTO
-- ============================================================================

SELECT 
  table_schema, 
  table_name, 
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('public_business_search', 'public_professional_search')
ORDER BY table_name;

-- Resultado esperado:
-- public | public_business_search      | VIEW
-- public | public_professional_search  | VIEW

-- ============================================================================
-- 2. CONFIRMAR DEFINIÇÃO DAS VIEWS
-- ============================================================================

SELECT 
  schemaname, 
  viewname, 
  LEFT(definition, 200) as definition_preview
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('public_business_search', 'public_professional_search')
ORDER BY viewname;

-- Resultado esperado: Deve mostrar as definições das views

-- ============================================================================
-- 3. CONFIRMAR PERMISSÕES DAS VIEWS
-- ============================================================================

SELECT 
  grantee, 
  table_schema, 
  table_name, 
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('public_business_search', 'public_professional_search')
ORDER BY table_name, grantee, privilege_type;

-- Resultado esperado:
-- anon          | public | public_business_search      | SELECT
-- authenticated | public | public_business_search      | SELECT
-- anon          | public | public_professional_search  | SELECT
-- authenticated | public | public_professional_search  | SELECT

-- ============================================================================
-- 4. CONFIRMAR SE AS VIEWS RETORNAM DADOS
-- ============================================================================

-- Total de empresas
SELECT COUNT(*) as total_businesses 
FROM public.public_business_search;

-- Total de profissionais
SELECT COUNT(*) as total_professionals 
FROM public.public_professional_search;

-- Resultado esperado:
-- total_businesses: >= 3
-- total_professionals: >= 2

-- ============================================================================
-- 5. CONFIRMAR DADOS DA PITUBA
-- ============================================================================

-- Empresas na Pituba
SELECT 
  id, 
  profile_id, 
  business_name, 
  slug, 
  category, 
  is_premium, 
  has_active_gastronomy_profile,
  geographic_path
FROM public.public_business_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
ORDER BY business_name;

-- Profissionais na Pituba
SELECT 
  id, 
  profile_id, 
  professional_name, 
  slug, 
  service_category, 
  is_accepting_clients,
  geographic_path
FROM public.public_professional_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
ORDER BY professional_name;

-- Resultado esperado:
-- 3 empresas: mercadinho, consultoria, pizzaria
-- 2 profissionais: eletricista, encanador

-- ============================================================================
-- 6. VERIFICAR CONFIGURAÇÃO DO POSTGREST
-- ============================================================================

-- Verificar schemas expostos
SHOW pgrst.db_schemas;

-- Resultado esperado: deve incluir 'public'

-- ============================================================================
-- 7. RECARREGAR SCHEMA CACHE
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- Verificar notificações
SELECT pg_notification_queue_usage();

-- ============================================================================
-- RESUMO DO DIAGNÓSTICO
-- ============================================================================
-- Após executar este script, você deve ter:
-- 
-- ✅ Confirmado que as views existem
-- ✅ Confirmado que as views têm permissões corretas
-- ✅ Confirmado que as views retornam dados
-- ✅ Confirmado que os dados da Pituba existem
-- ✅ Recarregado o schema cache
-- 
-- PRÓXIMO PASSO:
-- Aguarde 15 segundos e execute: node scripts/test-queries-final.mjs
-- ============================================================================
