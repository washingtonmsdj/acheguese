-- ============================================================================
-- Harden orders RLS and exposed delivery RPC authorization
-- ============================================================================
-- Goal:
--   - align orders/order_items RLS with profiles.user_id ownership
--   - allow profile members to act on business profiles when applicable
--   - block SECURITY DEFINER RPC spoofing through arbitrary actor_profile_id
--   - revoke default PUBLIC execute from delivery/order RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auth_can_access_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p_profile_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_profile_id
          AND (
            p.user_id = auth.uid()
            OR coalesce(auth.role(), '') = 'service_role'
            OR coalesce(public.is_admin_from_roles(auth.uid()), false)
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p_profile_id
          AND pm.user_id = auth.uid()
          AND pm.is_active = true
      )
    );
$$;
REVOKE ALL ON FUNCTION public.auth_can_access_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_can_access_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_can_access_profile(UUID) TO service_role;
CREATE OR REPLACE FUNCTION public.resolve_delivery_order_actor_role(
  p_customer_profile_id UUID,
  p_merchant_profile_id UUID,
  p_courier_profile_id UUID,
  p_actor_profile_id UUID,
  p_allow_customer BOOLEAN DEFAULT false,
  p_allow_merchant BOOLEAN DEFAULT true,
  p_allow_courier BOOLEAN DEFAULT true
)
RETURNS public.order_actor_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_service_role BOOLEAN := coalesce(auth.role(), '') = 'service_role';
  v_is_admin BOOLEAN := coalesce(public.is_admin_from_roles(auth.uid()), false);
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'actor_profile_id is required';
  END IF;

  IF NOT public.auth_can_access_profile(p_actor_profile_id) THEN
    RAISE EXCEPTION 'actor_profile_id is not owned by the authenticated user: %', p_actor_profile_id;
  END IF;

  IF p_allow_customer AND p_customer_profile_id = p_actor_profile_id THEN
    RETURN 'customer';
  END IF;

  IF p_allow_merchant AND p_merchant_profile_id = p_actor_profile_id THEN
    RETURN 'merchant';
  END IF;

  IF p_allow_courier AND p_courier_profile_id = p_actor_profile_id THEN
    RETURN 'courier';
  END IF;

  IF v_is_service_role OR v_is_admin THEN
    RETURN 'platform';
  END IF;

  RAISE EXCEPTION 'actor_profile_id is not authorized for this order: %', p_actor_profile_id;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_delivery_order_actor_role(UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_order_actor_role(UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_order_actor_role(UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) TO service_role;
DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    public.auth_can_access_profile(customer_profile_id)
    OR public.auth_can_access_profile(merchant_profile_id)
    OR public.auth_can_access_profile(courier_profile_id)
  );
DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_can_access_profile(customer_profile_id)
    OR public.auth_can_access_profile(merchant_profile_id)
  );
DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_can_access_profile(merchant_profile_id)
    OR public.auth_can_access_profile(courier_profile_id)
  )
  WITH CHECK (
    public.auth_can_access_profile(merchant_profile_id)
    OR public.auth_can_access_profile(courier_profile_id)
  );
DROP POLICY IF EXISTS order_items_select ON public.order_items;
CREATE POLICY order_items_select
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          public.auth_can_access_profile(o.customer_profile_id)
          OR public.auth_can_access_profile(o.merchant_profile_id)
          OR public.auth_can_access_profile(o.courier_profile_id)
        )
    )
  );
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
CREATE POLICY order_items_insert
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          public.auth_can_access_profile(o.customer_profile_id)
          OR public.auth_can_access_profile(o.merchant_profile_id)
        )
    )
  );
DROP POLICY IF EXISTS order_timeline_events_select ON public.order_timeline_events;
CREATE POLICY order_timeline_events_select
  ON public.order_timeline_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_timeline_events.order_id
        AND (
          public.auth_can_access_profile(o.customer_profile_id)
          OR public.auth_can_access_profile(o.merchant_profile_id)
          OR public.auth_can_access_profile(o.courier_profile_id)
        )
    )
  );
DROP POLICY IF EXISTS delivery_occurrences_select ON public.delivery_occurrences;
CREATE POLICY delivery_occurrences_select
  ON public.delivery_occurrences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = delivery_occurrences.order_id
        AND (
          public.auth_can_access_profile(o.customer_profile_id)
          OR public.auth_can_access_profile(o.merchant_profile_id)
          OR public.auth_can_access_profile(o.courier_profile_id)
        )
    )
  );
DROP POLICY IF EXISTS delivery_occurrences_insert ON public.delivery_occurrences;
CREATE POLICY delivery_occurrences_insert
  ON public.delivery_occurrences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = delivery_occurrences.order_id
        AND (
          public.auth_can_access_profile(o.merchant_profile_id)
          OR public.auth_can_access_profile(o.courier_profile_id)
        )
    )
  );
DROP POLICY IF EXISTS delivery_occurrences_update ON public.delivery_occurrences;
CREATE POLICY delivery_occurrences_update
  ON public.delivery_occurrences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = delivery_occurrences.order_id
        AND public.auth_can_access_profile(o.merchant_profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = delivery_occurrences.order_id
        AND public.auth_can_access_profile(o.merchant_profile_id)
    )
  );
CREATE OR REPLACE FUNCTION public.delivery_create_order(
  p_customer_profile_id UUID,
  p_merchant_profile_id UUID,
  p_courier_profile_id UUID,
  p_payment_mode public.payment_mode,
  p_delivery_mode public.delivery_mode,
  p_financial_status public.financial_status,
  p_items_total DECIMAL,
  p_delivery_fee DECIMAL,
  p_discount_total DECIMAL,
  p_order_total DECIMAL,
  p_platform_fee_amount DECIMAL,
  p_merchant_net_amount DECIMAL,
  p_courier_amount DECIMAL,
  p_source_type public.order_source_type,
  p_source_id TEXT,
  p_source_reference TEXT,
  p_source_metadata JSONB,
  p_order_items JSONB,
  p_payment_method TEXT,
  p_external_payment_reference TEXT,
  p_notes TEXT,
  p_actor_profile_id UUID
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_item JSONB;
  v_is_service_role BOOLEAN := coalesce(auth.role(), '') = 'service_role';
  v_is_admin BOOLEAN := coalesce(public.is_admin_from_roles(auth.uid()), false);
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'actor_profile_id is required';
  END IF;

  IF NOT public.auth_can_access_profile(p_actor_profile_id) THEN
    RAISE EXCEPTION 'actor_profile_id is not owned by the authenticated user: %', p_actor_profile_id;
  END IF;

  IF NOT (
    p_actor_profile_id = p_customer_profile_id
    OR p_actor_profile_id = p_merchant_profile_id
    OR v_is_service_role
    OR v_is_admin
  ) THEN
    RAISE EXCEPTION 'actor_profile_id is not allowed to create this order: %', p_actor_profile_id;
  END IF;

  INSERT INTO public.orders (
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

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    INSERT INTO public.order_items (
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
$$;
CREATE OR REPLACE FUNCTION public.delivery_transition_logistics_status(
  p_order_id UUID,
  p_to_status public.logistics_status,
  p_actor_profile_id UUID,
  p_reason TEXT,
  p_metadata JSONB
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    false,
    true,
    true
  );

  UPDATE public.orders
  SET logistics_status = p_to_status
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  UPDATE public.order_timeline_events
  SET
    actor_profile_id = p_actor_profile_id,
    actor_role = v_actor_role,
    reason = p_reason,
    metadata = COALESCE(p_metadata, '{}'::jsonb)
  WHERE order_id = p_order_id
    AND event_type = 'logistics_status_changed'
    AND created_at = (
      SELECT MAX(created_at)
      FROM public.order_timeline_events
      WHERE order_id = p_order_id
        AND event_type = 'logistics_status_changed'
    );

  RETURN v_order;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_mark_picked_up(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_courier_profile_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    false,
    true,
    true
  );

  IF v_actor_role = 'courier'
    AND p_courier_profile_id IS NOT NULL
    AND p_courier_profile_id <> p_actor_profile_id THEN
    RAISE EXCEPTION 'Courier actor cannot assign another courier profile';
  END IF;

  UPDATE public.orders
  SET
    logistics_status = 'picked_up',
    courier_profile_id = COALESCE(p_courier_profile_id, courier_profile_id)
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_attach_delivery_proof(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_proof JSONB DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    false,
    true,
    true
  );

  UPDATE public.orders
  SET proof_of_delivery = p_proof
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO public.order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    metadata
  ) VALUES (
    p_order_id,
    'delivery_proof_attached',
    p_actor_profile_id,
    v_actor_role,
    jsonb_build_object('proof', p_proof)
  );

  RETURN v_order;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_mark_delivered(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_proof JSONB DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    false,
    true,
    true
  );

  UPDATE public.orders
  SET
    logistics_status = 'delivered',
    proof_of_delivery = COALESCE(p_proof, proof_of_delivery)
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_transition_financial_status(
  p_order_id UUID,
  p_to_status public.financial_status,
  p_actor_profile_id UUID,
  p_reason TEXT,
  p_metadata JSONB
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    false,
    true,
    false
  );

  UPDATE public.orders
  SET financial_status = p_to_status
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  UPDATE public.order_timeline_events
  SET
    actor_profile_id = p_actor_profile_id,
    actor_role = v_actor_role,
    reason = p_reason,
    metadata = COALESCE(p_metadata, '{}'::jsonb)
  WHERE order_id = p_order_id
    AND event_type = 'financial_status_changed'
    AND created_at = (
      SELECT MAX(created_at)
      FROM public.order_timeline_events
      WHERE order_id = p_order_id
        AND event_type = 'financial_status_changed'
    );

  RETURN v_order;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_report_occurrence(
  p_order_id UUID,
  p_occurrence_type public.delivery_occurrence_type,
  p_description TEXT,
  p_actor_profile_id UUID,
  p_severity public.delivery_occurrence_severity,
  p_metadata JSONB
)
RETURNS public.delivery_occurrences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_occurrence public.delivery_occurrences;
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    false,
    true,
    true
  );

  INSERT INTO public.delivery_occurrences (
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

  INSERT INTO public.order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    metadata
  ) VALUES (
    p_order_id,
    'delivery_occurrence_reported',
    p_actor_profile_id,
    v_actor_role,
    jsonb_build_object(
      'occurrence_id', v_occurrence.id,
      'occurrence_type', p_occurrence_type,
      'severity', p_severity
    )
  );

  RETURN v_occurrence;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_resolve_occurrence(
  p_order_id UUID,
  p_occurrence_id UUID,
  p_actor_profile_id UUID,
  p_resolution_notes TEXT
)
RETURNS public.delivery_occurrences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_occurrence public.delivery_occurrences;
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    false,
    true,
    false
  );

  UPDATE public.delivery_occurrences
  SET
    status = 'resolved',
    resolution_notes = p_resolution_notes,
    resolved_at = NOW()
  WHERE id = p_occurrence_id
    AND order_id = p_order_id
  RETURNING * INTO v_occurrence;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrencia nao encontrada: %', p_occurrence_id;
  END IF;

  INSERT INTO public.order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    metadata
  ) VALUES (
    p_order_id,
    'delivery_occurrence_resolved',
    p_actor_profile_id,
    v_actor_role,
    jsonb_build_object(
      'occurrence_id', p_occurrence_id,
      'resolution_notes', p_resolution_notes
    )
  );

  RETURN v_occurrence;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_update_order_notes(
  p_order_id UUID,
  p_notes TEXT,
  p_actor_profile_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_previous_notes TEXT;
  v_actor_role public.order_actor_role;
  v_notes TEXT;
BEGIN
  IF p_notes IS NULL OR btrim(p_notes) = '' THEN
    RAISE EXCEPTION 'notes is required';
  END IF;

  v_notes := left(btrim(p_notes), 1000);

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    true,
    true,
    true
  );

  v_previous_notes := v_order.notes;

  UPDATE public.orders
  SET
    notes = v_notes,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO public.order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  ) VALUES (
    p_order_id,
    'order_notes_updated',
    p_actor_profile_id,
    v_actor_role,
    'Order notes updated',
    jsonb_build_object(
      'previous_notes', COALESCE(v_previous_notes, ''),
      'updated_notes', v_notes
    ) || COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN v_order;
END;
$$;
CREATE OR REPLACE FUNCTION public.delivery_update_order_source_metadata(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_metadata_patch JSONB DEFAULT '{}'::jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
  v_patch JSONB := COALESCE(p_metadata_patch, '{}'::jsonb);
  v_previous_source_metadata JSONB := '{}'::jsonb;
BEGIN
  IF jsonb_typeof(v_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'metadata_patch must be a JSON object';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    true,
    true,
    true
  );

  v_previous_source_metadata := COALESCE(v_order.source_metadata, '{}'::jsonb);

  UPDATE public.orders
  SET
    source_metadata = COALESCE(source_metadata, '{}'::jsonb) || v_patch,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO public.order_timeline_events (
    order_id,
    event_type,
    actor_profile_id,
    actor_role,
    reason,
    metadata
  ) VALUES (
    p_order_id,
    'order_source_metadata_updated',
    p_actor_profile_id,
    v_actor_role,
    'Order source metadata updated',
    jsonb_build_object(
      'previous_source_metadata', v_previous_source_metadata,
      'metadata_patch', v_patch
    )
  );

  RETURN v_order;
END;
$$;
REVOKE ALL ON FUNCTION public.delivery_create_order(UUID, UUID, UUID, public.payment_mode, public.delivery_mode, public.financial_status, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, public.order_source_type, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_create_order(UUID, UUID, UUID, public.payment_mode, public.delivery_mode, public.financial_status, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, public.order_source_type, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_create_order(UUID, UUID, UUID, public.payment_mode, public.delivery_mode, public.financial_status, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, public.order_source_type, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_transition_logistics_status(UUID, public.logistics_status, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_transition_logistics_status(UUID, public.logistics_status, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_logistics_status(UUID, public.logistics_status, UUID, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_attach_delivery_proof(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_attach_delivery_proof(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_attach_delivery_proof(UUID, UUID, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_transition_financial_status(UUID, public.financial_status, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_transition_financial_status(UUID, public.financial_status, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_financial_status(UUID, public.financial_status, UUID, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_report_occurrence(UUID, public.delivery_occurrence_type, TEXT, UUID, public.delivery_occurrence_severity, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_report_occurrence(UUID, public.delivery_occurrence_type, TEXT, UUID, public.delivery_occurrence_severity, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_report_occurrence(UUID, public.delivery_occurrence_type, TEXT, UUID, public.delivery_occurrence_severity, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_update_order_notes(UUID, TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_notes(UUID, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_notes(UUID, TEXT, UUID, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.delivery_update_order_source_metadata(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_source_metadata(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_source_metadata(UUID, UUID, JSONB) TO service_role;
NOTIFY pgrst, 'reload schema';
