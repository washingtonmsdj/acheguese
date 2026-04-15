-- ============================================================================
-- PRÉ-CHECK STAGING: Migration Rede/Filiais
-- Executar antes de aplicar 20260331000002
-- ============================================================================

-- 1. Verificar se colunas já existem (idempotência)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'business_data'
  AND column_name IN ('business_role', 'parent_business_id', 'is_headquarters', 'unit_name')
ORDER BY column_name;

-- 2. Empresas sem location_id (violaria check_standalone_has_location)
SELECT COUNT(*) AS empresas_sem_location
FROM business_data
WHERE location_id IS NULL AND status != 'deleted';

-- 3. Colisões de slug no mesmo bairro (violaria idx_business_data_slug_per_location)
SELECT location_id, slug, COUNT(*) AS duplicatas
FROM business_data
WHERE location_id IS NOT NULL
  AND slug IS NOT NULL
  AND status != 'deleted'
GROUP BY location_id, slug
HAVING COUNT(*) > 1;

-- 4. Empresas sem profile_members (não poderão editar após migration)
SELECT COUNT(*) AS empresas_sem_members
FROM business_data bd
LEFT JOIN profile_members pm ON pm.profile_id = bd.profile_id
WHERE bd.status = 'active'
  AND pm.id IS NULL;

-- 5. Total de empresas ativas
SELECT COUNT(*) AS total_empresas_ativas
FROM business_data
WHERE status = 'active';

-- 6. Verificar se profile_members existe
SELECT COUNT(*) AS total_members
FROM profile_members;
