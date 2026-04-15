-- ETAPA 12: Hardening e Cleanup de ride_requests
-- Torna campos canônicos obrigatórios e remove campos legados

-- 1. Tornar campos canônicos NOT NULL
ALTER TABLE ride_requests
  ALTER COLUMN pickup_address_id SET NOT NULL,
  ALTER COLUMN dropoff_address_id SET NOT NULL,
  ALTER COLUMN pickup_location_id SET NOT NULL,
  ALTER COLUMN dropoff_location_id SET NOT NULL;

-- 2. Remover campos legados
ALTER TABLE ride_requests
  DROP COLUMN IF EXISTS origin,
  DROP COLUMN IF EXISTS destination,
  DROP COLUMN IF EXISTS pickup_location,
  DROP COLUMN IF EXISTS dropoff_location;

-- 3. Comentário de documentação
COMMENT ON TABLE ride_requests IS 'Solicitações de carona - 100% canônico via addresses + locations';
COMMENT ON COLUMN ride_requests.pickup_address_id IS 'Endereço de origem obrigatório (canônico)';
COMMENT ON COLUMN ride_requests.dropoff_address_id IS 'Endereço de destino obrigatório (canônico)';
COMMENT ON COLUMN ride_requests.pickup_location_id IS 'Localização de origem obrigatória (canônico)';
COMMENT ON COLUMN ride_requests.dropoff_location_id IS 'Localização de destino obrigatória (canônico)';
