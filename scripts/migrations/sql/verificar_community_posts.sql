-- Verificar se community_posts existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'community_posts'
) as community_posts_exists;

-- Se existir, verificar dados
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) THEN
    RAISE NOTICE 'community_posts existe';
  ELSE
    RAISE NOTICE 'community_posts NAO existe';
  END IF;
END $$;
