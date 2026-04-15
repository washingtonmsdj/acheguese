-- Criar motorista de teste para validar dispatch

-- 1. Buscar um profile existente
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Buscar primeiro profile disponivel
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE id NOT IN (SELECT profile_id FROM driver_availability)
  LIMIT 1;
  
  IF v_profile_id IS NULL THEN
    RAISE NOTICE 'Nenhum profile disponivel. Criando novo...';
    
    -- Criar profile de teste
    INSERT INTO profiles (
      id,
      full_name,
      email,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Motorista Teste Dispatch',
      'motorista-teste-dispatch@test.local',
      NOW(),
      NOW()
    ) RETURNING id INTO v_profile_id;
    
    RAISE NOTICE 'Profile criado: %', v_profile_id;
  END IF;
  
  -- Criar ou atualizar driver_availability
  INSERT INTO driver_availability (
    profile_id,
    is_online,
    is_available,
    current_lat,
    current_lng,
    last_location_update
  ) VALUES (
    v_profile_id,
    true,
    true,
    -12.975,  -- Salvador, BA
    -38.476,
    NOW()
  )
  ON CONFLICT (profile_id) 
  DO UPDATE SET
    is_online = true,
    is_available = true,
    current_lat = -12.975,
    current_lng = -38.476,
    last_location_update = NOW();
  
  RAISE NOTICE 'Motorista de teste criado/atualizado: %', v_profile_id;
  RAISE NOTICE 'Localizacao: -12.975, -38.476 (Salvador, BA)';
END $$;

-- Validar
SELECT 
  'Motoristas disponiveis' as check_name,
  COUNT(*) as total
FROM driver_availability
WHERE is_online = true 
  AND is_available = true
  AND current_lat IS NOT NULL
  AND current_lng IS NOT NULL;

-- Listar motoristas
SELECT 
  profile_id,
  is_online,
  is_available,
  current_lat,
  current_lng
FROM driver_availability
WHERE is_online = true 
  AND is_available = true
LIMIT 5;
