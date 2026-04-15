-- GATE 5: CRIAR CORRIDAS DE TESTE - MODELO CANÔNICO
-- Execute este SQL no Supabase SQL Editor (remoto)

-- IMPORTANTE: Este SQL assume que o banco remoto JÁ APLICOU a ETAPA 12 (hardening)
-- e usa o modelo canônico: pickup_address_id/dropoff_address_id + pickup_location_id/dropoff_location_id

-- PASSO 1: Criar addresses de teste (se não existirem)
-- Precisamos de addresses válidos para as FKs

-- Verificar se já existem locations ativas
DO $$
DECLARE
  v_location_id UUID;
  v_pickup_address_id UUID := '00000000-0000-0000-0000-000000000201';
  v_dropoff_address_id UUID := '00000000-0000-0000-0000-000000000202';
BEGIN
  -- Buscar uma location ativa qualquer (cidade ou bairro)
  SELECT id INTO v_location_id
  FROM locations
  WHERE status = 'active'
    AND type IN ('city', 'district')
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma location ativa encontrada. Execute primeiro as migrations de locations.';
  END IF;

  -- Criar address de pickup (se não existir)
  INSERT INTO addresses (
    id,
    location_id,
    address_type,
    street,
    latitude,
    longitude,
    geocoding_source,
    geocoding_confidence
  ) VALUES (
    v_pickup_address_id,
    v_location_id,
    'approximate',
    'Rua Teste Pickup 1',
    -23.5505,
    -46.6333,
    'test_fixture',
    1.0
  )
  ON CONFLICT (id) DO NOTHING;

  -- Criar address de dropoff (se não existir)
  INSERT INTO addresses (
    id,
    location_id,
    address_type,
    street,
    latitude,
    longitude,
    geocoding_source,
    geocoding_confidence
  ) VALUES (
    v_dropoff_address_id,
    v_location_id,
    'approximate',
    'Rua Teste Dropoff 1',
    -23.5606,
    -46.6434,
    'test_fixture',
    1.0
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Addresses criados com location_id: %', v_location_id;
END $$;

-- PASSO 2: Deletar corridas de teste existentes (se houver)
DELETE FROM ride_requests 
WHERE id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

-- PASSO 3: Criar corridas de teste usando modelo canônico
INSERT INTO ride_requests (
  id,
  passenger_profile_id,
  pickup_address_id,
  dropoff_address_id,
  pickup_location_id,
  dropoff_location_id,
  status
)
SELECT
  '00000000-0000-0000-0000-000000000101',
  '2357467c-4f5e-4285-bf6b-39628c6a44ad',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  a1.location_id,
  a2.location_id,
  'pending'
FROM addresses a1, addresses a2
WHERE a1.id = '00000000-0000-0000-0000-000000000201'
  AND a2.id = '00000000-0000-0000-0000-000000000202'
LIMIT 1;

INSERT INTO ride_requests (
  id,
  passenger_profile_id,
  pickup_address_id,
  dropoff_address_id,
  pickup_location_id,
  dropoff_location_id,
  status
)
SELECT
  '00000000-0000-0000-0000-000000000102',
  '2357467c-4f5e-4285-bf6b-39628c6a44ad',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  a1.location_id,
  a2.location_id,
  'pending'
FROM addresses a1, addresses a2
WHERE a1.id = '00000000-0000-0000-0000-000000000201'
  AND a2.id = '00000000-0000-0000-0000-000000000202'
LIMIT 1;

-- PASSO 4: Verificar criação
SELECT 
  id,
  passenger_profile_id,
  pickup_address_id,
  dropoff_address_id,
  pickup_location_id,
  dropoff_location_id,
  status,
  created_at
FROM ride_requests
WHERE id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
)
ORDER BY id;

-- RESULTADO ESPERADO: 2 linhas
