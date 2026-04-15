-- ============================================================================
-- ETAPA 12B: Aplicar constraints NOT NULL faltantes
-- ============================================================================
-- As migrations 028-031 removeram colunas mas não aplicaram todos os constraints
-- Esta migration garante que todos os constraints estão ativos
-- ============================================================================

-- 1. business_data: location_id obrigatório
ALTER TABLE business_data 
  ALTER COLUMN location_id SET NOT NULL;

-- 2. professional_data: location_id obrigatório
ALTER TABLE professional_data 
  ALTER COLUMN location_id SET NOT NULL;

-- 3. ride_requests: todos os campos canônicos obrigatórios
-- Nota: ride_requests pode estar vazio, então constraints são seguros
ALTER TABLE ride_requests 
  ALTER COLUMN pickup_address_id SET NOT NULL;

ALTER TABLE ride_requests 
  ALTER COLUMN dropoff_address_id SET NOT NULL;

ALTER TABLE ride_requests 
  ALTER COLUMN pickup_location_id SET NOT NULL;

ALTER TABLE ride_requests 
  ALTER COLUMN dropoff_location_id SET NOT NULL;

-- Comentários
COMMENT ON COLUMN business_data.location_id IS 
  'FK para locations (território) — obrigatório após ETAPA 12';

COMMENT ON COLUMN professional_data.location_id IS 
  'FK para locations (território) — obrigatório após ETAPA 12';

COMMENT ON COLUMN ride_requests.pickup_address_id IS 
  'FK para addresses (origem) — obrigatório após ETAPA 12';

COMMENT ON COLUMN ride_requests.dropoff_address_id IS 
  'FK para addresses (destino) — obrigatório após ETAPA 12';

COMMENT ON COLUMN ride_requests.pickup_location_id IS 
  'FK para locations (território origem) — obrigatório após ETAPA 12';

COMMENT ON COLUMN ride_requests.dropoff_location_id IS 
  'FK para locations (território destino) — obrigatório após ETAPA 12';
