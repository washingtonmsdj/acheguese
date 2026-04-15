-- ============================================================
-- MIGRATION MOTOBOY - VERSÃO SIMPLES E ROBUSTA
-- ============================================================
-- Versão: 1.1
-- Data: 2026-04-14
-- Seguro para re-execução: SIM (usa IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- 1. CAMPOS EM ride_requests
-- ============================================================

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS ride_mode TEXT NOT NULL DEFAULT 'ride' 
  CHECK (ride_mode IN ('ride', 'motoboy'));

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS source_type TEXT 
  CHECK (source_type IN ('passenger', 'business', 'gastronomy', 'service'));

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS source_id UUID;

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

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS proof_of_delivery JSONB DEFAULT NULL;

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ;

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS failed_delivery_at TIMESTAMPTZ;

ALTER TABLE ride_requests 
  ADD COLUMN IF NOT EXISTS failed_delivery_reason TEXT;

-- ============================================================
-- 2. CAMPOS EM driver_data
-- ============================================================

ALTER TABLE driver_data 
  ADD COLUMN IF NOT EXISTS can_do_delivery BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 3. CAMPOS EM driver_availability
-- ============================================================

ALTER TABLE driver_availability 
  ADD COLUMN IF NOT EXISTS active_ride_mode TEXT 
  CHECK (active_ride_mode IN ('ride', 'motoboy'));

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_mode 
  ON ride_requests(ride_mode);

CREATE INDEX IF NOT EXISTS idx_ride_requests_source 
  ON ride_requests(source_type, source_id) 
  WHERE source_type IS NOT NULL;

-- ============================================================
-- 5. COMENTÁRIOS
-- ============================================================

COMMENT ON COLUMN ride_requests.ride_mode IS 
  'Modo da solicitação: ride = corrida de passageiro | motoboy = entrega';

COMMENT ON COLUMN ride_requests.source_type IS 
  'Origem da solicitação: passenger, business, gastronomy, service';

COMMENT ON COLUMN ride_requests.source_id IS 
  'ID do registro de origem (empresa, restaurante, serviço)';

COMMENT ON COLUMN ride_requests.proof_of_delivery IS 
  'Prova de entrega em JSON: { photo_url, code, observation, signed_at }';

COMMENT ON COLUMN driver_data.can_do_delivery IS 
  'Motorista habilitado para fazer entregas motoboy';

COMMENT ON COLUMN driver_availability.active_ride_mode IS 
  'Modo da corrida ativa (ride ou motoboy). NULL se disponível';

-- ============================================================
-- 6. PRICING RULE MOTOBOY
-- ============================================================

INSERT INTO pricing_rules (
  mode, 
  name, 
  base_fare, 
  price_per_km, 
  price_per_minute, 
  minimum_fare, 
  is_active,
  metadata
) 
SELECT 
  'motoboy',
  'Motoboy Padrão',
  3.50,
  1.80,
  0.30,
  6.00,
  true,
  '{"description": "Regra padrão para entregas motoboy"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_rules 
  WHERE mode = 'motoboy' AND is_active = true
);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT 
  'VERIFICAÇÃO FINAL' as status,
  COUNT(*) as campos_criados
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'ride_requests' AND column_name IN (
      'ride_mode', 'source_type', 'source_id', 
      'recipient_name', 'recipient_phone',
      'delivery_notes', 'package_description', 'package_size',
      'proof_of_delivery', 'pickup_confirmed_at', 
      'delivered_at', 'failed_delivery_at', 'failed_delivery_reason'
    ))
    OR (table_name = 'driver_data' AND column_name = 'can_do_delivery')
    OR (table_name = 'driver_availability' AND column_name = 'active_ride_mode')
  );

-- Resultado esperado: 15 campos criados
-- Se retornar 15 → ✅ Migration completa
-- Se retornar < 15 → ❌ Revisar erros acima

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
