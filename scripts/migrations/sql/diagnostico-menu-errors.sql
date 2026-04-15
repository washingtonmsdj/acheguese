-- Diagnóstico dos erros 400 do Menu
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função get_active_promotions existe
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_active_promotions';

-- 2. Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('menus', 'menu_categories', 'menu_items', 'menu_promotions');

-- 3. Verificar RLS nas tabelas de menu
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'menu%';

-- 4. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'menu%'
ORDER BY tablename, policyname;

-- 5. Testar a função diretamente (substitua pelo ID do seu negócio)
-- SELECT * FROM get_active_promotions('mock-biz-burger'::uuid);

-- 6. Verificar se há dados nas tabelas
SELECT 
  'menus' as table_name, 
  COUNT(*) as row_count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM menus
UNION ALL
SELECT 
  'menu_categories', 
  COUNT(*),
  COUNT(CASE WHEN is_active THEN 1 END)
FROM menu_categories
UNION ALL
SELECT 
  'menu_items', 
  COUNT(*),
  COUNT(CASE WHEN is_active THEN 1 END)
FROM menu_items
UNION ALL
SELECT 
  'menu_promotions', 
  COUNT(*),
  COUNT(CASE WHEN is_active THEN 1 END)
FROM menu_promotions;
