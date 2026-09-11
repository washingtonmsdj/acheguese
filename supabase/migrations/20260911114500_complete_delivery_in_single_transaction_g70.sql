BEGIN;

-- G70: delivery confirmation is one transactional command without creating a
-- second public API. The existing public RPC is wrapped: pickup/failure keep
-- delegating to the proven G6 implementation; confirm_delivery additionally
-- closes delivered -> completed before the database call returns.
--
-- Because both transitions execute inside this single SQL function invocation,
-- any error in the terminal step rolls the proof/delivered mutation back too.
ALTER FUNCTION public.mobility_transition_delivery_state_atomic(
  uuid, text, text, text, text, jsonb, numeric, jsonb
) RENAME TO mobility_transition_delivery_state_atomic_base_g70;

ALTER FUNCTION public.mobility_transition_delivery_state_atomic_base_g70(
  uuid, text, text, text, text, jsonb, numeric, jsonb
) SET SCHEMA private;

REVOKE ALL ON FUNCTION private.mobility_transition_delivery_state_atomic_base_g70(
  uuid, text, text, text, text, jsonb, numeric, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.mobility_transition_delivery_state_atomic_base_g70(
  uuid, text, text, text, text, jsonb, numeric, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_transition_delivery_state_atomic(
  p_ride_id uuid,
  p_expected_from_state text,
  p_command text,
  p_changed_by text,
  p_reason text DEFAULT NULL,
  p_proof_of_delivery jsonb DEFAULT NULL,
  p_final_price numeric DEFAULT NULL,
  p_failed_delivery_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_delivery jsonb;
  v_completed jsonb;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role is required' USING ERRCODE = '42501';
  END IF;

  v_delivery := private.mobility_transition_delivery_state_atomic_base_g70(
    p_ride_id,
    p_expected_from_state,
    p_command,
    p_changed_by,
    p_reason,
    p_proof_of_delivery,
    p_final_price,
    p_failed_delivery_metadata
  );

  IF p_command <> 'confirm_delivery' THEN
    RETURN v_delivery;
  END IF;

  IF COALESCE(v_delivery->>'updated', 'false') <> 'true'
     OR v_delivery->>'to_state' IS DISTINCT FROM 'delivered' THEN
    RAISE EXCEPTION 'delivery confirmation did not reach delivered state'
      USING ERRCODE = '40001';
  END IF;

  v_completed := public.mobility_transition_ride_state_atomic(
    p_ride_id,
    'delivered',
    'completed',
    p_changed_by,
    COALESCE(NULLIF(pg_catalog.btrim(p_reason), ''), 'Delivery completed')
  );

  IF COALESCE(v_completed->>'updated', 'false') <> 'true'
     OR v_completed->>'to_state' IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'delivery completion did not reach completed state'
      USING ERRCODE = '40001';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'updated', TRUE,
    'ride_id', p_ride_id,
    'from_state', p_expected_from_state,
    'to_state', 'completed',
    'delivered_recorded', TRUE
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_transition_delivery_state_atomic(
  uuid, text, text, text, text, jsonb, numeric, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_transition_delivery_state_atomic(
  uuid, text, text, text, text, jsonb, numeric, jsonb
) TO service_role;

COMMENT ON FUNCTION public.mobility_transition_delivery_state_atomic(
  uuid, text, text, text, text, jsonb, numeric, jsonb
) IS
  'G70 service-only delivery command boundary. confirm_delivery persists proof, records delivered and closes completed atomically; pickup/failure delegate to the prior validated implementation.';

NOTIFY pgrst, 'reload schema';

COMMIT;
