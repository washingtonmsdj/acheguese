-- ============================================================================
-- ORDER/DELIVERY SSOT - SOURCE CONTEXT AND ORDER ITEMS
-- ============================================================================
-- Extends the order SSOT with:
-- - explicit source_context for operational origins
-- - transactional order_items persisted with the order aggregate
-- - item total validation at database level
-- ============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'business', 'gastronomy', 'service')),
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS source_reference TEXT,
  ADD COLUMN IF NOT EXISTS source_metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_source_context
  ON orders(source_type, source_id);

COMMENT ON COLUMN orders.source_type IS
  'Operational origin of the order aggregate: manual | business | gastronomy | service.';
COMMENT ON COLUMN orders.source_id IS
  'Identifier of the source entity that originated the order.';
COMMENT ON COLUMN orders.source_reference IS
  'Human-readable reference for the source entity.';
COMMENT ON COLUMN orders.source_metadata IS
  'Structured metadata of the source context for future integrations and analytics.';

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  source_item_id TEXT,
  sku TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  addons_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (addons_total >= 0),
  line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
  notes TEXT,
  item_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_order_items_line_total_consistency
    CHECK (
      line_total = ROUND((quantity * unit_price + addons_total)::NUMERIC, 2)
    )
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id_created_at
  ON order_items(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_order_items_source_item_id
  ON order_items(source_item_id)
  WHERE source_item_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE order_items IS
  'Transactional items that compose the order aggregate in the delivery SSOT.';
COMMENT ON COLUMN order_items.item_snapshot IS
  'Immutable snapshot of the item configuration (variant, addons, instructions).' ;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_participants_select" ON order_items;
CREATE POLICY "order_items_participants_select"
  ON order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          o.customer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.merchant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR o.courier_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  );

CREATE OR REPLACE FUNCTION delivery_assert_order_source(
  p_source_type TEXT,
  p_source_id TEXT,
  p_source_metadata JSONB,
  p_order_items JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_source_type NOT IN ('manual', 'business', 'gastronomy', 'service') THEN
    RAISE EXCEPTION 'source_type=% não é suportado pelo SSOT.', p_source_type;
  END IF;

  IF p_source_type <> 'manual' AND NULLIF(BTRIM(COALESCE(p_source_id, '')), '') IS NULL THEN
    RAISE EXCEPTION 'source_id é obrigatório quando source_type não é manual.';
  END IF;

  IF p_source_metadata IS NULL OR jsonb_typeof(p_source_metadata) <> 'object' THEN
    RAISE EXCEPTION 'source_metadata deve ser um objeto JSON.';
  END IF;

  IF p_order_items IS NULL OR jsonb_typeof(p_order_items) <> 'array' THEN
    RAISE EXCEPTION 'order_items deve ser um array JSON.';
  END IF;

  IF p_source_type = 'gastronomy' AND jsonb_array_length(p_order_items) = 0 THEN
    RAISE EXCEPTION 'Pedidos de origem gastronomy exigem order_items.';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS delivery_create_order(
  UUID,
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  TEXT,
  TEXT,
  TEXT,
  UUID
);

CREATE OR REPLACE FUNCTION delivery_create_order(
  p_customer_profile_id UUID,
  p_merchant_profile_id UUID,
  p_courier_profile_id UUID DEFAULT NULL,
  p_payment_mode TEXT DEFAULT 'direct_to_merchant',
  p_delivery_mode TEXT DEFAULT 'merchant_own_fleet',
  p_financial_status TEXT DEFAULT 'not_applicable',
  p_items_total NUMERIC DEFAULT 0,
  p_delivery_fee NUMERIC DEFAULT 0,
  p_discount_total NUMERIC DEFAULT 0,
  p_order_total NUMERIC DEFAULT 0,
  p_platform_fee_amount NUMERIC DEFAULT NULL,
  p_merchant_net_amount NUMERIC DEFAULT NULL,
  p_courier_amount NUMERIC DEFAULT NULL,
  p_source_type TEXT DEFAULT 'manual',
  p_source_id TEXT DEFAULT NULL,
  p_source_reference TEXT DEFAULT NULL,
  p_source_metadata JSONB DEFAULT '{}'::JSONB,
  p_order_items JSONB DEFAULT '[]'::JSONB,
  p_payment_method TEXT DEFAULT NULL,
  p_external_payment_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_actor_profile_id UUID DEFAULT NULL
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_item JSONB;
  v_item_name TEXT;
  v_quantity NUMERIC(10,2);
  v_unit_price NUMERIC(10,2);
  v_addons_total NUMERIC(10,2);
  v_line_total NUMERIC(10,2);
  v_items_total_from_json NUMERIC(10,2) := 0;
  v_order_items JSONB := COALESCE(p_order_items, '[]'::JSONB);
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);
  PERFORM delivery_assert_order_source(
    p_source_type,
    p_source_id,
    COALESCE(p_source_metadata, '{}'::JSONB),
    v_order_items
  );

  IF p_payment_mode <> 'direct_to_merchant' THEN
    RAISE EXCEPTION 'payment_mode=% preparado no SSOT, mas ainda não está ativo.', p_payment_mode;
  END IF;

  IF p_delivery_mode <> 'merchant_own_fleet' THEN
    RAISE EXCEPTION 'delivery_mode=% preparado no SSOT, mas ainda não está ativo.', p_delivery_mode;
  END IF;

  IF p_financial_status IN ('payout_pending', 'payout_sent', 'payout_failed') THEN
    RAISE EXCEPTION 'Status de payout/split existe no SSOT, mas a execução real ainda não está ativa.';
  END IF;

  IF p_actor_profile_id NOT IN (p_customer_profile_id, p_merchant_profile_id) THEN
    RAISE EXCEPTION 'Na criação do pedido, actor_profile_id deve ser customer_profile_id ou merchant_profile_id.';
  END IF;

  IF NOT (
    is_profile_manager(p_customer_profile_id, v_current_user_id)
    OR is_profile_manager(p_merchant_profile_id, v_current_user_id)
  ) THEN
    RAISE EXCEPTION 'O usuário autenticado não pode criar pedido para estes perfis.';
  END IF;

  IF p_courier_profile_id IS NOT NULL THEN
    PERFORM delivery_assert_courier_linked_to_merchant(
      p_merchant_profile_id,
      p_courier_profile_id
    );
  END IF;

  INSERT INTO orders (
    customer_profile_id,
    merchant_profile_id,
    courier_profile_id,
    source_type,
    source_id,
    source_reference,
    source_metadata,
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
    payment_method,
    external_payment_reference,
    notes
  )
  VALUES (
    p_customer_profile_id,
    p_merchant_profile_id,
    p_courier_profile_id,
    p_source_type,
    NULLIF(BTRIM(COALESCE(p_source_id, '')), ''),
    NULLIF(BTRIM(COALESCE(p_source_reference, '')), ''),
    COALESCE(p_source_metadata, '{}'::JSONB),
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
    p_payment_method,
    p_external_payment_reference,
    p_notes
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_order_items)
  LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'Cada item do pedido deve ser um objeto JSON.';
    END IF;

    v_item_name := NULLIF(BTRIM(COALESCE(v_item ->> 'name', '')), '');
    v_quantity := ROUND(COALESCE((v_item ->> 'quantity')::NUMERIC, 0), 2);
    v_unit_price := ROUND(COALESCE((v_item ->> 'unit_price')::NUMERIC, 0), 2);
    v_addons_total := ROUND(COALESCE((v_item ->> 'addons_total')::NUMERIC, 0), 2);
    v_line_total := ROUND(COALESCE((v_item ->> 'line_total')::NUMERIC, 0), 2);

    IF v_item_name IS NULL THEN
      RAISE EXCEPTION 'Cada item do pedido deve ter name.';
    END IF;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Cada item do pedido deve ter quantity > 0.';
    END IF;

    IF v_unit_price < 0 OR v_addons_total < 0 OR v_line_total < 0 THEN
      RAISE EXCEPTION 'Valores monetários dos itens não podem ser negativos.';
    END IF;

    IF v_line_total <> ROUND((v_quantity * v_unit_price + v_addons_total)::NUMERIC, 2) THEN
      RAISE EXCEPTION 'line_total do item % diverge do cálculo esperado.', v_item_name;
    END IF;

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
    )
    VALUES (
      v_order.id,
      NULLIF(BTRIM(COALESCE(v_item ->> 'source_item_id', '')), ''),
      NULLIF(BTRIM(COALESCE(v_item ->> 'sku', '')), ''),
      v_item_name,
      v_quantity,
      v_unit_price,
      v_addons_total,
      v_line_total,
      NULLIF(BTRIM(COALESCE(v_item ->> 'notes', '')), ''),
      CASE
        WHEN v_item ? 'item_snapshot' AND jsonb_typeof(v_item -> 'item_snapshot') = 'object'
          THEN v_item -> 'item_snapshot'
        ELSE '{}'::JSONB
      END,
      CASE
        WHEN v_item ? 'metadata' AND jsonb_typeof(v_item -> 'metadata') = 'object'
          THEN v_item -> 'metadata'
        ELSE '{}'::JSONB
      END
    );

    v_items_total_from_json := ROUND(v_items_total_from_json + v_line_total, 2);
  END LOOP;

  IF jsonb_array_length(v_order_items) > 0
     AND ROUND(v_items_total_from_json, 2) <> ROUND(p_items_total, 2) THEN
    RAISE EXCEPTION 'items_total divergente do somatório dos order_items (%).', v_items_total_from_json;
  END IF;

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    to_logistics_status,
    to_financial_status,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    v_order.id,
    'order_created',
    v_order.logistics_status,
    v_order.financial_status,
    p_actor_profile_id,
    delivery_resolve_actor_role(
      v_order.customer_profile_id,
      v_order.merchant_profile_id,
      v_order.courier_profile_id,
      p_actor_profile_id
    ),
    'Pedido criado',
    jsonb_build_object(
      'payment_mode', v_order.payment_mode,
      'delivery_mode', v_order.delivery_mode,
      'source_type', v_order.source_type,
      'source_id', v_order.source_id,
      'item_count', jsonb_array_length(v_order_items)
    )
  );

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION delivery_assert_order_source(TEXT, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delivery_create_order(
  UUID,
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  TEXT,
  TEXT,
  TEXT,
  UUID
) TO authenticated;
