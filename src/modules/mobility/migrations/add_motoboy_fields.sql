-- ============================================================
-- MOTOBOY EXTENSION - Campos de entrega em ride_requests
-- Estratégia: estender a tabela central, não criar tabela nova
-- ============================================================

-- 1. Modo da solicitação (ride | motoboy)
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS ride_mode TEXT NOT NULL DEFAULT 'ride'
    CHECK (ride_mode IN ('ride', 'motoboy'));

-- 2. Origem da solicitação (quem originou)
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS source_type TEXT
    CHECK (source_type IN ('passenger', 'business', 'gastronomy', 'service'));

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS source_id UUID; -- FK para o registro de origem (empresa, restaurante, etc.)

-- 3. Dados da entrega (só relevantes quando ride_mode = 'motoboy')
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS recipient_name TEXT;

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS package_description TEXT;

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS package_size TEXT
    CHECK (package_size IN ('small', 'medium', 'large'));

-- 4. Prova de entrega
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS proof_of_delivery JSONB DEFAULT NULL;
  -- Estrutura: { photo_url, code, observation, signed_at, signed_by }

-- 5. Timestamps específicos de entrega
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ;

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS failed_delivery_at TIMESTAMPTZ;

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS failed_delivery_reason TEXT;

-- 6. Índices para queries de motoboy
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_mode
  ON ride_requests(ride_mode);

CREATE INDEX IF NOT EXISTS idx_ride_requests_source
  ON ride_requests(source_type, source_id)
  WHERE source_type IS NOT NULL;

-- 7. Capacidade do motorista para entrega (em driver_data)
ALTER TABLE driver_data
  ADD COLUMN IF NOT EXISTS can_do_delivery BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON COLUMN ride_requests.ride_mode IS 'ride = corrida de passageiro | motoboy = entrega';
COMMENT ON COLUMN ride_requests.source_type IS 'Quem originou: passenger, business, gastronomy, service';
COMMENT ON COLUMN ride_requests.source_id IS 'ID do registro de origem (empresa, restaurante, etc.)';
COMMENT ON COLUMN ride_requests.proof_of_delivery IS 'JSON: { photo_url, code, observation, signed_at }';
COMMENT ON COLUMN driver_data.can_do_delivery IS 'Motorista habilitado para entregas motoboy';
