-- Diagnóstico: Verificar usuário e corrida

-- 1. Verificar o usuário logado
SELECT 
  'USUÁRIO LOGADO' as tipo,
  id,
  email,
  raw_user_meta_data->>'full_name' as nome
FROM auth.users
WHERE id = 'a3ea040f-6f7a-44dd-b778-10eff4295303';

-- 2. Verificar o perfil do usuário logado
SELECT 
  'PERFIL DO USUÁRIO LOGADO' as tipo,
  id as profile_id,
  user_id,
  full_name,
  role
FROM profiles
WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303';

-- 3. Verificar a corrida
SELECT 
  'CORRIDA' as tipo,
  id as ride_id,
  passenger_profile_id,
  driver_profile_id,
  status,
  created_at
FROM ride_requests
WHERE id = 'bcabbb76-f4f3-441b-9765-7875865b6617';

-- 4. Verificar o perfil do passageiro da corrida
SELECT 
  'PERFIL DO PASSAGEIRO DA CORRIDA' as tipo,
  p.id as profile_id,
  p.user_id,
  p.full_name,
  p.role,
  u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.id = '0a843169-861a-4f60-bbd2-0b44b45981cf';

-- 5. Verificar se há múltiplos perfis para o usuário logado
SELECT 
  'TODOS OS PERFIS DO USUÁRIO LOGADO' as tipo,
  id as profile_id,
  user_id,
  full_name,
  role,
  created_at
FROM profiles
WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
ORDER BY created_at;
