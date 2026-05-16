-- ============================================================================
-- VERIFICAR SE AS VIEWS FORAM CRIADAS
-- ============================================================================

-- 1. Verificar se as views existem
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('public_business_search', 'public_professional_search')
ORDER BY table_name;

-- 2. Verificar grants nas views
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('public_business_search', 'public_professional_search')
ORDER BY table_name, grantee, privilege_type;

-- 3. Testar as views diretamente
SELECT COUNT(*) as total_empresas
FROM public_business_search;

SELECT COUNT(*) as total_profissionais
FROM public_professional_search;

-- 4. Testar views com filtro de location
SELECT id, name, slug, category, is_premium, has_active_gastronomy_profile
FROM public_business_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

SELECT id, name, slug, category, is_accepting_clients
FROM public_professional_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

-- 5. Recarregar schema cache
NOTIFY pgrst, 'reload schema';

-- 6. Verificar notificações
SELECT pg_notification_queue_usage();
