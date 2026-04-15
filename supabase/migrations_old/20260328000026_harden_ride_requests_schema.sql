-- ============================================================================
-- ETAPA 12: Hardening de ride_requests
-- ============================================================================
-- 
-- Objetivo: Endurecer schema após validação de cobertura canônica
-- 
-- Pré-requisito: 100% dos registros devem ter 4 campos canônicos
-- Validar com: npx tsx scripts/precheck-canonical-coverage.ts
-- ============================================================================

-- ============================================================================
-- 1. TORNAR CAMPOS CANÔNICOS OBRIGATÓRIOS
-- ============================================================================

-- Pickup canônico obrigatório
ALTER TABLE ride_requests 
  ALTER COLUMN pickup_address_id SET NOT NULL,
  ALTER COLUMN pickup_location_id SET NOT NULL;

-- Dropoff canônico obrigatório
ALTER TABLE ride_requests 
  ALTER COLUMN dropoff_address_id SET NOT NULL,
  ALTER COLUMN dropoff_location_id SET NOT NULL;

COMMENT ON COLUMN ride_requests.pickup_address_id IS 
  'FK para addresses (origem) — obrigatório após ETAPA 12';

COMMENT ON COLUMN ride_requests.pickup_location_id IS 
  'FK para locations (território origem) — obrigatório após ETAPA 12';

COMMENT ON COLUMN ride_requests.dropoff_address_id IS 
  'FK para addresses (destino) — obrigatório após ETAPA 12';

COMMENT ON COLUMN ride_requests.dropoff_location_id IS 
  'FK para locations (território destino) — obrigatório após ETAPA 12';

-- ============================================================================
-- 2. REMOVER CAMPOS LEGADOS
-- ============================================================================

-- Remover campos de texto legados (substituídos por address_id)
ALTER TABLE ride_requests 
  DROP COLUMN IF EXISTS origin,
  DROP COLUMN IF EXISTS destination,
  DROP COLUMN IF EXISTS pickup_location,
  DROP COLUMN IF EXISTS dropoff_location;

-- Remover coordenadas legadas separadas (agora em addresses)
ALTER TABLE ride_requests 
  DROP COLUMN IF EXISTS origin_lat,
  DROP COLUMN IF EXISTS origin_lng,
  DROP COLUMN IF EXISTS destination_lat,
  DROP COLUMN IF EXISTS destination_lng;

-- ============================================================================
-- 3. ATUALIZAR RPC create_ride_request_with_canonical
-- ============================================================================

CREATE OR REPLACE FUNCTION create_ride_request_with_canonical(
  p_user_id UUID,
  p_pickup_address_id UUID,
  p_dropoff_address_id UUID,
  p_pickup_location_id UUID,
  p_dropoff_location_id UUID,
  p_departure_time TIMESTAMPTZ,
  p_suggested_price NUMERIC,
  p_type TEXT,
  p_payment_method TEXT,
  p_observation TEXT DEFAULT NULL,
  p_available_seats INTEGER DEFAULT NULL,
  p_search_radius_km NUMERIC DEFAULT 5
)
RETURNS ride_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride ride_requests;
BEGIN
  -- Validar campos obrigatórios
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id é obrigatório';
  END IF;

  IF p_pickup_address_id IS NULL THEN
    RAISE EXCEPTION 'pickup_address_id é obrigatório após ETAPA 12';
  END IF;

  IF p_dropoff_address_id IS NULL THEN
    RAISE EXCEPTION 'dropoff_address_id é obrigatório após ETAPA 12';
  END IF;

  IF p_pickup_location_id IS NULL THEN
    RAISE EXCEPTION 'pickup_location_id é obrigatório após ETAPA 12';
  END IF;

  IF p_dropoff_location_id IS NULL THEN
    RAISE EXCEPTION 'dropoff_location_id é obrigatório após ETAPA 12';
  END IF;

  -- Validar addresses existem
  IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_pickup_address_id) THEN
    RAISE EXCEPTION 'pickup_address_id inválido: %', p_pickup_address_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_dropoff_address_id) THEN
    RAISE EXCEPTION 'dropoff_address_id inválido: %', p_dropoff_address_id;
  END IF;

  -- Validar locations existem e estão ativas
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_pickup_location_id AND status = 'active') THEN
    RAISE EXCEPTION 'pickup_location_id inválido ou inativo: %', p_pickup_location_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_dropoff_location_id AND status = 'active') THEN
    RAISE EXCEPTION 'dropoff_location_id inválido ou inativo: %', p_dropoff_location_id;
  END IF;

  -- Criar ride request
  INSERT INTO ride_requests (
    user_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    departure_time,
    suggested_price,
    type,
    payment_method,
    observation,
    available_seats,
    search_radius_km,
    status
  ) VALUES (
    p_user_id,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    p_departure_time,
    p_suggested_price,
    p_type,
    p_payment_method,
    p_observation,
    p_available_seats,
    p_search_radius_km,
    'pending'
  )
  RETURNING * INTO v_ride;

  RETURN v_ride;
END;
$$;

COMMENT ON FUNCTION create_ride_request_with_canonical IS 
  'ETAPA 12: Criar ride request apenas com campos canônicos (legado removido)';
