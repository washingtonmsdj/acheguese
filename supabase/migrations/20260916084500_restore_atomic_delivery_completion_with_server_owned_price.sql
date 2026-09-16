BEGIN;

-- Reconcile G70 delivery completion with the server-owned pricing contract.
--
-- Compatibility note: p_final_price remains in the public signature only so
-- already-deployed brokers cannot break during rollout. The wrapper never
-- forwards that value to the base implementation. Price authority stays in the
-- persisted quote/ride state and the client cannot override it at completion.
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

  -- G55/G70 fail-closed snapshot authority. The browser/broker may report only
  -- the initial failure snapshot; custody and resolution remain server-owned.
  IF p_command = 'fail_delivery' THEN
    IF p_failed_delivery_metadata IS NULL
       OR pg_catalog.jsonb_typeof(p_failed_delivery_metadata) <> 'object'
       OR p_failed_delivery_metadata = '{}'::jsonb THEN
      RAISE EXCEPTION 'failed delivery snapshot is required'
        USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_object_keys(p_failed_delivery_metadata) AS key_name
      WHERE key_name NOT IN (
        'failure_reason',
        'item_destination',
        'item_current_holder',
        'timestamp',
        'resolution_status',
        'resolution_notes',
        'failed_at_location',
        'photos',
        'attempt_number',
        'attempted_delivery_count'
      )
    ) THEN
      RAISE EXCEPTION 'failed delivery snapshot contains server-owned or unsupported fields'
        USING ERRCODE = '22023';
    END IF;

    IF NULLIF(pg_catalog.btrim(p_failed_delivery_metadata->>'item_current_holder'), '')
       IS DISTINCT FROM 'driver' THEN
      RAISE EXCEPTION 'initial failed delivery custody must remain with driver'
        USING ERRCODE = '22023';
    END IF;

    IF COALESCE(
         NULLIF(pg_catalog.btrim(p_failed_delivery_metadata->>'resolution_status'), ''),
         'pending'
       ) IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'initial failed delivery resolution status must be pending'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  v_delivery := private.mobility_transition_delivery_state_atomic_base_g70(
    p_ride_id,
    p_expected_from_state,
    p_command,
    p_changed_by,
    p_reason,
    p_proof_of_delivery,
    NULL::numeric,
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

  -- The quoted amount persisted on the ride is the monetary authority. This
  -- also repairs historical bases that left final_price NULL when no override
  -- was supplied.
  UPDATE public.ride_requests AS request
  SET final_price = COALESCE(request.final_price, request.suggested_price),
      updated_at = pg_catalog.clock_timestamp()
  WHERE request.id = p_ride_id;

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
  'G70 service-only delivery boundary. p_final_price is compatibility-only and ignored; price comes from persisted quote/ride data; confirm_delivery records delivered and completed atomically.';

NOTIFY pgrst, 'reload schema';

COMMIT;
