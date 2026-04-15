-- ============================================================================
-- ORDER/DELIVERY SSOT
-- ============================================================================
-- Fase atual:
--   payment_mode  = direct_to_merchant
--   delivery_mode = merchant_own_fleet
--
-- Fase futura (preparada):
--   payment_mode  = platform_checkout
--   delivery_mode = platform_courier_network
--   split/payout/settlement real
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  courier_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  payment_mode TEXT NOT NULL DEFAULT 'direct_to_merchant'
    CHECK (payment_mode IN ('direct_to_merchant', 'platform_checkout')),
  delivery_mode TEXT NOT NULL DEFAULT 'merchant_own_fleet'
    CHECK (delivery_mode IN ('merchant_own_fleet', 'platform_courier_network')),

  logistics_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      logistics_status IN (
        'pending',
        'accepted',
        'preparing',
        'ready_for_pickup',
        'picked_up',
        'delivered',
        'canceled',
        'failed'
      )
    ),

  financial_status TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK (
      financial_status IN (
        'not_applicable',
        'pending_payment',
        'paid',
        'refunded',
        'partially_refunded',
        'payout_pending',
        'payout_sent',
        'payout_failed'
      )
    ),

  items_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (items_total >= 0),
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  discount_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  order_total NUMERIC(10,2) NOT NULL CHECK (order_total >= 0),
  platform_fee_amount NUMERIC(10,2),
  merchant_net_amount NUMERIC(10,2),
  courier_amount NUMERIC(10,2),
  CONSTRAINT check_orders_total_consistency
    CHECK (
      order_total = ROUND((items_total + delivery_fee - discount_total)::NUMERIC, 2)
    ),

  currency TEXT NOT NULL DEFAULT 'BRL'
    CHECK (currency ~ '^[A-Z]{3}$'),
  payment_method TEXT,
  external_payment_reference TEXT,
  notes TEXT,

  proof_of_delivery JSONB,
  failure_reason TEXT,
  cancellation_reason TEXT,

  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_for_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_profile_id
  ON orders(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_profile_id
  ON orders(merchant_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_profile_id
  ON orders(courier_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_logistics_status
  ON orders(logistics_status);
CREATE INDEX IF NOT EXISTS idx_orders_financial_status
  ON orders(financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_modes
  ON orders(payment_mode, delivery_mode);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON orders(created_at DESC);

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE orders IS
  'SSOT de pedidos/entregas com status logístico e financeiro desacoplados.';
COMMENT ON COLUMN orders.payment_mode IS
  'direct_to_merchant (ativo) | platform_checkout (preparado para marketplace).';
COMMENT ON COLUMN orders.delivery_mode IS
  'merchant_own_fleet (ativo) | platform_courier_network (preparado para marketplace).';
COMMENT ON COLUMN orders.platform_fee_amount IS
  'Valor de fee da plataforma (pode ficar NULL na fase atual).';
COMMENT ON COLUMN orders.merchant_net_amount IS
  'Valor líquido do merchant após fees/repasses (calculável, sem execução real na fase atual).';
COMMENT ON COLUMN orders.courier_amount IS
  'Valor destinado ao entregador (calculável, sem payout real na fase atual).';

-- ============================================================================
-- TIMELINE / AUDITORIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_logistics_status TEXT,
  to_logistics_status TEXT,
  from_financial_status TEXT,
  to_financial_status TEXT,
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL DEFAULT 'system'
    CHECK (actor_role IN ('customer', 'merchant', 'courier', 'platform', 'system')),
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_events_order_id_created_at
  ON order_timeline_events(order_id, created_at DESC);

COMMENT ON TABLE order_timeline_events IS
  'Timeline de auditoria do pedido, incluindo transições logísticas e financeiras.';

-- ============================================================================
-- OCORRÊNCIAS DA ENTREGA
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  occurrence_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved')),
  description TEXT NOT NULL,
  reported_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_occurrences_order_id_occurred_at
  ON delivery_occurrences(order_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_occurrences_status
  ON delivery_occurrences(status);

DROP TRIGGER IF EXISTS update_delivery_occurrences_updated_at ON delivery_occurrences;
CREATE TRIGGER update_delivery_occurrences_updated_at
  BEFORE UPDATE ON delivery_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE delivery_occurrences IS
  'Registro de ocorrências operacionais da entrega (incidentes, atrasos, falhas, etc).';

-- ============================================================================
-- RLS: orders
-- ============================================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_participants_select" ON orders;
CREATE POLICY "orders_participants_select"
  ON orders FOR SELECT TO authenticated
  USING (
    customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "orders_customers_insert" ON orders;
CREATE POLICY "orders_customers_insert"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (
    customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "orders_participants_update" ON orders;
CREATE POLICY "orders_participants_update"
  ON orders FOR UPDATE TO authenticated
  USING (
    customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS: order_timeline_events
-- ============================================================================

ALTER TABLE order_timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_timeline_events_participants_select" ON order_timeline_events;
CREATE POLICY "order_timeline_events_participants_select"
  ON order_timeline_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = order_timeline_events.order_id
        AND (
          o.customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "order_timeline_events_participants_insert" ON order_timeline_events;
CREATE POLICY "order_timeline_events_participants_insert"
  ON order_timeline_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = order_timeline_events.order_id
        AND (
          o.customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  );

-- ============================================================================
-- RLS: delivery_occurrences
-- ============================================================================

ALTER TABLE delivery_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_occurrences_participants_select" ON delivery_occurrences;
CREATE POLICY "delivery_occurrences_participants_select"
  ON delivery_occurrences FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = delivery_occurrences.order_id
        AND (
          o.customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "delivery_occurrences_participants_insert" ON delivery_occurrences;
CREATE POLICY "delivery_occurrences_participants_insert"
  ON delivery_occurrences FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = delivery_occurrences.order_id
        AND (
          o.customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "delivery_occurrences_participants_update" ON delivery_occurrences;
CREATE POLICY "delivery_occurrences_participants_update"
  ON delivery_occurrences FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = delivery_occurrences.order_id
        AND (
          o.customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = delivery_occurrences.order_id
        AND (
          o.customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  );
