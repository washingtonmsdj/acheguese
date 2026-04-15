-- ══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO: Funções de Delivery com Parâmetros Opcionais
-- ══════════════════════════════════════════════════════════════════════════
-- Criado: 2026-04-15
-- Descrição: Corrige funções RPC para usar parâmetros com valores padrão
-- ══════════════════════════════════════════════════════════════════════════

-- Remover funções antigas
DROP FUNCTION IF EXISTS delivery_mark_picked_up(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS delivery_attach_delivery_proof(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS delivery_mark_delivered(UUID, UUID, TEXT, JSONB);

-- Recriar com parâmetros opcionais
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

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
