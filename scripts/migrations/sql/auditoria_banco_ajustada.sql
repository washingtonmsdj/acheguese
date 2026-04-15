-- ============================================
-- AUDITORIA QUANTITATIVA COMPLETA - POSTS
-- ============================================

-- 1. Cobertura de location_id em posts
SELECT 'COBERTURA location_id em posts' as secao;
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2)
  END as coverage_percent
FROM posts;

-- 2. Distribuição de tipos de posts
SELECT 'DISTRIBUICAO DE TIPOS' as secao;
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

-- 3. Cobertura de location_id em community_posts
SELECT 'COBERTURA location_id em community_posts' as secao;
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2)
  END as coverage_percent
FROM community_posts;

-- 4. Validação de índice GIN para textSearch
SELECT 'INDICES GIN para textSearch' as secao;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('posts', 'community_posts')
  AND (indexdef LIKE '%gin%' OR indexdef LIKE '%GIN%');

-- 5. Verificar colunas existentes em posts
SELECT 'COLUNAS EXISTENTES em posts' as secao;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar colunas existentes em community_posts
SELECT 'COLUNAS EXISTENTES em community_posts' as secao;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'community_posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;
