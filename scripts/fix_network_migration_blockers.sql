-- ============================================================================
-- CORREÇÃO DE BLOQUEADORES: Migration Rede/Filiais
-- Executar APENAS após validação e identificação de problemas
-- ============================================================================

\echo '============================================================================'
\echo 'CORREÇÃO DE BLOQUEADORES: Migration Rede/Filiais'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. CORRIGIR EMPRESAS SEM location_id
-- ============================================================================

\echo '1. CORRIGIR EMPRESAS SEM location_id'
\echo '------------------------------------'
\echo ''

-- Estratégia 1: Tentar inferir location_id do metadata.neighborhood + metadata.city
\echo 'Estratégia 1: Inferir location_id do metadata...'

WITH inferred_locations AS (
  SELECT 
    bd.profile_id,
    bd.business_name,
    bd.metadata->>'neighborhood' as neighborhood,
    bd.metadata->>'city' as city,
    l.id as inferred_location_id,
    l.full_name as inferred_location_name
  FROM business_data bd
  LEFT JOIN locations l ON 
    l.name ILIKE bd.metadata->>'neighborhood'
    AND l.type = 'district'
  WHERE bd.location_id IS NULL 
    AND bd.status != 'deleted'
    AND bd.metadata->>'neighborhood' IS NOT NULL
)
SELECT 
  profile_id,
  business_name,
  neighborhood,
  city,
  CASE 
    WHEN inferred_location_id IS NOT NULL THEN '✅ PODE CORRIGIR'
    ELSE '❌ MANUAL'
  END as status,
  inferred_location_name
FROM inferred_locations
ORDER BY inferred_location_id IS NOT NULL DESC
LIMIT 20;

\echo ''
\echo 'Para aplicar correção automática, execute:'
\echo ''
\echo 'UPDATE business_data bd'
\echo 'SET location_id = l.id'
\echo 'FROM locations l'
\echo 'WHERE bd.location_id IS NULL'
\echo '  AND bd.status != ''deleted'''
\echo '  AND bd.metadata->>''neighborhood'' IS NOT NULL'
\echo '  AND l.name ILIKE bd.metadata->>''neighborhood'''
\echo '  AND l.type = ''district'';'
\echo ''

-- Estratégia 2: Marcar como deleted se não puder inferir
\echo 'Estratégia 2: Empresas que não podem ser corrigidas...'

SELECT 
  COUNT(*) as empresas_sem_correcao
FROM business_data bd
WHERE bd.location_id IS NULL 
  AND bd.status != 'deleted'
  AND NOT EXISTS (
    SELECT 1 FROM locations l
    WHERE l.name ILIKE bd.metadata->>'neighborhood'
      AND l.type = 'district'
  );

\echo ''
\echo 'Para marcar como deleted, execute:'
\echo ''
\echo 'UPDATE business_data'
\echo 'SET status = ''deleted'', updated_at = NOW()'
\echo 'WHERE location_id IS NULL'
\echo '  AND status != ''deleted'''
\echo '  AND NOT EXISTS ('
\echo '    SELECT 1 FROM locations l'
\echo '    WHERE l.name ILIKE metadata->>''neighborhood'''
\echo '      AND l.type = ''district'''
\echo '  );'
\echo ''

-- ============================================================================
-- 2. CORRIGIR COLISÕES DE SLUG
-- ============================================================================

\echo '2. CORRIGIR COLISÕES DE SLUG'
\echo '----------------------------'
\echo ''

-- Identificar colisões e sugerir novos slugs
\echo 'Colisões identificadas e sugestões de correção:'

WITH duplicates AS (
  SELECT 
    location_id,
    slug,
    array_agg(profile_id ORDER BY created_at) as profile_ids,
    array_agg(business_name ORDER BY created_at) as business_names,
    array_agg(created_at ORDER BY created_at) as created_ats
  FROM business_data
  WHERE location_id IS NOT NULL 
    AND slug IS NOT NULL
    AND status != 'deleted'
  GROUP BY location_id, slug
  HAVING COUNT(*) > 1
),
suggestions AS (
  SELECT 
    d.location_id,
    d.slug as original_slug,
    l.full_name as bairro,
    unnest(d.profile_ids) as profile_id,
    unnest(d.business_names) as business_name,
    unnest(d.created_ats) as created_at,
    row_number() OVER (PARTITION BY d.location_id, d.slug ORDER BY unnest(d.created_ats)) as seq
  FROM duplicates d
  LEFT JOIN locations l ON l.id = d.location_id
)
SELECT 
  bairro,
  original_slug,
  business_name,
  CASE 
    WHEN seq = 1 THEN original_slug || ' (manter)'
    ELSE original_slug || '-' || seq
  END as suggested_slug,
  profile_id,
  created_at
FROM suggestions
ORDER BY bairro, original_slug, seq;

\echo ''
\echo '⚠️  AÇÃO MANUAL NECESSÁRIA:'
\echo '   1. Revisar sugestões acima'
\echo '   2. Para cada duplicata (seq > 1), executar:'
\echo ''
\echo '   -- Registrar histórico para redirect 308'
\echo '   INSERT INTO business_slug_history (profile_id, old_slug, old_canonical_url, changed_at)'
\echo '   VALUES (:profile_id, :old_slug, :old_url, NOW());'
\echo ''
\echo '   -- Atualizar slug'
\echo '   UPDATE business_data'
\echo '   SET slug = :new_slug, updated_at = NOW()'
\echo '   WHERE profile_id = :profile_id;'
\echo ''

-- ============================================================================
-- 3. GERAR SLUGS PARA EMPRESAS SEM SLUG
-- ============================================================================

\echo '3. GERAR SLUGS PARA EMPRESAS SEM SLUG'
\echo '-------------------------------------'
\echo ''

-- Sugerir slugs baseados no business_name
\echo 'Sugestões de slugs para empresas sem slug:'

WITH slug_suggestions AS (
  SELECT 
    profile_id,
    business_name,
    lower(
      regexp_replace(
        unaccent(business_name),
        '[^a-z0-9]+',
        '-',
        'g'
      )
    ) as suggested_slug
  FROM business_data
  WHERE slug IS NULL 
    AND status != 'deleted'
    AND business_name IS NOT NULL
  LIMIT 20
)
SELECT 
  business_name,
  suggested_slug,
  profile_id
FROM slug_suggestions;

\echo ''
\echo 'Para aplicar correção automática, execute:'
\echo ''
\echo 'UPDATE business_data'
\echo 'SET slug = lower('
\echo '  regexp_replace('
\echo '    unaccent(business_name),'
\echo '    ''[^a-z0-9]+'','
\echo '    ''-'','
\echo '    ''g'''
\echo '  )'
\echo '),'
\echo 'updated_at = NOW()'
\echo 'WHERE slug IS NULL'
\echo '  AND status != ''deleted'''
\echo '  AND business_name IS NOT NULL;'
\echo ''

-- ============================================================================
-- 4. CRIAR PROFILE_MEMBERS PARA EMPRESAS SEM ADMINS
-- ============================================================================

\echo '4. CRIAR PROFILE_MEMBERS PARA EMPRESAS SEM ADMINS'
\echo '-------------------------------------------------'
\echo ''

-- Identificar empresas sem profile_members
\echo 'Empresas sem profile_members:'

SELECT 
  bd.profile_id,
  bd.business_name,
  p.user_id,
  p.name as profile_name
FROM business_data bd
JOIN profiles p ON p.id = bd.profile_id
LEFT JOIN profile_members pm ON pm.profile_id = bd.profile_id
WHERE bd.status = 'active'
  AND pm.id IS NULL
LIMIT 20;

\echo ''
\echo 'Para criar profile_members automaticamente, execute:'
\echo ''
\echo 'INSERT INTO profile_members (profile_id, user_id, role)'
\echo 'SELECT DISTINCT'
\echo '  bd.profile_id,'
\echo '  p.user_id,'
\echo '  ''owner'''
\echo 'FROM business_data bd'
\echo 'JOIN profiles p ON p.id = bd.profile_id'
\echo 'LEFT JOIN profile_members pm ON pm.profile_id = bd.profile_id'
\echo 'WHERE bd.status = ''active'''
\echo '  AND pm.id IS NULL'
\echo 'ON CONFLICT (profile_id, user_id) DO NOTHING;'
\echo ''

-- ============================================================================
-- 5. RESUMO DE CORREÇÕES
-- ============================================================================

\echo '============================================================================'
\echo 'RESUMO DE CORREÇÕES'
\echo '============================================================================'
\echo ''
\echo 'Execute as correções na ordem:'
\echo '  1. Corrigir location_id (inferir ou marcar deleted)'
\echo '  2. Gerar slugs para empresas sem slug'
\echo '  3. Corrigir colisões de slug (MANUAL)'
\echo '  4. Criar profile_members para empresas sem admins'
\echo '  5. Re-executar validate_network_migration.sql'
\echo '  6. Se tudo OK, aplicar migration'
\echo ''
\echo '============================================================================'
