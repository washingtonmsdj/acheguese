-- Criar cenário de teste com passageiro e motoristas diferentes

-- 1. Criar perfil de passageiro
INSERT INTO profiles (id, full_name, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Passageiro Teste',
  'passageiro-teste@test.local',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
RETURNING id;

-- 2. Criar 2 motoristas diferentes
DO $$
DECLARE
  v_motorista1_id UUID;
  v_motorista2_id UUID;
BEGIN
  -- Motorista 1
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Motorista 1 Teste',
    'motorista1-teste@test.local',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_motorista1_id;
  
  INSERT INTO driver_availability (
    profile_id, is_online, is_available,
    current_lat, current_lng, last_location_update
  ) VALUES (
    v_motorista1_id, true, true,
    -12.975, -38.476, NOW()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    is_online = true, is_available = true,
    current_lat = -12.975, current_lng = -38.476,
    last_location_update = NOW();
  
  RAISE NOTICE 'Motorista 1 criado: %', v_motorista1_id;
  
  -- Motorista 2
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Motorista 2 Teste',
    'motorista2-teste@test.local',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_motorista2_id;
  
  INSERT INTO driver_availability (
    profile_id, is_online, is_available,
    current_lat, current_lng, last_location_update
  ) VALUES (
    v_motorista2_id, true, true,
    -12.980, -38.480, NOW()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    is_online = true, is_available = true,
    current_lat = -12.980, current_lng = -38.480,
    last_location_update = NOW();
  
  RAISE NOTICE 'Motorista 2 criado: %', v_motorista2_id;
END $$;

-- Validar
SELECT 
  'Passageiro' as tipo,
  id,
  full_name,
  email
FROM profiles
WHERE email = 'passageiro-teste@test.local'
UNION ALL
SELECT 
  'Motorista' as tipo,
  p.id,
  p.full_name,
  p.email
FROM profiles p
JOIN driver_availability da ON da.profile_id = p.id
WHERE p.email LIKE 'motorista%-teste@test.local'
ORDER BY tipo, email;

-- Listar motoristas disponíveis
SELECT 
  p.id,
  p.full_name,
  da.current_lat,
  da.current_lng,
  da.is_online,
  da.is_available
FROM driver_availability da
JOIN profiles p ON p.id = da.profile_id
WHERE da.is_online = true AND da.is_available = true;
