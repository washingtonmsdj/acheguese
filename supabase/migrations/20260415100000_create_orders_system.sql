-- ══════════════════════════════════════════════════════════════════════════
-- SISTEMA DE PEDIDOS E ENTREGAS (ORDERS)
-- ══════════════════════════════════════════════════════════════════════════
-- Criado: 2026-04-15
-- Descrição: Sistema completo de pedidos com logística e financeiro
-- ══════════════════════════════════════════════════════════════════════════

-- ── ENUMS ─────────────────────────────────────────────────────────────────

-- Tipo de origem do pedido
DO $$ BEGIN
  CREATE TYPE order_source_type AS ENUM (
    'manual',
    'business',
    'gastronomy',
    'service'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Modo de pagamento
DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM (
    'direct_to_merchant',
    'platform_checkout'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Modo de entrega
DO $$ BEGIN
  CREATE TYPE delivery_mode AS ENUM (
    'merchant_own_fleet',
    'platform_courier_network'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status logístico
DO $$ BEGIN
  CREATE TYPE logistics_status AS ENUM (
    'pending',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'delivered',
    'canceled',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status financeiro
DO $$ BEGIN
  CREATE TYPE financial_status AS ENUM (
    'not_applicable',
    'pending_payment',
    'paid',
    'refunded',
    'partially_refunded',
    'payout_pending',
    'payout_sent',
    'payout_failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo de ocorrência de entrega
DO $$ BEGIN
  CREATE TYPE delivery_occurrence_type AS ENUM (
    'recipient_unavailable',
    'address_issue',
    'traffic_delay',
    'vehicle_issue',
    'safety_issue',
    'package_issue',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Severidade de ocorrência
DO $$ BEGIN
  CREATE TYPE delivery_occurrence_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status de ocorrência
DO $$ BEGIN
  CREATE TYPE delivery_occurrence_status AS ENUM (
    'open',
    'resolved'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Papel do ator no pedido
DO $$ BEGIN
  CREATE TYPE order_actor_role AS ENUM (
    'customer',
    'merchant',
    'courier',
    'platform',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── TABELAS ───────────────────────────────────────────────────────────────

-- Tabela principal de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos (usando profiles)
  customer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  merchant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  courier_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Contexto de origem
  source_type order_source_type NOT NULL DEFAULT 'manual',
  source_id TEXT,
  source_reference TEXT,
  source_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Modos operacionais
  payment_mode payment_mode NOT NULL DEFAULT 'direct_to_merchant',
  delivery_mode delivery_mode NOT NULL DEFAULT 'merchant_own_fleet',
  
  -- Status
  logistics_status logistics_status NOT NULL DEFAULT 'pending',
  financial_status financial_status NOT NULL DEFAULT 'not_applicable',
  
  -- Breakdown financeiro
  items_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  order_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  platform_fee_amount DECIMAL(10, 2),
  merchant_net_amount DECIMAL(10, 2),
  courier_amount DECIMAL(10, 2),
  
  -- Informações de pagamento
  payment_method TEXT,
  external_payment_reference TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Prova de entrega (JSONB)
  proof_of_delivery JSONB,
  
  -- Motivo de falha
  failure_reason TEXT,
  
  -- Timestamps de status
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_for_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Referência ao item original (opcional)
  source_item_id TEXT,
  sku TEXT,
  
  -- Informações do item
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  addons_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Observações
  notes TEXT,
  
  -- Snapshot do item (variantes, adicionais, etc.)
  item_snapshot JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT order_items_line_total_non_negative CHECK (line_total >= 0)
);

-- Timeline de eventos do pedido
CREATE TABLE IF NOT EXISTS order_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Tipo de evento
  event_type TEXT NOT NULL,
  
  -- Transições de status
  from_logistics_status logistics_status,
  to_logistics_status logistics_status,
  from_financial_status financial_status,
  to_financial_status financial_status,
  
  -- Ator
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role order_actor_role NOT NULL DEFAULT 'system',
  
  -- Detalhes
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ocorrências de entrega
CREATE TABLE IF NOT EXISTS delivery_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Tipo e severidade
  occurrence_type delivery_occurrence_type NOT NULL,
  severity delivery_occurrence_severity NOT NULL DEFAULT 'medium',
  status delivery_occurrence_status NOT NULL DEFAULT 'open',
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Quem reportou
  reported_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Resolução
  resolution_notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_logistics_status ON orders(logistics_status);
CREATE INDEX IF NOT EXISTS idx_orders_financial_status ON orders(financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_source_type ON orders(source_type);
CREATE INDEX IF NOT EXISTS idx_orders_source_id ON orders(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at DESC) WHERE delivered_at IS NOT NULL;

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_source_item ON order_items(source_item_id) WHERE source_item_id IS NOT NULL;

-- Timeline Events
CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON order_timeline_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_event_type ON order_timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_order_timeline_actor ON order_timeline_events(actor_profile_id) WHERE actor_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_timeline_created_at ON order_timeline_events(created_at DESC);

-- Delivery Occurrences
CREATE INDEX IF NOT EXISTS idx_delivery_occurrences_order ON delivery_occurrences(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_occurrences_status ON delivery_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_delivery_occurrences_severity ON delivery_occurrences(severity);
CREATE INDEX IF NOT EXISTS idx_delivery_occurrences_type ON delivery_occurrences(occurrence_type);
CREATE INDEX IF NOT EXISTS idx_delivery_occurrences_reported_by ON delivery_occurrences(reported_by_profile_id) WHERE reported_by_profile_id IS NOT NULL;

-- ── TRIGGERS ──────────────────────────────────────────────────────────────

-- Atualiza updated_at automaticamente
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_occurrences_updated_at ON delivery_occurrences;
CREATE TRIGGER update_delivery_occurrences_updated_at
  BEFORE UPDATE ON delivery_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Registra eventos de timeline automaticamente
CREATE OR REPLACE FUNCTION log_order_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Mudança de status logístico
  IF (TG_OP = 'UPDATE' AND OLD.logistics_status IS DISTINCT FROM NEW.logistics_status) THEN
    INSERT INTO order_timeline_events (
      order_id,
      event_type,
      from_logistics_status,
      to_logistics_status,
      actor_role
    ) VALUES (
      NEW.id,
      'logistics_status_changed',
      OLD.logistics_status,
      NEW.logistics_status,
      'system'
    );
    
    -- Atualiza timestamps de status
    CASE NEW.logistics_status
      WHEN 'accepted' THEN
        NEW.accepted_at := NOW();
      WHEN 'preparing' THEN
        NEW.preparing_at := NOW();
      WHEN 'ready_for_pickup' THEN
        NEW.ready_for_pickup_at := NOW();
      WHEN 'picked_up' THEN
        NEW.picked_up_at := NOW();
      WHEN 'delivered' THEN
        NEW.delivered_at := NOW();
      WHEN 'canceled' THEN
        NEW.canceled_at := NOW();
      WHEN 'failed' THEN
        NEW.failed_at := NOW();
      ELSE
        NULL;
    END CASE;
  END IF;
  
  -- Mudança de status financeiro
  IF (TG_OP = 'UPDATE' AND OLD.financial_status IS DISTINCT FROM NEW.financial_status) THEN
    INSERT INTO order_timeline_events (
      order_id,
      event_type,
      from_financial_status,
      to_financial_status,
      actor_role
    ) VALUES (
      NEW.id,
      'financial_status_changed',
      OLD.financial_status,
      NEW.financial_status,
      'system'
    );
  END IF;
  
  -- Criação do pedido
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO order_timeline_events (
      order_id,
      event_type,
      to_logistics_status,
      to_financial_status,
      actor_role
    ) VALUES (
      NEW.id,
      'order_created',
      NEW.logistics_status,
      NEW.financial_status,
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_order_timeline_event_trigger ON orders;
CREATE TRIGGER log_order_timeline_event_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_timeline_event();

-- ── FUNÇÕES RPC ───────────────────────────────────────────────────────────

-- Criar pedido completo (com itens)
CREATE OR REPLACE FUNCTION delivery_create_order(
  p_customer_profile_id UUID,
  p_merchant_profile_id UUID,
  p_courier_profile_id UUID,
  p_payment_mode payment_mode,
  p_delivery_mode delivery_mode,
  p_financial_status financial_status,
  p_items_total DECIMAL,
  p_delivery_fee DECIMAL,
  p_discount_total DECIMAL,
  p_order_total DECIMAL,
  p_platform_fee_amount DECIMAL,
  p_merchant_net_amount DECIMAL,
  p_courier_amount DECIMAL,
  p_source_type order_source_type,
  p_source_id TEXT,
  p_source_reference TEXT,
  p_source_metadata JSONB,
  p_order_items JSONB,
  p_payment_method TEXT,
  p_external_payment_reference TEXT,
  p_notes TEXT,
  p_actor_profile_id UUID
)
RETURNS orders AS $$
DECLARE
  v_order orders;
  v_item JSONB;
BEGIN
  -- Criar pedido
  INSERT INTO orders (
    customer_profile_id,
    merchant_profile_id,
    courier_profile_id,
    payment_mode,
    delivery_mode,
    logistics_status,
    financial_status,
    items_total,
    delivery_fee,
    discount_total,
    order_total,
    platform_fee_amount,
    merchant_net_amount,
    courier_amount,
    source_type,
    source_id,
    source_reference,
    source_metadata,
    payment_method,
    external_payment_reference,
    notes
  ) VALUES (
    p_customer_profile_id,
    p_merchant_profile_id,
    p_courier_profile_id,
    p_payment_mode,
    p_delivery_mode,
    'pending',
    p_financial_status,
    p_items_total,
    p_delivery_fee,
    p_discount_total,
    p_order_total,
    p_platform_fee_amount,
    p_merchant_net_amount,
    p_courier_amount,
    p_source_type,
    p_source_id,
    p_source_reference,
    p_source_metadata,
    p_payment_method,
    p_external_payment_reference,
    p_notes
  ) RETURNING * INTO v_order;
  
  -- Criar itens
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      source_item_id,
      sku,
      name,
      quantity,
      unit_price,
      addons_total,
      line_total,
      notes,
      item_snapshot,
      metadata
    ) VALUES (
      v_order.id,
      v_item->>'source_item_id',
      v_item->>'sku',
      v_item->>'name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL,
      COALESCE((v_item->>'addons_total')::DECIMAL, 0),
      COALESCE((v_item->>'line_total')::DECIMAL, (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL),
      v_item->>'notes',
      COALESCE(v_item->'item_snapshot', '{}'::jsonb),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    );
  END LOOP;
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transição de status logístico
CREATE OR REPLACE FUNCTION delivery_transition_logistics_status(
  p_order_id UUID,
  p_to_status logistics_status,
  p_actor_profile_id UUID,
  p_reason TEXT,
  p_metadata JSONB
)
RETURNS orders AS $$
DECLARE
  v_order orders;
BEGIN
  UPDATE orders
  SET logistics_status = p_to_status
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
  END IF;
  
  -- Registrar evento com ator
  UPDATE order_timeline_events
  SET 
    actor_profile_id = p_actor_profile_id,
    actor_role = 'merchant',
    reason = p_reason,
    metadata = COALESCE(p_metadata, '{}'::jsonb)
  WHERE order_id = p_order_id
    AND event_type = 'logistics_status_changed'
    AND created_at = (
      SELECT MAX(created_at)
      FROM order_timeline_events
      WHERE order_id = p_order_id
        AND event_type = 'logistics_status_changed'
    );
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marcar como retirado
DROP FUNCTION IF EXISTS delivery_mark_picked_up(UUID, UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION delivery_mark_picked_up(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_courier_profile_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS orders AS $$
DECLARE
  v_order orders;
BEGIN
  UPDATE orders
  SET 
    logistics_status = 'picked_up',
    courier_profile_id = COALESCE(p_courier_profile_id, courier_profile_id)
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
  END IF;
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anexar prova de entrega
DROP FUNCTION IF EXISTS delivery_attach_delivery_proof(UUID, UUID, JSONB);
CREATE OR REPLACE FUNCTION delivery_attach_delivery_proof(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_proof JSONB DEFAULT NULL
)
RETURNS orders AS $$
DECLARE
  v_order orders;
BEGIN
  UPDATE orders
  SET proof_of_delivery = p_proof
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
  END IF;
  
  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    metadata
  ) VALUES (
    p_order_id,
    'delivery_proof_attached',
    p_actor_profile_id,
    'courier',
    jsonb_build_object('proof', p_proof)
  );
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marcar como entregue
DROP FUNCTION IF EXISTS delivery_mark_delivered(UUID, UUID, TEXT, JSONB);
CREATE OR REPLACE FUNCTION delivery_mark_delivered(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_proof JSONB DEFAULT NULL
)
RETURNS orders AS $$
DECLARE
  v_order orders;
BEGIN
  UPDATE orders
  SET 
    logistics_status = 'delivered',
    proof_of_delivery = COALESCE(p_proof, proof_of_delivery)
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
  END IF;
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transição de status financeiro
CREATE OR REPLACE FUNCTION delivery_transition_financial_status(
  p_order_id UUID,
  p_to_status financial_status,
  p_actor_profile_id UUID,
  p_reason TEXT,
  p_metadata JSONB
)
RETURNS orders AS $$
DECLARE
  v_order orders;
BEGIN
  UPDATE orders
  SET financial_status = p_to_status
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
  END IF;
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reportar ocorrência
CREATE OR REPLACE FUNCTION delivery_report_occurrence(
  p_order_id UUID,
  p_occurrence_type delivery_occurrence_type,
  p_description TEXT,
  p_actor_profile_id UUID,
  p_severity delivery_occurrence_severity,
  p_metadata JSONB
)
RETURNS delivery_occurrences AS $$
DECLARE
  v_occurrence delivery_occurrences;
BEGIN
  INSERT INTO delivery_occurrences (
    order_id,
    occurrence_type,
    severity,
    description,
    reported_by_profile_id,
    metadata
  ) VALUES (
    p_order_id,
    p_occurrence_type,
    p_severity,
    p_description,
    p_actor_profile_id,
    COALESCE(p_metadata, '{}'::jsonb)
  ) RETURNING * INTO v_occurrence;
  
  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    metadata
  ) VALUES (
    p_order_id,
    'delivery_occurrence_reported',
    p_actor_profile_id,
    'courier',
    jsonb_build_object(
      'occurrence_id', v_occurrence.id,
      'occurrence_type', p_occurrence_type,
      'severity', p_severity
    )
  );
  
  RETURN v_occurrence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolver ocorrência
CREATE OR REPLACE FUNCTION delivery_resolve_occurrence(
  p_order_id UUID,
  p_occurrence_id UUID,
  p_actor_profile_id UUID,
  p_resolution_notes TEXT
)
RETURNS delivery_occurrences AS $$
DECLARE
  v_occurrence delivery_occurrences;
BEGIN
  UPDATE delivery_occurrences
  SET 
    status = 'resolved',
    resolution_notes = p_resolution_notes,
    resolved_at = NOW()
  WHERE id = p_occurrence_id
    AND order_id = p_order_id
  RETURNING * INTO v_occurrence;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada: %', p_occurrence_id;
  END IF;
  
  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    metadata
  ) VALUES (
    p_order_id,
    'delivery_occurrence_resolved',
    p_actor_profile_id,
    'merchant',
    jsonb_build_object(
      'occurrence_id', p_occurrence_id,
      'resolution_notes', p_resolution_notes
    )
  );
  
  RETURN v_occurrence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS (Row Level Security) ──────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_occurrences ENABLE ROW LEVEL SECURITY;

-- Orders: usuários podem ver pedidos onde são customer, merchant ou courier
CREATE POLICY orders_select ON orders
  FOR SELECT
  USING (
    customer_profile_id = auth.uid()
    OR merchant_profile_id = auth.uid()
    OR courier_profile_id = auth.uid()
  );

-- Orders: merchants podem criar pedidos
CREATE POLICY orders_insert ON orders
  FOR INSERT
  WITH CHECK (
    merchant_profile_id = auth.uid()
  );

-- Orders: merchants e couriers podem atualizar seus pedidos
CREATE POLICY orders_update ON orders
  FOR UPDATE
  USING (
    merchant_profile_id = auth.uid()
    OR courier_profile_id = auth.uid()
  );

-- Order Items: seguem as mesmas regras dos orders
CREATE POLICY order_items_select ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_profile_id = auth.uid()
        OR merchant_profile_id = auth.uid()
        OR courier_profile_id = auth.uid()
    )
  );

CREATE POLICY order_items_insert ON order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE merchant_profile_id = auth.uid()
    )
  );

-- Timeline Events: leitura para participantes do pedido
CREATE POLICY order_timeline_events_select ON order_timeline_events
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_profile_id = auth.uid()
        OR merchant_profile_id = auth.uid()
        OR courier_profile_id = auth.uid()
    )
  );

-- Delivery Occurrences: leitura para participantes do pedido
CREATE POLICY delivery_occurrences_select ON delivery_occurrences
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_profile_id = auth.uid()
        OR merchant_profile_id = auth.uid()
        OR courier_profile_id = auth.uid()
    )
  );

-- Delivery Occurrences: couriers e merchants podem criar
CREATE POLICY delivery_occurrences_insert ON delivery_occurrences
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE merchant_profile_id = auth.uid()
        OR courier_profile_id = auth.uid()
    )
  );

-- Delivery Occurrences: merchants podem atualizar
CREATE POLICY delivery_occurrences_update ON delivery_occurrences
  FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE merchant_profile_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
