-- Verificar schema REAL do banco linked (não migration)
-- 1. Colunas de posts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Constraints de posts
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'posts'
  AND tc.table_schema = 'public';

-- 3. Verificar se location_id tem FK
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'posts'
  AND kcu.column_name = 'location_id'
  AND tc.table_schema = 'public';

-- 4. Verificar RLS policies atuais
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'posts'
  AND schemaname = 'public';

-- 5. Contar posts
SELECT COUNT(*) as total_posts FROM posts;
