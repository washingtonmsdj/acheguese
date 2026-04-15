-- Verificar policies aplicadas em profile_links
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text[],
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profile_links'
ORDER BY policyname;
