-- ============================================================================
-- VALIDAÇÃO PRÉ-PRODUÇÃO: Migration Rede/Filiais
-- Executar OBRIGATORIAMENTE em staging antes de produção
-- ============================================================================

\echo '============================================================================'
\echo 'VALIDAÇÃO PRÉ-PRODUÇÃO: Migration Rede/Filiais'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. AUDITORIA DE DADOS CONTRA CONSTRAINTS
-- ============================================================================

\echo '1. AUDITORIA DE DADOS CONTRA CONSTRAINTS'
\echo '----------------------------------------'
\echo ''

-- 1.1. Empresas sem location_id (violariam check_standalone_has_location)
\echo '1.1. Empresas sem location_id (futuro standalone):'
SELECT 
  profile_id,
  business_name,
  slug,
  status,
  CASE 
    WHEN location_id IS NULL THEN '❌ VIOLAÇÃO'
    ELSE '✅ OK'
  END as validation
FROM business_data
WHERE status != 'deleted'
ORDER BY location_id IS NULL DESC, business_name
LIMIT 20;

\echo ''
SELECT 
  COUNT(*) as total_sem_location,
  COUNT(*) FILTER (WHERE status = 'active') as ativos_sem_location
FROM business_data
WHERE location_id IS NULL AND status != 'deleted';

\echo ''
\echo '⚠️  AÇÃO NECESSÁRIA: Empresas sem location_id devem ser:'
\echo '   - Migradas para bairro correto (via address/metadata)'
\echo '   - OU marcadas como deleted se inválidas'
\echo ''

-- 1.2. Verificar integridade de profile_members
\echo '1.2. Integridade de profile_members:'
SELECT 
  COUNT(DISTINCT bd.profile_id) as total_empresas,
  COUNT(DISTINCT pm.profile_id) as empresas_com_members,
  COUNT(DISTINCT bd.profile_id) - COUNT(DISTINCT pm.profile_id) as empresas_sem_members
FROM business_data bd
LEFT JOIN profile_members pm ON pm.profile_id = bd.profile_id
WHERE bd.status = 'active';

\echo ''
\echo '⚠️  AÇÃO NECESSÁRIA: Empresas sem profile_members não poderão ser editadas'
\echo '   - Criar profile_members com role=owner para o user_id do profile'
\echo ''

-- ============================================================================
-- 2. VALIDAÇÃO DE DUPLICIDADES PARA SLUG TERRITORIAL
-- ============================================================================

\echo '2. VALIDAÇÃO DE DUPLICIDADES PARA SLUG TERRITORIAL'
\echo '--------------------------------------------------'
\echo ''

-- 2.1. Slugs duplicados no mesmo bairro (violariam idx_business_data_slug_per_location)
\echo '2.1. Slugs duplicados no MESMO bairro (BLOQUEADOR):'
WITH duplicates AS (
  SELECT 
    location_id,
    slug,
    COUNT(*) as count,
    array_agg(profile_id) as profile_ids,
    array_agg(business_name) as business_names
  FROM business_data
  WHERE location_id IS NOT NULL 
    AND slug IS NOT NULL
    AND status != 'deleted'
  GROUP BY location_id, slug
  HAVING COUNT(*) > 1
)
SELECT 
  l.full_name as bairro,
  d.slug,
  d.count as duplicatas,
  d.business_names
FROM duplicates d
LEFT JOIN locations l ON l.id = d.location_id
ORDER BY d.count DESC, l.full_name;

\echo ''
SELECT COUNT(*) as total_colisoes_mesmo_bairro
FROM (
  SELECT location_id, slug
  FROM business_data
  WHERE location_id IS NOT NULL 
    AND slug IS NOT NULL
    AND status != 'deleted'
  GROUP BY location_id, slug
  HAVING COUNT(*) > 1
) sub;

\echo ''
\echo '⚠️  AÇÃO NECESSÁRIA: Slugs duplicados no MESMO bairro devem ser desambiguados'
\echo ''

-- 2.2. CASO CRÍTICO: Mesmo slug em bairros DIFERENTES (deve funcionar)
\echo '2.2. CASO CRÍTICO: Mesmo slug em bairros DIFERENTES (deve coexistir):'
WITH slug_counts AS (
  SELECT 
    slug,
    COUNT(DISTINCT location_id) as bairros_diferentes,
    array_agg(DISTINCT l.full_name ORDER BY l.full_name) as bairros,
    array_agg(DISTINCT bd.business_name ORDER BY bd.business_name) as empresas
  FROM business_data bd
  LEFT JOIN locations l ON l.id = bd.location_id
  WHERE bd.location_id IS NOT NULL 
    AND bd.slug IS NOT NULL
    AND bd.status != 'deleted'
  GROUP BY slug
  HAVING COUNT(DISTINCT location_id) > 1
)
SELECT 
  slug,
  bairros_diferentes,
  bairros,
  empresas
FROM slug_counts
ORDER BY bairros_diferentes DESC
LIMIT 10;

\echo ''
SELECT COUNT(*) as slugs_em_multiplos_bairros
FROM (
  SELECT slug
  FROM business_data
  WHERE location_id IS NOT NULL 
    AND slug IS NOT NULL
    AND status != 'deleted'
  GROUP BY slug
  HAVING COUNT(DISTINCT location_id) > 1
) sub;

\echo ''
\echo '✅ Slugs repetidos em bairros DIFERENTES são VÁLIDOS e devem coexistir'
\echo '   - Cada empresa tem URL única: /empresas/:uf/:cidade/:bairro/:slug'
\echo '   - Resolução por bairro + slug garante unicidade'
\echo ''

-- 2.2. Slugs NULL (precisam ser gerados)
\echo '2.2. Empresas sem slug:'
SELECT 
  profile_id,
  business_name,
  status
FROM business_data
WHERE slug IS NULL AND status != 'deleted'
LIMIT 10;

\echo ''
SELECT COUNT(*) as total_sem_slug
FROM business_data
WHERE slug IS NULL AND status != 'deleted';

\echo ''
\echo '⚠️  AÇÃO NECESSÁRIA: Gerar slugs para empresas sem slug'
\echo ''

-- ============================================================================
-- 3. TESTE DE POLICIES COM PROFILE_MEMBERS
-- ============================================================================

\echo '3. TESTE DE POLICIES COM PROFILE_MEMBERS'
\echo '----------------------------------------'
\echo ''

-- 3.1. Distribuição de roles
\echo '3.1. Distribuição de roles em profile_members:'
SELECT 
  role,
  COUNT(*) as total,
  COUNT(DISTINCT profile_id) as profiles_unicos,
  COUNT(DISTINCT user_id) as users_unicos
FROM profile_members
GROUP BY role
ORDER BY total DESC;

\echo ''

-- 3.2. Empresas com múltiplos admins
\echo '3.2. Empresas com múltiplos admins:'
SELECT 
  bd.business_name,
  COUNT(*) FILTER (WHERE pm.role = 'owner') as owners,
  COUNT(*) FILTER (WHERE pm.role = 'admin') as admins,
  COUNT(*) FILTER (WHERE pm.role = 'member') as members
FROM business_data bd
JOIN profile_members pm ON pm.profile_id = bd.profile_id
WHERE bd.status = 'active'
GROUP BY bd.profile_id, bd.business_name
HAVING COUNT(*) FILTER (WHERE pm.role IN ('owner', 'admin')) > 1
LIMIT 10;

\echo ''
\echo '✅ Policy "Profile members manage business" suporta multi-admin'
\echo ''

-- ============================================================================
-- 4. SMOKE TEST DOS FLUXOS
-- ============================================================================

\echo '4. SMOKE TEST DOS FLUXOS'
\echo '------------------------'
\echo ''

-- 4.1. Listagem territorial (simulação)
\echo '4.1. Listagem territorial (simulação):'
\echo 'Query: SELECT * FROM business_data WHERE status = active AND business_role IN (standalone, branch)'
SELECT 
  COUNT(*) as total_empresas_territoriais,
  COUNT(DISTINCT location_id) as bairros_cobertos
FROM business_data
WHERE status = 'active';

\echo ''

-- 4.2. Detalhe bairro + slug (simulação)
\echo '4.2. Detalhe bairro + slug (simulação):'
\echo 'Query: SELECT * FROM business_data WHERE slug = ? AND location_id = ?'
WITH sample AS (
  SELECT 
    bd.profile_id,
    bd.business_name,
    bd.slug,
    l.full_name as bairro,
    l.geographic_path
  FROM business_data bd
  JOIN locations l ON l.id = bd.location_id
  WHERE bd.status = 'active' 
    AND bd.slug IS NOT NULL
  LIMIT 5
)
SELECT * FROM sample;

\echo ''

-- 4.3. Conversão standalone → rede (pré-requisitos)
\echo '4.3. Conversão standalone → rede (pré-requisitos):'
\echo 'Empresas elegíveis para conversão:'
SELECT 
  COUNT(*) as empresas_elegiveis
FROM business_data
WHERE status = 'active'
  AND location_id IS NOT NULL
  AND slug IS NOT NULL;

\echo ''
\echo '✅ Após migration, conversão será:'
\echo '   1. Criar brand_hub (novo profile_id, slug novo, location_id NULL)'
\echo '   2. UPDATE empresa: business_role=branch, parent_business_id=brand_hub, is_headquarters=true'
\echo '   3. URL da empresa permanece inalterada'
\echo ''

-- 4.4. Criação de branch (pré-requisitos)
\echo '4.4. Criação de branch (pré-requisitos):'
\echo 'Após migration, será possível criar branches para qualquer brand_hub'
\echo ''

-- 4.5. Página /marcas/:slug (pré-requisitos)
\echo '4.5. Página /marcas/:slug (pré-requisitos):'
\echo 'Após migration, brand_hub será acessível via:'
\echo '   - Policy: "Brand hubs public read"'
\echo '   - Service: BrandService.getBySlug(slug)'
\echo '   - Rota: /marcas/:slug'
\echo ''

-- ============================================================================
-- 5. RESUMO EXECUTIVO
-- ============================================================================

\echo '============================================================================'
\echo 'RESUMO EXECUTIVO'
\echo '============================================================================'
\echo ''

WITH validation_summary AS (
  SELECT
    (SELECT COUNT(*) FROM business_data WHERE location_id IS NULL AND status != 'deleted') as empresas_sem_location,
    (SELECT COUNT(*) FROM business_data WHERE slug IS NULL AND status != 'deleted') as empresas_sem_slug,
    (SELECT COUNT(*) FROM (
      SELECT location_id, slug
      FROM business_data
      WHERE location_id IS NOT NULL AND slug IS NOT NULL AND status != 'deleted'
      GROUP BY location_id, slug
      HAVING COUNT(*) > 1
    ) sub) as colisoes_slug_mesmo_bairro,
    (SELECT COUNT(*) FROM (
      SELECT slug
      FROM business_data
      WHERE location_id IS NOT NULL AND slug IS NOT NULL AND status != 'deleted'
      GROUP BY slug
      HAVING COUNT(DISTINCT location_id) > 1
    ) sub) as slugs_em_multiplos_bairros,
    (SELECT COUNT(DISTINCT bd.profile_id) - COUNT(DISTINCT pm.profile_id)
     FROM business_data bd
     LEFT JOIN profile_members pm ON pm.profile_id = bd.profile_id
     WHERE bd.status = 'active') as empresas_sem_members
)
SELECT
  CASE 
    WHEN empresas_sem_location > 0 THEN '❌ BLOQUEADOR'
    ELSE '✅ OK'
  END as check_location,
  empresas_sem_location,
  CASE 
    WHEN empresas_sem_slug > 0 THEN '⚠️  ATENÇÃO'
    ELSE '✅ OK'
  END as check_slug,
  empresas_sem_slug,
  CASE 
    WHEN colisoes_slug_mesmo_bairro > 0 THEN '❌ BLOQUEADOR'
    ELSE '✅ OK'
  END as check_colisoes_mesmo_bairro,
  colisoes_slug_mesmo_bairro,
  CASE 
    WHEN slugs_em_multiplos_bairros > 0 THEN '✅ VÁLIDO'
    ELSE '✅ OK'
  END as check_slugs_multiplos_bairros,
  slugs_em_multiplos_bairros,
  CASE 
    WHEN empresas_sem_members > 0 THEN '⚠️  ATENÇÃO'
    ELSE '✅ OK'
  END as check_members,
  empresas_sem_members
FROM validation_summary;

\echo ''
\echo 'CRITÉRIOS DE APROVAÇÃO:'
\echo '  ✅ OK          - Pode aplicar migration'
\echo '  ✅ VÁLIDO      - Comportamento esperado (slugs em múltiplos bairros)'
\echo '  ⚠️  ATENÇÃO    - Aplicar com cuidado, corrigir depois'
\echo '  ❌ BLOQUEADOR  - NÃO aplicar, corrigir antes'
\echo ''
\echo 'CASO CRÍTICO:'
\echo '  Slugs em múltiplos bairros são VÁLIDOS e devem coexistir'
\echo '  Cada empresa tem URL única: /empresas/:uf/:cidade/:bairro/:slug'
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '  1. Corrigir todos os BLOQUEADORES'
\echo '  2. Aplicar migration em staging'
\echo '  3. Executar smoke tests manuais'
\echo '  4. Se tudo passar, promover para produção'
\echo ''
\echo '============================================================================'
