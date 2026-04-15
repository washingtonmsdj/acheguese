-- ============================================================================
-- ORDER/DELIVERY SSOT HARDENING
-- ============================================================================
-- Endurece o módulo para operação real:
-- - mutações passam por RPCs transacionais
-- - actor_profile_id vira obrigatório e auditável
-- - merchant_own_fleet exige vínculo profile_links(drives_for)
-- - writes diretos nas tabelas operacionais deixam de ser permitidos
-- ============================================================================

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS check_orders_platform_fee_non_negative,
  ADD CONSTRAINT check_orders_platform_fee_non_negative
    CHECK (platform_fee_amount IS NULL OR platform_fee_amount >= 0),
  DROP CONSTRAINT IF EXISTS check_orders_merchant_net_non_negative,
  ADD CONSTRAINT check_orders_merchant_net_non_negative
    CHECK (merchant_net_amount IS NULL OR merchant_net_amount >= 0),
  DROP CONSTRAINT IF EXISTS check_orders_courier_amount_non_negative,
  ADD CONSTRAINT check_orders_courier_amount_non_negative
    CHECK (courier_amount IS NULL OR courier_amount >= 0);

DROP POLICY IF EXISTS "orders_customers_insert" ON orders;
DROP POLICY IF EXISTS "orders_participants_update" ON orders;
DROP POLICY IF EXISTS "order_timeline_events_participants_insert" ON order_timeline_events;
DROP POLICY IF EXISTS "delivery_occurrences_participants_insert" ON delivery_occurrences;
DROP POLICY IF EXISTS "delivery_occurrences_participants_update" ON delivery_occurrences;

CREATE OR REPLACE FUNCTION delivery_assert_authenticated_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória para operar pedidos/entregas.';
  END IF;

  RETURN v_current_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_assert_actor_profile(
  p_actor_profile_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'actor_profile_id é obrigatório para operações mutáveis de delivery.';
  END IF;

  IF NOT is_profile_manager(p_actor_profile_id, p_user_id) THEN
    RAISE EXCEPTION 'O usuário autenticado não gerencia o actor_profile_id informado.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_assert_courier_linked_to_merchant(
  p_merchant_profile_id UUID,
  p_courier_profile_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_courier_profile_id IS NULL THEN
    RAISE EXCEPTION 'courier_profile_id é obrigatório para operação de frota própria.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profile_links
    WHERE from_profile_id = p_merchant_profile_id
      AND to_profile_id = p_courier_profile_id
      AND link_type = 'drives_for'
  ) THEN
    RAISE EXCEPTION 'O courier informado não está vinculado à frota própria do merchant.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_resolve_actor_role(
  p_customer_profile_id UUID,
  p_merchant_profile_id UUID,
  p_courier_profile_id UUID,
  p_actor_profile_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RETURN 'system';
  END IF;

  IF p_actor_profile_id = p_customer_profile_id THEN
    RETURN 'customer';
  END IF;

  IF p_actor_profile_id = p_merchant_profile_id THEN
    RETURN 'merchant';
  END IF;

  IF p_courier_profile_id IS NOT NULL AND p_actor_profile_id = p_courier_profile_id THEN
    RETURN 'courier';
  END IF;

  RETURN 'platform';
END;
$$;

CREATE OR REPLACE FUNCTION delivery_can_transition_logistics(
  p_from_status TEXT,
  p_to_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_from_status = p_to_status THEN true
    WHEN p_from_status = 'pending' THEN p_to_status IN ('accepted', 'canceled', 'failed')
    WHEN p_from_status = 'accepted' THEN p_to_status IN ('preparing', 'canceled', 'failed')
    WHEN p_from_status = 'preparing' THEN p_to_status IN ('ready_for_pickup', 'canceled', 'failed')
    WHEN p_from_status = 'ready_for_pickup' THEN p_to_status IN ('picked_up', 'canceled', 'failed')
    WHEN p_from_status = 'picked_up' THEN p_to_status IN ('delivered', 'failed')
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION delivery_can_transition_financial(
  p_from_status TEXT,
  p_to_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_from_status = p_to_status THEN true
    WHEN p_from_status = 'not_applicable' THEN p_to_status IN ('pending_payment', 'paid')
    WHEN p_from_status = 'pending_payment' THEN p_to_status IN ('paid', 'refunded', 'partially_refunded')
    WHEN p_from_status = 'paid' THEN p_to_status IN ('refunded', 'partially_refunded', 'payout_pending')
    WHEN p_from_status = 'partially_refunded' THEN p_to_status IN ('refunded', 'payout_pending')
    WHEN p_from_status = 'payout_failed' THEN p_to_status IN ('payout_pending')
    WHEN p_from_status IN ('refunded', 'payout_pending', 'payout_sent') THEN false
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION delivery_logistics_event_type(
  p_to_status TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_to_status
    WHEN 'pending' THEN 'order_created'
    WHEN 'accepted' THEN 'order_accepted'
    WHEN 'preparing' THEN 'order_preparing'
    WHEN 'ready_for_pickup' THEN 'order_ready_for_pickup'
    WHEN 'picked_up' THEN 'order_picked_up'
    WHEN 'delivered' THEN 'order_delivered'
    WHEN 'canceled' THEN 'order_canceled'
    WHEN 'failed' THEN 'order_failed'
    ELSE 'order_status_changed'
  END;
$$;

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
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

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
      'delivery_mode', v_order.delivery_mode
    )
  );

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_transition_logistics_status(
  p_order_id UUID,
  p_to_status TEXT,
  p_actor_profile_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_updated_order orders%ROWTYPE;
  v_actor_role TEXT;
  v_metadata JSONB;
  v_is_customer BOOLEAN;
  v_is_merchant BOOLEAN;
  v_is_courier BOOLEAN;
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

  IF p_to_status NOT IN ('accepted', 'preparing', 'ready_for_pickup', 'canceled', 'failed') THEN
    RAISE EXCEPTION 'Use RPC específica para o status logístico solicitado.';
  END IF;

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  IF v_order.delivery_mode <> 'merchant_own_fleet' THEN
    RAISE EXCEPTION 'delivery_mode=% preparado no SSOT, mas ainda não está ativo.', v_order.delivery_mode;
  END IF;

  v_is_customer := is_profile_manager(v_order.customer_profile_id, v_current_user_id);
  v_is_merchant := is_profile_manager(v_order.merchant_profile_id, v_current_user_id);
  v_is_courier := v_order.courier_profile_id IS NOT NULL
    AND is_profile_manager(v_order.courier_profile_id, v_current_user_id);

  IF p_to_status IN ('accepted', 'preparing', 'ready_for_pickup') THEN
    IF NOT v_is_merchant OR p_actor_profile_id <> v_order.merchant_profile_id THEN
      RAISE EXCEPTION 'Somente o merchant ativo pode executar esta transição.';
    END IF;
  ELSIF p_to_status = 'canceled' THEN
    IF NOT (
      (v_is_customer AND p_actor_profile_id = v_order.customer_profile_id)
      OR (v_is_merchant AND p_actor_profile_id = v_order.merchant_profile_id)
    ) THEN
      RAISE EXCEPTION 'Cancelamento exige perfil ativo do customer ou do merchant.';
    END IF;
  ELSIF p_to_status = 'failed' THEN
    IF NOT (
      (v_is_merchant AND p_actor_profile_id = v_order.merchant_profile_id)
      OR (
        v_is_courier
        AND v_order.courier_profile_id IS NOT NULL
        AND p_actor_profile_id = v_order.courier_profile_id
      )
    ) THEN
      RAISE EXCEPTION 'Falha operacional exige perfil ativo do merchant ou do courier designado.';
    END IF;
  END IF;

  IF v_order.logistics_status = p_to_status THEN
    RETURN v_order;
  END IF;

  IF NOT delivery_can_transition_logistics(v_order.logistics_status, p_to_status) THEN
    RAISE EXCEPTION 'Transição logística inválida: % -> %.', v_order.logistics_status, p_to_status;
  END IF;

  v_metadata := CASE
    WHEN p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN '{}'::JSONB
    ELSE p_metadata
  END;

  UPDATE orders
  SET logistics_status = p_to_status,
      accepted_at = CASE
        WHEN p_to_status = 'accepted' THEN COALESCE(accepted_at, NOW())
        ELSE accepted_at
      END,
      preparing_at = CASE
        WHEN p_to_status = 'preparing' THEN COALESCE(preparing_at, NOW())
        ELSE preparing_at
      END,
      ready_for_pickup_at = CASE
        WHEN p_to_status = 'ready_for_pickup' THEN COALESCE(ready_for_pickup_at, NOW())
        ELSE ready_for_pickup_at
      END,
      canceled_at = CASE
        WHEN p_to_status = 'canceled' THEN COALESCE(canceled_at, NOW())
        ELSE canceled_at
      END,
      failed_at = CASE
        WHEN p_to_status = 'failed' THEN COALESCE(failed_at, NOW())
        ELSE failed_at
      END,
      cancellation_reason = CASE
        WHEN p_to_status = 'canceled' THEN COALESCE(NULLIF(BTRIM(p_reason), ''), cancellation_reason)
        ELSE cancellation_reason
      END,
      failure_reason = CASE
        WHEN p_to_status = 'failed' THEN COALESCE(NULLIF(BTRIM(p_reason), ''), failure_reason)
        ELSE failure_reason
      END
  WHERE id = v_order.id
  RETURNING * INTO v_updated_order;

  v_actor_role := delivery_resolve_actor_role(
    v_updated_order.customer_profile_id,
    v_updated_order.merchant_profile_id,
    v_updated_order.courier_profile_id,
    p_actor_profile_id
  );

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    from_logistics_status,
    to_logistics_status,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    v_updated_order.id,
    delivery_logistics_event_type(p_to_status),
    v_order.logistics_status,
    v_updated_order.logistics_status,
    p_actor_profile_id,
    v_actor_role,
    NULLIF(BTRIM(p_reason), ''),
    v_metadata
  );

  RETURN v_updated_order;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_mark_picked_up(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_courier_profile_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_updated_order orders%ROWTYPE;
  v_target_courier_profile_id UUID;
  v_actor_role TEXT;
  v_is_merchant BOOLEAN;
  v_is_courier BOOLEAN;
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  IF v_order.delivery_mode <> 'merchant_own_fleet' THEN
    RAISE EXCEPTION 'delivery_mode=% preparado no SSOT, mas ainda não está ativo.', v_order.delivery_mode;
  END IF;

  v_target_courier_profile_id := COALESCE(
    p_courier_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id
  );

  PERFORM delivery_assert_courier_linked_to_merchant(
    v_order.merchant_profile_id,
    v_target_courier_profile_id
  );

  v_is_merchant := is_profile_manager(v_order.merchant_profile_id, v_current_user_id);
  v_is_courier := is_profile_manager(v_target_courier_profile_id, v_current_user_id);

  IF NOT (
    (v_is_merchant AND p_actor_profile_id = v_order.merchant_profile_id)
    OR (v_is_courier AND p_actor_profile_id = v_target_courier_profile_id)
  ) THEN
    RAISE EXCEPTION 'Retirada exige perfil ativo do merchant ou do courier designado.';
  END IF;

  IF v_order.logistics_status = 'picked_up'
     AND v_order.courier_profile_id = v_target_courier_profile_id THEN
    RETURN v_order;
  END IF;

  IF NOT delivery_can_transition_logistics(v_order.logistics_status, 'picked_up') THEN
    RAISE EXCEPTION 'Transição logística inválida: % -> picked_up.', v_order.logistics_status;
  END IF;

  UPDATE orders
  SET courier_profile_id = v_target_courier_profile_id,
      logistics_status = 'picked_up',
      picked_up_at = COALESCE(picked_up_at, NOW())
  WHERE id = v_order.id
  RETURNING * INTO v_updated_order;

  v_actor_role := delivery_resolve_actor_role(
    v_updated_order.customer_profile_id,
    v_updated_order.merchant_profile_id,
    v_updated_order.courier_profile_id,
    p_actor_profile_id
  );

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    from_logistics_status,
    to_logistics_status,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    v_updated_order.id,
    'order_picked_up',
    v_order.logistics_status,
    v_updated_order.logistics_status,
    p_actor_profile_id,
    v_actor_role,
    COALESCE(NULLIF(BTRIM(p_reason), ''), 'Pedido retirado para entrega'),
    jsonb_build_object('courier_profile_id', v_target_courier_profile_id)
  );

  RETURN v_updated_order;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_attach_delivery_proof(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_proof JSONB
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_updated_order orders%ROWTYPE;
  v_actor_role TEXT;
  v_is_merchant BOOLEAN;
  v_is_courier BOOLEAN;
  v_proof JSONB;
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

  IF p_proof IS NULL OR jsonb_typeof(p_proof) <> 'object' THEN
    RAISE EXCEPTION 'proof_of_delivery deve ser um objeto JSON válido.';
  END IF;

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  v_is_merchant := is_profile_manager(v_order.merchant_profile_id, v_current_user_id);
  v_is_courier := v_order.courier_profile_id IS NOT NULL
    AND is_profile_manager(v_order.courier_profile_id, v_current_user_id);

  IF NOT (
    (v_is_merchant AND p_actor_profile_id = v_order.merchant_profile_id)
    OR (
      v_is_courier
      AND v_order.courier_profile_id IS NOT NULL
      AND p_actor_profile_id = v_order.courier_profile_id
    )
  ) THEN
    RAISE EXCEPTION 'Prova de entrega exige perfil ativo do merchant ou do courier designado.';
  END IF;

  v_proof := p_proof;
  IF COALESCE(v_proof->>'signed_at', '') = '' THEN
    v_proof := v_proof || jsonb_build_object('signed_at', NOW()::TEXT);
  END IF;

  UPDATE orders
  SET proof_of_delivery = v_proof
  WHERE id = v_order.id
  RETURNING * INTO v_updated_order;

  v_actor_role := delivery_resolve_actor_role(
    v_updated_order.customer_profile_id,
    v_updated_order.merchant_profile_id,
    v_updated_order.courier_profile_id,
    p_actor_profile_id
  );

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    v_updated_order.id,
    'delivery_proof_attached',
    p_actor_profile_id,
    v_actor_role,
    'Prova de entrega anexada',
    v_proof
  );

  RETURN v_updated_order;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_mark_delivered(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_proof JSONB DEFAULT NULL
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_updated_order orders%ROWTYPE;
  v_actor_role TEXT;
  v_is_merchant BOOLEAN;
  v_is_courier BOOLEAN;
  v_proof JSONB;
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  v_is_merchant := is_profile_manager(v_order.merchant_profile_id, v_current_user_id);
  v_is_courier := v_order.courier_profile_id IS NOT NULL
    AND is_profile_manager(v_order.courier_profile_id, v_current_user_id);

  IF NOT (
    (v_is_merchant AND p_actor_profile_id = v_order.merchant_profile_id)
    OR (
      v_is_courier
      AND v_order.courier_profile_id IS NOT NULL
      AND p_actor_profile_id = v_order.courier_profile_id
    )
  ) THEN
    RAISE EXCEPTION 'Entrega exige perfil ativo do merchant ou do courier designado.';
  END IF;

  IF v_order.logistics_status = 'delivered' THEN
    RETURN v_order;
  END IF;

  IF NOT delivery_can_transition_logistics(v_order.logistics_status, 'delivered') THEN
    RAISE EXCEPTION 'Transição logística inválida: % -> delivered.', v_order.logistics_status;
  END IF;

  v_proof := p_proof;
  IF v_proof IS NOT NULL AND jsonb_typeof(v_proof) <> 'object' THEN
    RAISE EXCEPTION 'proof_of_delivery deve ser um objeto JSON válido.';
  END IF;

  IF v_proof IS NOT NULL AND COALESCE(v_proof->>'signed_at', '') = '' THEN
    v_proof := v_proof || jsonb_build_object('signed_at', NOW()::TEXT);
  END IF;

  UPDATE orders
  SET logistics_status = 'delivered',
      delivered_at = COALESCE(delivered_at, NOW()),
      proof_of_delivery = COALESCE(v_proof, proof_of_delivery)
  WHERE id = v_order.id
  RETURNING * INTO v_updated_order;

  v_actor_role := delivery_resolve_actor_role(
    v_updated_order.customer_profile_id,
    v_updated_order.merchant_profile_id,
    v_updated_order.courier_profile_id,
    p_actor_profile_id
  );

  IF v_proof IS NOT NULL THEN
    INSERT INTO order_timeline_events (
      order_id,
      event_type,
      actor_profile_id,
      actor_role,
      reason,
      metadata
    )
    VALUES (
      v_updated_order.id,
      'delivery_proof_attached',
      p_actor_profile_id,
      v_actor_role,
      'Prova de entrega anexada',
      v_proof
    );
  END IF;

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    from_logistics_status,
    to_logistics_status,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    v_updated_order.id,
    'order_delivered',
    v_order.logistics_status,
    v_updated_order.logistics_status,
    p_actor_profile_id,
    v_actor_role,
    COALESCE(NULLIF(BTRIM(p_reason), ''), 'Pedido entregue'),
    CASE
      WHEN v_proof IS NULL THEN '{}'::JSONB
      ELSE jsonb_build_object('proof_attached', true)
    END
  );

  RETURN v_updated_order;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_transition_financial_status(
  p_order_id UUID,
  p_to_status TEXT,
  p_actor_profile_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_updated_order orders%ROWTYPE;
  v_metadata JSONB;
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  IF v_order.payment_mode <> 'direct_to_merchant' THEN
    RAISE EXCEPTION 'payment_mode=% preparado no SSOT, mas ainda não está ativo.', v_order.payment_mode;
  END IF;

  IF p_to_status IN ('payout_pending', 'payout_sent', 'payout_failed') THEN
    RAISE EXCEPTION 'Status de payout/split existe no SSOT, mas a execução real ainda não está ativa.';
  END IF;

  IF NOT is_profile_manager(v_order.merchant_profile_id, v_current_user_id)
     OR p_actor_profile_id <> v_order.merchant_profile_id THEN
    RAISE EXCEPTION 'Status financeiro exige perfil ativo do merchant.';
  END IF;

  IF v_order.financial_status = p_to_status THEN
    RETURN v_order;
  END IF;

  IF NOT delivery_can_transition_financial(v_order.financial_status, p_to_status) THEN
    RAISE EXCEPTION 'Transição financeira inválida: % -> %.', v_order.financial_status, p_to_status;
  END IF;

  v_metadata := CASE
    WHEN p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN '{}'::JSONB
    ELSE p_metadata
  END;

  UPDATE orders
  SET financial_status = p_to_status,
      paid_at = CASE
        WHEN p_to_status = 'paid' THEN COALESCE(paid_at, NOW())
        ELSE paid_at
      END,
      refunded_at = CASE
        WHEN p_to_status IN ('refunded', 'partially_refunded') THEN COALESCE(refunded_at, NOW())
        ELSE refunded_at
      END
  WHERE id = v_order.id
  RETURNING * INTO v_updated_order;

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    from_financial_status,
    to_financial_status,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    v_updated_order.id,
    'financial_status_changed',
    v_order.financial_status,
    v_updated_order.financial_status,
    p_actor_profile_id,
    'merchant',
    NULLIF(BTRIM(p_reason), ''),
    v_metadata
  );

  RETURN v_updated_order;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_report_occurrence(
  p_order_id UUID,
  p_occurrence_type TEXT,
  p_description TEXT,
  p_actor_profile_id UUID,
  p_severity TEXT DEFAULT 'medium',
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS delivery_occurrences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_occurrence delivery_occurrences%ROWTYPE;
  v_actor_role TEXT;
  v_metadata JSONB;
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  IF NOT (
    p_actor_profile_id = v_order.customer_profile_id
    OR p_actor_profile_id = v_order.merchant_profile_id
    OR (v_order.courier_profile_id IS NOT NULL AND p_actor_profile_id = v_order.courier_profile_id)
  ) THEN
    RAISE EXCEPTION 'Ocorrência exige perfil ativo participante do pedido.';
  END IF;

  v_metadata := CASE
    WHEN p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN '{}'::JSONB
    ELSE p_metadata
  END;

  INSERT INTO delivery_occurrences (
    order_id,
    occurrence_type,
    severity,
    status,
    description,
    reported_by_profile_id,
    metadata
  )
  VALUES (
    p_order_id,
    p_occurrence_type,
    p_severity,
    'open',
    p_description,
    p_actor_profile_id,
    v_metadata
  )
  RETURNING * INTO v_occurrence;

  v_actor_role := delivery_resolve_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id
  );

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    p_order_id,
    'delivery_occurrence_reported',
    p_actor_profile_id,
    v_actor_role,
    p_description,
    jsonb_build_object(
      'occurrence_id', v_occurrence.id,
      'occurrence_type', v_occurrence.occurrence_type,
      'severity', v_occurrence.severity
    )
  );

  RETURN v_occurrence;
END;
$$;

CREATE OR REPLACE FUNCTION delivery_resolve_occurrence(
  p_order_id UUID,
  p_occurrence_id UUID,
  p_actor_profile_id UUID,
  p_resolution_notes TEXT
)
RETURNS delivery_occurrences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_order orders%ROWTYPE;
  v_occurrence delivery_occurrences%ROWTYPE;
  v_updated_occurrence delivery_occurrences%ROWTYPE;
  v_actor_role TEXT;
  v_is_merchant BOOLEAN;
  v_is_courier BOOLEAN;
BEGIN
  v_current_user_id := delivery_assert_authenticated_user();
  PERFORM delivery_assert_actor_profile(p_actor_profile_id, v_current_user_id);

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  v_is_merchant := is_profile_manager(v_order.merchant_profile_id, v_current_user_id);
  v_is_courier := v_order.courier_profile_id IS NOT NULL
    AND is_profile_manager(v_order.courier_profile_id, v_current_user_id);

  IF NOT (
    (v_is_merchant AND p_actor_profile_id = v_order.merchant_profile_id)
    OR (
      v_is_courier
      AND v_order.courier_profile_id IS NOT NULL
      AND p_actor_profile_id = v_order.courier_profile_id
    )
  ) THEN
    RAISE EXCEPTION 'Resolução de ocorrência exige perfil ativo do merchant ou do courier designado.';
  END IF;

  SELECT *
  INTO v_occurrence
  FROM delivery_occurrences
  WHERE id = p_occurrence_id
    AND order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada.';
  END IF;

  IF v_occurrence.status = 'resolved' THEN
    RETURN v_occurrence;
  END IF;

  UPDATE delivery_occurrences
  SET status = 'resolved',
      resolution_notes = p_resolution_notes,
      resolved_at = COALESCE(resolved_at, NOW())
  WHERE id = v_occurrence.id
  RETURNING * INTO v_updated_occurrence;

  v_actor_role := delivery_resolve_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id
  );

  INSERT INTO order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  )
  VALUES (
    p_order_id,
    'delivery_occurrence_resolved',
    p_actor_profile_id,
    v_actor_role,
    p_resolution_notes,
    jsonb_build_object(
      'occurrence_id', v_updated_occurrence.id,
      'occurrence_type', v_updated_occurrence.occurrence_type
    )
  );

  RETURN v_updated_occurrence;
END;
$$;

REVOKE ALL ON FUNCTION delivery_create_order(UUID, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_create_order(UUID, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION delivery_transition_logistics_status(UUID, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_transition_logistics_status(UUID, TEXT, UUID, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION delivery_mark_picked_up(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_mark_picked_up(UUID, UUID, UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION delivery_attach_delivery_proof(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_attach_delivery_proof(UUID, UUID, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION delivery_mark_delivered(UUID, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_mark_delivered(UUID, UUID, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION delivery_transition_financial_status(UUID, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_transition_financial_status(UUID, TEXT, UUID, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION delivery_report_occurrence(UUID, TEXT, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_report_occurrence(UUID, TEXT, TEXT, UUID, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION delivery_create_order IS
  'RPC transacional para criação de pedido em modo direct_to_merchant + merchant_own_fleet.';
COMMENT ON FUNCTION delivery_transition_logistics_status IS
  'RPC transacional para transições logísticas do modo operacional atual.';
COMMENT ON FUNCTION delivery_mark_picked_up IS
  'RPC transacional para retirada com enforcement de courier vinculado ao merchant.';
COMMENT ON FUNCTION delivery_mark_delivered IS
  'RPC transacional para entrega final com prova opcional anexada no mesmo commit.';
COMMENT ON FUNCTION delivery_transition_financial_status IS
  'RPC transacional para status financeiro desacoplado, sem payout real.';
