-- ============================================================================
-- Revoke anon execution from privileged delivery/order RPCs
-- ============================================================================
-- Earlier migrations removed PUBLIC execution, but the live project had explicit
-- anon grants on these RPCs. Privileged entrypoints must remain callable
-- only by authenticated users and service_role because authorization depends on
-- auth.uid() and actor_profile_id ownership checks.
-- ============================================================================

REVOKE ALL ON FUNCTION public.delivery_create_order(UUID, UUID, UUID, public.payment_mode, public.delivery_mode, public.financial_status, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, public.order_source_type, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_transition_logistics_status(UUID, public.logistics_status, UUID, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_attach_delivery_proof(UUID, UUID, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_transition_financial_status(UUID, public.financial_status, UUID, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_report_occurrence(UUID, public.delivery_occurrence_type, TEXT, UUID, public.delivery_occurrence_severity, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_update_order_notes(UUID, TEXT, UUID, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.delivery_update_order_source_metadata(UUID, UUID, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.auth_can_access_profile(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_delivery_order_actor_role(UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.delivery_create_order(UUID, UUID, UUID, public.payment_mode, public.delivery_mode, public.financial_status, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, public.order_source_type, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_logistics_status(UUID, public.logistics_status, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_attach_delivery_proof(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_financial_status(UUID, public.financial_status, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_report_occurrence(UUID, public.delivery_occurrence_type, TEXT, UUID, public.delivery_occurrence_severity, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_notes(UUID, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_source_metadata(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_create_order(UUID, UUID, UUID, public.payment_mode, public.delivery_mode, public.financial_status, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, public.order_source_type, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_transition_logistics_status(UUID, public.logistics_status, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_attach_delivery_proof(UUID, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_transition_financial_status(UUID, public.financial_status, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_report_occurrence(UUID, public.delivery_occurrence_type, TEXT, UUID, public.delivery_occurrence_severity, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_resolve_occurrence(UUID, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_notes(UUID, TEXT, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_update_order_source_metadata(UUID, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_can_access_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_can_access_profile(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_order_actor_role(UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_order_actor_role(UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) TO service_role;
NOTIFY pgrst, 'reload schema';
