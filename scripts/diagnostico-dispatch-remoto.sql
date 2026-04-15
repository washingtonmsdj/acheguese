-- ============================================
-- DIAGNÓSTICO: VERDADE OPERACIONAL DO DISPATCH
-- ============================================
-- Objetivo: Descobrir se dispatch é automático ou manual no banco remoto

-- 1. TRIGGERS EM ride_requests
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'ride_requests'
ORDER BY trigger_name;

-- 2. FUNÇÕES SQL RELACIONADAS A DISPATCH
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name ILIKE '%dispatch%'
    OR routine_name ILIKE '%assign%'
    OR routine_name ILIKE '%driver%'
    OR routine_name ILIKE '%ride%'
  )
ORDER BY routine_name;

-- 3. EDGE FUNCTIONS (via pg_net ou supabase_functions)
-- Verificar se há invocações automáticas
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%net.http%'
ORDER BY routine_name;

-- 4. VERIFICAR AUTOMAÇÃO EM searching_driver -> driver_assigned
-- Buscar qualquer trigger/função que mude status automaticamente
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%searching_driver%'
    OR routine_definition ILIKE '%driver_assigned%'
  )
ORDER BY routine_name;

-- 5. VERIFICAR POLICIES DE ride_requests
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
WHERE tablename = 'ride_requests'
ORDER BY policyname;

-- 6. VERIFICAR POLICIES DE driver_availability
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
WHERE tablename = 'driver_availability'
ORDER BY policyname;
