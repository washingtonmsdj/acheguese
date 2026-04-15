-- ══════════════════════════════════════════════════════════════════════════
-- FASE 7: REDE DE MOTOBOYS / DESPACHO
-- ══════════════════════════════════════════════════════════════════════════
-- Criado: 2026-04-13
-- Descrição: Sistema de entregas com solicitação, aceite e rastreamento
-- ══════════════════════════════════════════════════════════════════════════

-- ── ENUMS ─────────────────────────────────────────────────────────────────

-- Status de uma solicitação de entrega
DO $$ BEGIN
  CREATE TYPE delivery_request_status AS ENUM (
  'pending',        -- Aguardando aceite
  'accepted',       -- Aceita por motoboy
  'picked_up',      -- Pedido retirado
  'in_transit',     -- Em trânsito
  'delivered',      -- Entregue
  'failed',         -- Falhou
  'cancelled'       -- Cancelada
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── TABELAS ───────────────────────────────────────────────────────────────

-- Solicitações de entrega
CREATE TABLE IF NOT EXISTS delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES driver_data(id) ON DELETE SET NULL,
  
  -- Status e controle
  status delivery_request_status NOT NULL DEFAULT 'pending',
  request_number INTEGER NOT NULL,
  
  -- Endereços
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10, 8),
  delivery_lng DECIMAL(11, 8),
  
  -- Informações do cliente
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Valores
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  driver_payment DECIMAL(10, 2),
  
  -- Distância e tempo
  estimated_distance_km DECIMAL(6, 2),
  estimated_duration_minutes INTEGER,
  
  -- Observações
  pickup_instructions TEXT,
  delivery_instructions TEXT,
  internal_notes TEXT,
  
  -- Timestamps de status
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Motivos
  failure_reason TEXT,
  cancellation_reason TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT delivery_requests_order_unique UNIQUE (order_id),
  CONSTRAINT delivery_requests_request_number_business_unique UNIQUE (business_id, request_number)
);

-- Histórico de status de entregas
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
  
  from_status delivery_request_status,
  to_status delivery_request_status NOT NULL,
  
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rastreamento de localização em tempo real
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
  
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  
  speed_kmh DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  
  battery_level INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_delivery_requests_order ON delivery_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_business ON delivery_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_driver ON delivery_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_requested_at ON delivery_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_status_history_request ON delivery_status_history(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_created_at ON delivery_status_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_request ON delivery_tracking(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_created_at ON delivery_tracking(created_at DESC);

-- ── TRIGGERS ──────────────────────────────────────────────────────────────

-- Atualiza updated_at automaticamente
DROP TRIGGER IF EXISTS update_delivery_requests_updated_at ON delivery_requests;
CREATE TRIGGER update_delivery_requests_updated_at
  BEFORE UPDATE ON delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Registra mudanças de status automaticamente
CREATE OR REPLACE FUNCTION log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o status mudou
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO delivery_status_history (
      delivery_request_id,
      from_status,
      to_status
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status
    );
    
    -- Atualiza timestamps de status
    CASE NEW.status
      WHEN 'accepted' THEN
        NEW.accepted_at := NOW();
      WHEN 'picked_up' THEN
        NEW.picked_up_at := NOW();
      WHEN 'in_transit' THEN
        NEW.in_transit_at := NOW();
      WHEN 'delivered' THEN
        NEW.delivered_at := NOW();
      WHEN 'failed' THEN
        NEW.failed_at := NOW();
      WHEN 'cancelled' THEN
        NEW.cancelled_at := NOW();
      ELSE
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_delivery_status_change_trigger ON delivery_requests;
CREATE TRIGGER log_delivery_status_change_trigger
  BEFORE UPDATE ON delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_delivery_status_change();

-- ── FUNÇÕES RPC ───────────────────────────────────────────────────────────

-- Gera próximo número de solicitação de entrega
CREATE OR REPLACE FUNCTION get_next_delivery_request_number(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(request_number), 0) + 1
  INTO v_next_number
  FROM delivery_requests
  WHERE business_id = p_business_id;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- Busca entregas disponíveis para motoboys (raio de X km)
CREATE OR REPLACE FUNCTION get_available_deliveries(
  p_driver_lat DECIMAL,
  p_driver_lng DECIMAL,
  p_radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  request_number INTEGER,
  pickup_address TEXT,
  delivery_address TEXT,
  customer_name TEXT,
  delivery_fee DECIMAL,
  driver_payment DECIMAL,
  estimated_distance_km DECIMAL,
  estimated_duration_minutes INTEGER,
  distance_from_driver_km DECIMAL,
  requested_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dr.id,
    dr.business_id,
    dr.request_number,
    dr.pickup_address,
    dr.delivery_address,
    dr.customer_name,
    dr.delivery_fee,
    dr.driver_payment,
    dr.estimated_distance_km,
    dr.estimated_duration_minutes,
    -- Calcula distância aproximada usando fórmula de Haversine simplificada
    (
      6371 * acos(
        cos(radians(p_driver_lat)) *
        cos(radians(dr.pickup_lat)) *
        cos(radians(dr.pickup_lng) - radians(p_driver_lng)) +
        sin(radians(p_driver_lat)) *
        sin(radians(dr.pickup_lat))
      )
    )::DECIMAL(6, 2) AS distance_from_driver_km,
    dr.requested_at
  FROM delivery_requests dr
  WHERE dr.status = 'pending'
    AND dr.pickup_lat IS NOT NULL
    AND dr.pickup_lng IS NOT NULL
    -- Filtro de raio (aproximado)
    AND (
      6371 * acos(
        cos(radians(p_driver_lat)) *
        cos(radians(dr.pickup_lat)) *
        cos(radians(dr.pickup_lng) - radians(p_driver_lng)) +
        sin(radians(p_driver_lat)) *
        sin(radians(dr.pickup_lat))
      )
    ) <= p_radius_km
  ORDER BY distance_from_driver_km ASC, dr.requested_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Estatísticas de entregas
CREATE OR REPLACE FUNCTION get_delivery_stats(
  p_business_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_requests INTEGER,
  pending_requests INTEGER,
  accepted_requests INTEGER,
  in_progress_requests INTEGER,
  delivered_requests INTEGER,
  failed_requests INTEGER,
  cancelled_requests INTEGER,
  total_delivery_fees DECIMAL,
  average_delivery_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_requests,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_requests,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER AS accepted_requests,
    COUNT(*) FILTER (WHERE status IN ('picked_up', 'in_transit'))::INTEGER AS in_progress_requests,
    COUNT(*) FILTER (WHERE status = 'delivered')::INTEGER AS delivered_requests,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER AS failed_requests,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER AS cancelled_requests,
    COALESCE(SUM(delivery_fee) FILTER (WHERE status = 'delivered'), 0)::DECIMAL(10, 2) AS total_delivery_fees,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (delivered_at - requested_at)) / 60
      ) FILTER (WHERE status = 'delivered' AND delivered_at IS NOT NULL),
      0
    )::INTEGER AS average_delivery_time_minutes
  FROM delivery_requests
  WHERE business_id = p_business_id
    AND (p_date_from IS NULL OR requested_at >= p_date_from)
    AND (p_date_to IS NULL OR requested_at <= p_date_to);
END;
$$ LANGUAGE plpgsql;

-- ── RLS (Row Level Security) ──────────────────────────────────────────────

ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Empresas podem ver suas próprias solicitações
CREATE POLICY delivery_requests_business_select ON delivery_requests
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

-- Empresas podem criar solicitações
CREATE POLICY delivery_requests_business_insert ON delivery_requests
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

-- Empresas podem atualizar suas solicitações
CREATE POLICY delivery_requests_business_update ON delivery_requests
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

-- Motoboys podem ver solicitações pendentes e suas próprias
CREATE POLICY delivery_requests_driver_select ON delivery_requests
  FOR SELECT
  USING (
    status = 'pending'
    OR driver_id IN (
      SELECT id FROM driver_data
      WHERE profile_id = auth.uid()
    )
  );

-- Motoboys podem aceitar solicitações pendentes
CREATE POLICY delivery_requests_driver_accept ON delivery_requests
  FOR UPDATE
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM driver_data
      WHERE profile_id = auth.uid()
    )
  );

-- Motoboys podem atualizar suas próprias entregas
CREATE POLICY delivery_requests_driver_update ON delivery_requests
  FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM driver_data
      WHERE profile_id = auth.uid()
    )
  );

-- Histórico de status
CREATE POLICY delivery_status_history_select ON delivery_status_history
  FOR SELECT
  USING (
    delivery_request_id IN (
      SELECT id FROM delivery_requests
      WHERE business_id IN (
        SELECT id FROM business_data
        WHERE profile_id = auth.uid()
      )
      OR driver_id IN (
        SELECT id FROM driver_data
        WHERE profile_id = auth.uid()
      )
    )
  );

-- Rastreamento
CREATE POLICY delivery_tracking_select ON delivery_tracking
  FOR SELECT
  USING (
    delivery_request_id IN (
      SELECT id FROM delivery_requests
      WHERE business_id IN (
        SELECT id FROM business_data
        WHERE profile_id = auth.uid()
      )
      OR driver_id IN (
        SELECT id FROM driver_data
        WHERE profile_id = auth.uid()
      )
    )
  );

-- Motoboys podem inserir rastreamento de suas entregas
CREATE POLICY delivery_tracking_driver_insert ON delivery_tracking
  FOR INSERT
  WITH CHECK (
    delivery_request_id IN (
      SELECT id FROM delivery_requests
      WHERE driver_id IN (
        SELECT id FROM driver_data
        WHERE profile_id = auth.uid()
      )
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
