-- ============================================================================
-- APLICAÇÃO MANUAL DE CONSTRAINTS FALTANTES
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor se os constraints não foram aplicados
-- ============================================================================

-- 1. business_data: location_id obrigatório
ALTER TABLE business_data 
  ALTER COLUMN location_id SET NOT NULL;

-- 2. professional_data: location_id obrigatório
ALTER TABLE professional_data 
  ALTER COLUMN location_id SET NOT NULL;

-- 3. ride_requests: todos os campos canônicos obrigatórios
ALTER TABLE ride_requests 
  ALTER COLUMN pickup_address_id SET NOT NULL,
  ALTER COLUMN dropoff_address_id SET NOT NULL,
  ALTER COLUMN pickup_location_id SET NOT NULL,
  ALTER COLUMN dropoff_location_id SET NOT NULL;

-- Verificação
SELECT 
  'business_data' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE location_id IS NOT NULL) as with_location_id
FROM business_data

UNION ALL

SELECT 
  'professional_data' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE location_id IS NOT NULL) as with_location_id
FROM professional_data

UNION ALL

SELECT 
  'ride_requests' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE pickup_address_id IS NOT NULL AND dropoff_address_id IS NOT NULL) as with_canonical
FROM ride_requests;
