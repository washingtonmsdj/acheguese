-- GATE 5: CRIAR CORRIDAS DE TESTE
-- Execute este SQL no Supabase SQL Editor (remoto)

-- IMPORTANTE: O schema oficial usa pickup_location/dropoff_location (JSONB)
-- Estas colunas são obrigatórias no modelo atual (legado em transição)

-- Deletar corridas de teste existentes (se houver)
DELETE FROM ride_requests 
WHERE id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

-- Criar corridas de teste usando modelo legado (obrigatório hoje)
INSERT INTO ride_requests (
  id,
  passenger_profile_id,
  pickup_location,
  dropoff_location,
  status
) VALUES
(
  '00000000-0000-0000-0000-000000000101',
  '2357467c-4f5e-4285-bf6b-39628c6a44ad',
  '{"lat": -23.5505, "lng": -46.6333, "address": "Teste Pickup 1"}'::jsonb,
  '{"lat": -23.5606, "lng": -46.6434, "address": "Teste Dropoff 1"}'::jsonb,
  'pending'
),
(
  '00000000-0000-0000-0000-000000000102',
  '2357467c-4f5e-4285-bf6b-39628c6a44ad',
  '{"lat": -23.5505, "lng": -46.6333, "address": "Teste Pickup 2"}'::jsonb,
  '{"lat": -23.5606, "lng": -46.6434, "address": "Teste Dropoff 2"}'::jsonb,
  'pending'
);

-- Verificar criação
SELECT 
  id,
  passenger_profile_id,
  status,
  pickup_location,
  dropoff_location,
  created_at
FROM ride_requests
WHERE id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
)
ORDER BY id;

-- RESULTADO ESPERADO: 2 linhas
