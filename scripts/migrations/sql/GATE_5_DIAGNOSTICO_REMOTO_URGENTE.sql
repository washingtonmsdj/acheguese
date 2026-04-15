-- GATE 5: DIAGNÓSTICO URGENTE DO SCHEMA REMOTO
-- Execute este SQL no Supabase SQL Editor AGORA

-- 1. Ver TODAS as colunas da tabela ride_requests
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ride_requests'
ORDER BY ordinal_position;

-- 2. Verificar se campos canônicos existem
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'pickup_address_id') 
    THEN 'SIM' ELSE 'NÃO' 
  END as tem_pickup_address_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'dropoff_address_id') 
    THEN 'SIM' ELSE 'NÃO' 
  END as tem_dropoff_address_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'pickup_location_id') 
    THEN 'SIM' ELSE 'NÃO' 
  END as tem_pickup_location_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'dropoff_location_id') 
    THEN 'SIM' ELSE 'NÃO' 
  END as tem_dropoff_location_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'pickup_location') 
    THEN 'SIM' ELSE 'NÃO' 
  END as tem_pickup_location_legado,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'dropoff_location') 
    THEN 'SIM' ELSE 'NÃO' 
  END as tem_dropoff_location_legado;

-- 3. Ver um exemplo de registro (se houver)
SELECT * FROM ride_requests LIMIT 1;
