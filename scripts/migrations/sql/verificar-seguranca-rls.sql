-- Verificação de Segurança: RLS e Perfis

-- ============================================
-- 1. VERIFICAR PERFIS DO USUÁRIO
-- ============================================

SELECT 
  '1. PERFIS DO USUÁRIO LOGADO' as secao,
  id as profile_id,
  user_id,
  role,
  is_active,
  created_at
FROM profiles
WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
ORDER BY created_at;

-- ============================================
-- 2. VERIFICAR CORRIDAS DO USUÁRIO
-- ============================================

SELECT 
  '2. CORRIDAS DO USUÁRIO' as secao,
  r.id as ride_id,
  r.passenger_profile_id,
  r.status,
  r.created_at,
  p.user_id as passenger_user_id,
  p.role as passenger_role
FROM ride_requests r
JOIN profiles p ON p.id = r.passenger_profile_id
WHERE p.user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
ORDER BY r.created_at DESC
LIMIT 10;

-- ============================================
-- 3. VERIFICAR PROFILE ESPECÍFICO
-- ============================================

SELECT 
  '3. PROFILE ESPECÍFICO DA CORRIDA' as secao,
  p.id as profile_id,
  p.user_id,
  p.role,
  p.full_name,
  p.is_active,
  u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.id = '0a843169-861a-4f60-bbd2-0b44b45981cf';

-- ============================================
-- 4. VERIFICAR INCONSISTÊNCIAS
-- ============================================

-- Verificar se há corridas onde o passenger_profile_id
-- não pertence ao usuário que deveria ser o dono
SELECT 
  '4. INCONSISTÊNCIAS (se houver)' as secao,
  r.id as ride_id,
  r.passenger_profile_id,
  r.status,
  r.created_at,
  p.user_id as profile_user_id,
  'Esperado: a3ea040f-6f7a-44dd-b778-10eff4295303' as nota
FROM ride_requests r
LEFT JOIN profiles p ON p.id = r.passenger_profile_id
WHERE r.id = 'bcabbb76-f4f3-441b-9765-7875865b6617';

-- ============================================
-- 5. VERIFICAR POLÍTICAS RLS ATIVAS
-- ============================================

SELECT 
  '5. POLÍTICAS RLS ATIVAS' as secao,
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

-- ============================================
-- 6. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================

SELECT 
  '6. RLS HABILITADO?' as secao,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ride_requests';

-- ============================================
-- 7. TESTE DE SEGURANÇA (COMENTADO)
-- ============================================

-- ATENÇÃO: Este teste deve FALHAR se a segurança estiver correta
-- Descomente apenas para testar em ambiente de desenvolvimento

/*
-- Tentar criar corrida com passenger_profile_id de outro usuário
-- Deve retornar erro: "new row violates row-level security policy"

INSERT INTO ride_requests (
  passenger_profile_id,
  pickup_address_id,
  dropoff_address_id,
  pickup_location_id,
  dropoff_location_id,
  status,
  suggested_price
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- Profile de outro usuário
  (SELECT id FROM addresses LIMIT 1),
  (SELECT id FROM addresses LIMIT 1),
  (SELECT id FROM locations LIMIT 1),
  (SELECT id FROM locations LIMIT 1),
  'requested',
  10.00
);
*/

-- ============================================
-- 8. RESUMO ESPERADO
-- ============================================

SELECT 
  '8. RESUMO ESPERADO' as secao,
  'O usuário a3ea040f-6f7a-44dd-b778-10eff4295303 deve ter:' as item,
  '- Pelo menos 1 perfil ativo' as detalhe_1,
  '- Profile ID: 0a843169-861a-4f60-bbd2-0b44b45981cf' as detalhe_2,
  '- RLS deve estar ENABLED na tabela ride_requests' as detalhe_3,
  '- Políticas RLS devem estar ativas' as detalhe_4;
