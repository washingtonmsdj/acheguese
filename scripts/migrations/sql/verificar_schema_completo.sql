-- Verificar schema completo de posts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints de posts
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

-- Verificar schema completo de community_posts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há dados em community_posts
SELECT COUNT(*) as total FROM community_posts;

-- Verificar relação profiles
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'user_id')
ORDER BY ordinal_position;
