-- ============================================================================
-- Route delivery/order mutation RPCs through authenticated Edge broker
-- ============================================================================
-- These privileged functions mutate orders, order_items, timelines and delivery
-- occurrences. Browser clients must use delivery-rpc, which validates the JWT,
-- actor profile ownership/membership and action-specific order role before
-- invoking the backing RPC with service_role.

REVOKE ALL ON FUNCTION public.delivery_create_order(
  uuid,
  uuid,
  uuid,
  public.payment_mode,
  public.delivery_mode,
  public.financial_status,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  public.order_source_type,
  text,
  text,
  jsonb,
  jsonb,
  text,
  text,
  text,
  uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_create_order(
  uuid,
  uuid,
  uuid,
  public.payment_mode,
  public.delivery_mode,
  public.financial_status,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  public.order_source_type,
  text,
  text,
  jsonb,
  jsonb,
  text,
  text,
  text,
  uuid
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_transition_logistics_status(
  uuid,
  public.logistics_status,
  uuid,
  text,
  jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_logistics_status(
  uuid,
  public.logistics_status,
  uuid,
  text,
  jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_mark_picked_up(
  uuid,
  uuid,
  uuid,
  text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(
  uuid,
  uuid,
  uuid,
  text
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_attach_delivery_proof(
  uuid,
  uuid,
  jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_attach_delivery_proof(
  uuid,
  uuid,
  jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_mark_delivered(
  uuid,
  uuid,
  text,
  jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_delivered(
  uuid,
  uuid,
  text,
  jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_transition_financial_status(
  uuid,
  public.financial_status,
  uuid,
  text,
  jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_financial_status(
  uuid,
  public.financial_status,
  uuid,
  text,
  jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_report_occurrence(
  uuid,
  public.delivery_occurrence_type,
  text,
  uuid,
  public.delivery_occurrence_severity,
  jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_report_occurrence(
  uuid,
  public.delivery_occurrence_type,
  text,
  uuid,
  public.delivery_occurrence_severity,
  jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_resolve_occurrence(
  uuid,
  uuid,
  uuid,
  text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_resolve_occurrence(
  uuid,
  uuid,
  uuid,
  text
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_update_order_notes(
  uuid,
  text,
  uuid,
  jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_notes(
  uuid,
  text,
  uuid,
  jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.delivery_update_order_source_metadata(
  uuid,
  uuid,
  jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_source_metadata(
  uuid,
  uuid,
  jsonb
) TO service_role;

COMMENT ON FUNCTION public.delivery_create_order(
  uuid,
  uuid,
  uuid,
  public.payment_mode,
  public.delivery_mode,
  public.financial_status,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  public.order_source_type,
  text,
  text,
  jsonb,
  jsonb,
  text,
  text,
  text,
  uuid
) IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_transition_logistics_status(
  uuid,
  public.logistics_status,
  uuid,
  text,
  jsonb
) IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_mark_picked_up(uuid, uuid, uuid, text)
IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_attach_delivery_proof(uuid, uuid, jsonb)
IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_mark_delivered(uuid, uuid, text, jsonb)
IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_transition_financial_status(
  uuid,
  public.financial_status,
  uuid,
  text,
  jsonb
) IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_report_occurrence(
  uuid,
  public.delivery_occurrence_type,
  text,
  uuid,
  public.delivery_occurrence_severity,
  jsonb
) IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_resolve_occurrence(uuid, uuid, uuid, text)
IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_update_order_notes(uuid, text, uuid, jsonb)
IS 'Backed by delivery-rpc. Direct browser execution is revoked.';
COMMENT ON FUNCTION public.delivery_update_order_source_metadata(uuid, uuid, jsonb)
IS 'Backed by delivery-rpc. Direct browser execution is revoked.';

NOTIFY pgrst, 'reload schema';
