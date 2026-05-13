-- ============================================================================
-- DELIVERY SSOT: RPC canônico para atualização de notas do pedido
-- ============================================================================
-- Objetivo:
-- - evitar escrita direta em orders no app
-- - manter auditoria via order_timeline_events
-- - aplicar validações de segurança no servidor
-- ============================================================================

CREATE OR REPLACE FUNCTION delivery_update_order_notes(
  p_order_id UUID,
  p_notes TEXT,
  p_actor_profile_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS orders AS $$
DECLARE
  v_order orders;
  v_previous_notes TEXT;
  v_actor_role order_actor_role := 'system';
  v_notes TEXT;
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'actor_profile_id é obrigatório';
  END IF;

  IF p_notes IS NULL OR btrim(p_notes) = '' THEN
    RAISE EXCEPTION 'notes é obrigatório';
  END IF;

  v_notes := left(btrim(p_notes), 1000);

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
    RAISE EXCEPTION 'Ator sem permissão para atualizar notas do pedido: %', p_actor_profile_id;
  END IF;

  v_previous_notes := v_order.notes;

  IF v_order.merchant_profile_id = p_actor_profile_id THEN
    v_actor_role := 'merchant';
  ELSIF v_order.courier_profile_id = p_actor_profile_id THEN
    v_actor_role := 'courier';
  ELSIF v_order.customer_profile_id = p_actor_profile_id THEN
    v_actor_role := 'customer';
  END IF;

  UPDATE orders
  SET
    notes = v_notes,
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
    'order_notes_updated',
    p_actor_profile_id,
    v_actor_role,
    'Atualização de observações do pedido',
    jsonb_build_object(
      'previous_notes', COALESCE(v_previous_notes, ''),
      'updated_notes', v_notes
    ) || COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION delivery_update_order_notes(UUID, TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delivery_update_order_notes(UUID, TEXT, UUID, JSONB) TO authenticated;

COMMENT ON FUNCTION delivery_update_order_notes(UUID, TEXT, UUID, JSONB) IS
'Atualiza notes do pedido via SSOT e registra evento de auditoria em order_timeline_events.';

