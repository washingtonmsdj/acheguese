-- ============================================
-- AUDITORIA QUANTITATIVA COMPLETA - POSTS
-- ============================================

-- 1. Cobertura de location_id em posts
SELECT '=== 1. COBERTURA location_id em posts ===' as secao;
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2)
  END as coverage_percent
FROM posts;

-- 2. Posts sem location_id por city/neighborhood
SELECT '=== 2. POSTS SEM location_id por city/neighborhood ===' as secao;
SELECT 
  city, 
  neighborhood, 
  COUNT(*) as count
FROM posts
WHERE location_id IS NULL
GROUP BY city, neighborhood
ORDER BY count DESC
LIMIT 20;

-- 3. Distribuição de tipos de posts
SELECT '=== 3. DISTRIBUIÇÃO DE TIPOS ===' as secao;
SELECT 
  type,
  COUNT(*) as count,
  CASE 
    WHEN (SELECT COUNT(*) FROM posts) = 0 THEN 0
    ELSE ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM posts), 2)
  END as percentage
FROM posts
GROUP BY type
ORDER BY count DESC;

-- 4. Cobertura de location_id em community_posts
SELECT '=== 4. COBERTURA location_id em community_posts ===' as secao;
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2)
  END as coverage_percent
FROM community_posts;

-- 5. Community posts sem location_id por city/neighborhood
SELECT '=== 5. COMMUNITY_POSTS SEM location_id ===' as secao;
SELECT 
  city, 
  neighborhood, 
  COUNT(*) as count
FROM community_posts
WHERE location_id IS NULL
GROUP BY city, neighborhood
ORDER BY count DESC
LIMIT 20;

-- 6. Validação de índice GIN para textSearch
SELECT '=== 6. ÍNDICES GIN para textSearch ===' as secao;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('posts', 'community_posts')
  AND (indexdef LIKE '%gin%' OR indexdef LIKE '%GIN%');

-- 7. Análise de duplicações - autor_id vs author_profile_id
SELECT '=== 7. DUPLICAÇÕES autor_id vs author_profile_id ===' as secao;
SELECT 
  COUNT(*) as posts_com_autor_id,
  COUNT(CASE WHEN author_profile_id IS NOT NULL THEN 1 END) as posts_com_author_profile_id,
  COUNT(CASE WHEN autor_id IS NOT NULL AND author_profile_id IS NOT NULL THEN 1 END) as posts_com_ambos
FROM posts;

-- 8. Análise de duplicações - texto vs content
SELECT '=== 8. DUPLICAÇÕES texto vs content ===' as secao;
SELECT 
  COUNT(CASE WHEN texto IS NOT NULL THEN 1 END) as posts_com_texto,
  COUNT(CASE WHEN content IS NOT NULL THEN 1 END) as posts_com_content,
  COUNT(CASE WHEN texto IS NOT NULL AND content IS NOT NULL THEN 1 END) as posts_com_ambos,
  COUNT(CASE WHEN texto IS NOT NULL AND content IS NOT NULL AND texto != content THEN 1 END) as posts_com_divergencia
FROM posts;

-- 9. Análise de duplicações - tipo_post vs type
SELECT '=== 9. DUPLICAÇÕES tipo_post vs type ===' as secao;
SELECT 
  COUNT(CASE WHEN tipo_post IS NOT NULL THEN 1 END) as posts_com_tipo_post,
  COUNT(CASE WHEN type IS NOT NULL THEN 1 END) as posts_com_type,
  COUNT(CASE WHEN tipo_post IS NOT NULL AND type IS NOT NULL THEN 1 END) as posts_com_ambos,
  COUNT(CASE WHEN tipo_post IS NOT NULL AND type IS NOT NULL AND tipo_post != type THEN 1 END) as posts_com_divergencia
FROM posts;

-- 10. Verificar colunas existentes em posts
SELECT '=== 10. COLUNAS EXISTENTES em posts ===' as secao;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Verificar colunas existentes em community_posts
SELECT '=== 11. COLUNAS EXISTENTES em community_posts ===' as secao;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;
