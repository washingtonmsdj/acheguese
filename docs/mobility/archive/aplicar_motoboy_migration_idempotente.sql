-- ============================================================
-- MIGRATION IDEMPOTENTE: Campos de Motoboy
-- ============================================================
-- Versão: 1.0
-- Data: 2026-04-14
-- Seguro para re-execução: SIM
-- Altera dados existentes: NÃO
-- ============================================================
-- Este script pode ser executado múltiplas vezes sem causar erros
-- Usa IF NOT EXISTS para evitar duplicação
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CAMPOS EM ride_requests
-- ============================================================

-- 1.1 ride_mode (modo da solicitação)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'ride_mode'
  ) THEN
    ALTER TABLE ride_requests 
      ADD COLUMN ride_mode TEXT NOT NULL DEFAULT 'ride' 
      CHECK (ride_mode IN ('ride', 'motoboy'));
    
    RAISE NOTICE '✅ Coluna ride_requests.ride_mode criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.ride_mode já existe';
  END IF;
END $$;

-- 1.2 source_type (origem da solicitação)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE ride_requests 
      ADD COLUMN source_type TEXT 
      CHECK (source_type IN ('passenger', 'business', 'gastronomy', 'service'));
    
    RAISE NOTICE '✅ Coluna ride_requests.source_type criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.source_type já existe';
  END IF;
END $$;

-- 1.3 source_id (ID da origem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN source_id UUID;
    RAISE NOTICE '✅ Coluna ride_requests.source_id criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.source_id já existe';
  END IF;
END $$;

-- 1.4 recipient_name (nome do destinatário)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'recipient_name'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN recipient_name TEXT;
    RAISE NOTICE '✅ Coluna ride_requests.recipient_name criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.recipient_name já existe';
  END IF;
END $$;

-- 1.5 recipient_phone (telefone do destinatário)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'recipient_phone'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN recipient_phone TEXT;
    RAISE NOTICE '✅ Coluna ride_requests.recipient_phone criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.recipient_phone já existe';
  END IF;
END $$;

-- 1.6 delivery_notes (observações da entrega)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'delivery_notes'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN delivery_notes TEXT;
    RAISE NOTICE '✅ Coluna ride_requests.delivery_notes criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.delivery_notes já existe';
  END IF;
END $$;

-- 1.7 package_description (descrição do pacote)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'package_description'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN package_description TEXT;
    RAISE NOTICE '✅ Coluna ride_requests.package_description criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.package_description já existe';
  END IF;
END $$;

-- 1.8 package_size (tamanho do pacote)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'package_size'
  ) THEN
    ALTER TABLE ride_requests 
      ADD COLUMN package_size TEXT 
      CHECK (package_size IN ('small', 'medium', 'large'));
    
    RAISE NOTICE '✅ Coluna ride_requests.package_size criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.package_size já existe';
  END IF;
END $$;

-- 1.9 proof_of_delivery (prova de entrega)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'proof_of_delivery'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN proof_of_delivery JSONB DEFAULT NULL;
    RAISE NOTICE '✅ Coluna ride_requests.proof_of_delivery criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.proof_of_delivery já existe';
  END IF;
END $$;

-- 1.10 pickup_confirmed_at (timestamp de coleta confirmada)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'pickup_confirmed_at'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN pickup_confirmed_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Coluna ride_requests.pickup_confirmed_at criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.pickup_confirmed_at já existe';
  END IF;
END $$;

-- 1.11 delivered_at (timestamp de entrega)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN delivered_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Coluna ride_requests.delivered_at criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.delivered_at já existe';
  END IF;
END $$;

-- 1.12 failed_delivery_at (timestamp de falha na entrega)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'failed_delivery_at'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN failed_delivery_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Coluna ride_requests.failed_delivery_at criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.failed_delivery_at já existe';
  END IF;
END $$;

-- 1.13 failed_delivery_reason (motivo da falha)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' AND column_name = 'failed_delivery_reason'
  ) THEN
    ALTER TABLE ride_requests ADD COLUMN failed_delivery_reason TEXT;
    RAISE NOTICE '✅ Coluna ride_requests.failed_delivery_reason criada';
  ELSE
    RAISE NOTICE '⚪ Coluna ride_requests.failed_delivery_reason já existe';
  END IF;
END $$;

-- ============================================================
-- 2. CAMPOS EM driver_data
-- ============================================================

-- 2.1 can_do_delivery (motorista habilitado para entregas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_data' AND column_name = 'can_do_delivery'
  ) THEN
    ALTER TABLE driver_data 
      ADD COLUMN can_do_delivery BOOLEAN NOT NULL DEFAULT true;
    
    RAISE NOTICE '✅ Coluna driver_data.can_do_delivery criada';
  ELSE
    RAISE NOTICE '⚪ Coluna driver_data.can_do_delivery já existe';
  END IF;
END $$;

-- ============================================================
-- 3. CAMPOS EM driver_availability
-- ============================================================

-- 3.1 active_ride_mode (modo da corrida ativa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_availability' AND column_name = 'active_ride_mode'
  ) THEN
    ALTER TABLE driver_availability 
      ADD COLUMN active_ride_mode TEXT 
      CHECK (active_ride_mode IN ('ride', 'motoboy'));
    
    RAISE NOTICE '✅ Coluna driver_availability.active_ride_mode criada';
  ELSE
    RAISE NOTICE '⚪ Coluna driver_availability.active_ride_mode já existe';
  END IF;
END $$;

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

-- 4.1 Índice em ride_mode
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_mode 
  ON ride_requests(ride_mode);

-- 4.2 Índice em source (composto)
CREATE INDEX IF NOT EXISTS idx_ride_requests_source 
  ON ride_requests(source_type, source_id) 
  WHERE source_type IS NOT NULL;

-- ============================================================
-- 5. COMENTÁRIOS (documentação)
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules 
    WHERE mode = 'motoboy' AND is_active = true
  ) THEN
    INSERT INTO pricing_rules (
      mode, 
      name, 
      base_fare, 
      price_per_km, 
      price_per_minute, 
      minimum_fare, 
      is_active,
      metadata,
      created_by,
      updated_by
    ) VALUES (
      'motoboy',
      'Motoboy Padrão',
      3.50,
      1.80,
      0.30,
      6.00,
      true,
      '{"description": "Regra padrão para entregas motoboy"}'::jsonb,
      'system',
      'system'
    );
    
    RAISE NOTICE '✅ Pricing rule motoboy criada';
  ELSE
    RAISE NOTICE '⚪ Pricing rule motoboy já existe';
  END IF;
END $$;

COMMIT;

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
