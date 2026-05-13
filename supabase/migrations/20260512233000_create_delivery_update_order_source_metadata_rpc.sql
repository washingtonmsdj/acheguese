-- ============================================================================
-- DELIVERY SSOT: RPC canonico para atualizar source_metadata do pedido
-- ============================================================================
-- Objetivo:
-- - evitar escrita direta em orders no app
-- - manter trilha de auditoria em order_timeline_events
-- - validar permissao do ator no servidor
-- ============================================================================

CREATE OR REPLACE FUNCTION delivery_update_order_source_metadata(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_metadata_patch JSONB DEFAULT '{}'::jsonb
)
RETURNS orders AS $$
DECLARE
  v_order orders;
  v_actor_role order_actor_role := 'system';
  v_patch JSONB := COALESCE(p_metadata_patch, '{}'::jsonb);
  v_previous_source_metadata JSONB := '{}'::jsonb;
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'actor_profile_id é obrigatório';
  END IF;

  IF jsonb_typeof(v_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'metadata_patch deve ser um objeto JSON';
  END IF;

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
  END IF;

  IF NOT (
    v_order.customer_profile_id = p_actor_profile_id
    OR v_order.merchant_profile_id = p_actor_profile_id
    OR v_order.courier_profile_id = p_actor_profile_id
  ) THEN
    RAISE EXCEPTION 'Ator sem permissão para atualizar source_metadata do pedido: %', p_actor_profile_id;
  END IF;

  v_previous_source_metadata := COALESCE(v_order.source_metadata, '{}'::jsonb);

  IF v_order.merchant_profile_id = p_actor_profile_id THEN
    v_actor_role := 'merchant';
  ELSIF v_order.courier_profile_id = p_actor_profile_id THEN
    v_actor_role := 'courier';
  ELSIF v_order.customer_profile_id = p_actor_profile_id THEN
    v_actor_role := 'customer';
  END IF;

  UPDATE orders
  SET
    source_metadata = COALESCE(source_metadata, '{}'::jsonb) || v_patch,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO order_timeline_events (
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
    'Atualização de source_metadata do pedido',
    jsonb_build_object(
      'previous_source_metadata', v_previous_source_metadata,
      'metadata_patch', v_patch
    )
  );

  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION delivery_update_order_source_metadata(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_update_order_source_metadata(UUID, UUID, JSONB) TO authenticated;

COMMENT ON FUNCTION delivery_update_order_source_metadata(UUID, UUID, JSONB) IS
'Atualiza source_metadata via SSOT e registra auditoria em order_timeline_events.';

