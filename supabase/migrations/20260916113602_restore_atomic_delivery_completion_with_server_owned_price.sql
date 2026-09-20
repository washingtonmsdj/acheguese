CREATE OR REPLACE FUNCTION private.mobility_transition_delivery_state_atomic_base_g70(
  p_ride_id uuid,
  p_expected_from_state text,
  p_command text,
  p_changed_by text,
  p_reason text DEFAULT NULL::text,
  p_proof_of_delivery jsonb DEFAULT NULL::jsonb,
  p_final_price numeric DEFAULT NULL::numeric,
  p_failed_delivery_metadata jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_to_state text;
  v_proof jsonb;
  v_failure jsonb;
  v_failure_reason text;
  v_item_destination text;
  v_item_holder text;
  v_resolution_status text;
BEGIN
  IF p_ride_id IS NULL
     OR COALESCE(pg_catalog.btrim(p_expected_from_state), '') = ''
     OR COALESCE(pg_catalog.btrim(p_command), '') = ''
     OR COALESCE(pg_catalog.btrim(p_changed_by), '') = '' THEN
    RAISE EXCEPTION 'invalid delivery transition command' USING ERRCODE = '22023';
  END IF;

  v_to_state := CASE p_command
    WHEN 'confirm_pickup' THEN 'pickup_confirmed'
    WHEN 'confirm_delivery' THEN 'delivered'
    WHEN 'fail_delivery' THEN 'failed_delivery'
    ELSE NULL
  END;

  IF v_to_state IS NULL THEN
    RAISE EXCEPTION 'invalid delivery command' USING ERRCODE = '22023';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy' THEN
    RAISE EXCEPTION 'delivery command requires motoboy ride' USING ERRCODE = '22023';
  END IF;

  IF v_ride.status IS DISTINCT FROM p_expected_from_state THEN
    RAISE EXCEPTION 'ride state changed during delivery command' USING ERRCODE = '40001';
  END IF;

  IF (p_command = 'confirm_pickup' AND p_expected_from_state <> 'driver_arriving')
     OR (p_command IN ('confirm_delivery', 'fail_delivery') AND p_expected_from_state <> 'in_delivery') THEN
    RAISE EXCEPTION 'invalid delivery state for command' USING ERRCODE = '22023';
  END IF;

  IF p_command = 'confirm_pickup' THEN
    IF p_proof_of_delivery IS NOT NULL OR p_final_price IS NOT NULL OR p_failed_delivery_metadata IS NOT NULL THEN
      RAISE EXCEPTION 'pickup command does not accept delivery metadata' USING ERRCODE = '22023';
    END IF;

    UPDATE public.ride_requests request
    SET status = v_to_state,
        pickup_confirmed_at = COALESCE(request.pickup_confirmed_at, v_now),
        updated_at = v_now
    WHERE request.id = p_ride_id;

  ELSIF p_command = 'confirm_delivery' THEN
    IF p_failed_delivery_metadata IS NOT NULL THEN
      RAISE EXCEPTION 'delivery confirmation does not accept failure metadata' USING ERRCODE = '22023';
    END IF;

    IF p_proof_of_delivery IS NULL OR pg_catalog.jsonb_typeof(p_proof_of_delivery) <> 'object' THEN
      RAISE EXCEPTION 'proof_of_delivery must be an object' USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_object_keys(p_proof_of_delivery) AS key_name
      WHERE key_name NOT IN ('photo_url', 'code', 'observation')
    ) THEN
      RAISE EXCEPTION 'proof_of_delivery contains unsupported fields' USING ERRCODE = '22023';
    END IF;

    IF (p_proof_of_delivery ? 'photo_url' AND pg_catalog.jsonb_typeof(p_proof_of_delivery->'photo_url') <> 'string')
       OR (p_proof_of_delivery ? 'code' AND pg_catalog.jsonb_typeof(p_proof_of_delivery->'code') <> 'string')
       OR (p_proof_of_delivery ? 'observation' AND pg_catalog.jsonb_typeof(p_proof_of_delivery->'observation') <> 'string') THEN
      RAISE EXCEPTION 'proof_of_delivery fields must be strings' USING ERRCODE = '22023';
    END IF;

    IF COALESCE(pg_catalog.length(NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'photo_url'), '')), 0) > 2048
       OR COALESCE(pg_catalog.length(NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'code'), '')), 0) > 128
       OR COALESCE(pg_catalog.length(NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'observation'), '')), 0) > 1000 THEN
      RAISE EXCEPTION 'proof_of_delivery field is too long' USING ERRCODE = '22023';
    END IF;

    IF NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'photo_url'), '') IS NULL
       AND NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'code'), '') IS NULL
       AND NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'observation'), '') IS NULL THEN
      RAISE EXCEPTION 'proof_of_delivery requires at least one proof field' USING ERRCODE = '22023';
    END IF;

    v_proof := pg_catalog.jsonb_strip_nulls(
      pg_catalog.jsonb_build_object(
        'photo_url', NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'photo_url'), ''),
        'code', NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'code'), ''),
        'observation', NULLIF(pg_catalog.btrim(p_proof_of_delivery->>'observation'), ''),
        'signed_at', v_now
      )
    );

    UPDATE public.ride_requests request
    SET status = v_to_state,
        delivered_at = COALESCE(request.delivered_at, v_now),
        proof_of_delivery = v_proof,
        final_price = COALESCE(request.final_price, request.suggested_price),
        updated_at = v_now
    WHERE request.id = p_ride_id;

  ELSE
    IF p_proof_of_delivery IS NOT NULL OR p_final_price IS NOT NULL THEN
      RAISE EXCEPTION 'failure command does not accept delivery proof/final price' USING ERRCODE = '22023';
    END IF;

    IF p_failed_delivery_metadata IS NULL
       OR pg_catalog.jsonb_typeof(p_failed_delivery_metadata) <> 'object' THEN
      RAISE EXCEPTION 'failed_delivery_metadata must be an object' USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_object_keys(p_failed_delivery_metadata) AS key_name
      WHERE key_name NOT IN (
        'failure_reason','item_destination','item_current_holder','timestamp',
        'resolution_status','resolution_notes','failed_at_location','photos',
        'attempt_number','attempted_delivery_count','next_ride_id',
        'handoff_driver_profile_id','manual_resolution_owner_profile_id',
        'resolved_at','resolution_action_notes'
      )
    ) THEN
      RAISE EXCEPTION 'failed_delivery_metadata contains unsupported fields' USING ERRCODE = '22023';
    END IF;

    v_failure_reason := NULLIF(pg_catalog.btrim(p_failed_delivery_metadata->>'failure_reason'), '');
    v_item_destination := NULLIF(pg_catalog.btrim(p_failed_delivery_metadata->>'item_destination'), '');
    v_item_holder := NULLIF(pg_catalog.btrim(p_failed_delivery_metadata->>'item_current_holder'), '');
    v_resolution_status := COALESCE(
      NULLIF(pg_catalog.btrim(p_failed_delivery_metadata->>'resolution_status'), ''),
      'pending'
    );

    IF v_failure_reason NOT IN (
      'recipient_unavailable','address_not_found','address_inaccessible',
      'recipient_refused','vehicle_issue','driver_unavailable',
      'safety_issue','package_damaged','other'
    ) THEN
      RAISE EXCEPTION 'invalid failure_reason' USING ERRCODE = '22023';
    END IF;

    IF v_item_destination NOT IN (
      'return_to_sender','handoff_to_another_driver','awaiting_manual_resolution'
    ) THEN
      RAISE EXCEPTION 'invalid item_destination' USING ERRCODE = '22023';
    END IF;

    IF v_item_holder NOT IN ('driver','sender','other_driver','hub') THEN
      RAISE EXCEPTION 'invalid item_current_holder' USING ERRCODE = '22023';
    END IF;

    IF v_resolution_status NOT IN ('pending','in_progress','resolved','escalated') THEN
      RAISE EXCEPTION 'invalid resolution_status' USING ERRCODE = '22023';
    END IF;

    IF v_failure_reason = 'other'
       AND NULLIF(pg_catalog.btrim(p_failed_delivery_metadata->>'resolution_notes'), '') IS NULL THEN
      RAISE EXCEPTION 'resolution_notes is required for other failure_reason' USING ERRCODE = '22023';
    END IF;

    IF p_failed_delivery_metadata ? 'attempt_number'
       AND (
         pg_catalog.jsonb_typeof(p_failed_delivery_metadata->'attempt_number') <> 'number'
         OR (p_failed_delivery_metadata->>'attempt_number')::numeric < 0
       ) THEN
      RAISE EXCEPTION 'invalid attempt_number' USING ERRCODE = '22023';
    END IF;

    IF p_failed_delivery_metadata ? 'attempted_delivery_count'
       AND (
         pg_catalog.jsonb_typeof(p_failed_delivery_metadata->'attempted_delivery_count') <> 'number'
         OR (p_failed_delivery_metadata->>'attempted_delivery_count')::numeric < 0
       ) THEN
      RAISE EXCEPTION 'invalid attempted_delivery_count' USING ERRCODE = '22023';
    END IF;

    IF p_failed_delivery_metadata ? 'photos'
       AND pg_catalog.jsonb_typeof(p_failed_delivery_metadata->'photos') <> 'array' THEN
      RAISE EXCEPTION 'photos must be an array' USING ERRCODE = '22023';
    END IF;

    IF p_failed_delivery_metadata ? 'photos'
       AND EXISTS (
         SELECT 1
         FROM pg_catalog.jsonb_array_elements(p_failed_delivery_metadata->'photos') AS photo
         WHERE pg_catalog.jsonb_typeof(photo) <> 'string'
            OR pg_catalog.length(photo #>> '{}') > 2048
       ) THEN
      RAISE EXCEPTION 'invalid photos entry' USING ERRCODE = '22023';
    END IF;

    IF p_failed_delivery_metadata ? 'failed_at_location' THEN
      IF pg_catalog.jsonb_typeof(p_failed_delivery_metadata->'failed_at_location') <> 'object' THEN
        RAISE EXCEPTION 'failed_at_location must be an object' USING ERRCODE = '22023';
      END IF;
      IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_object_keys(p_failed_delivery_metadata->'failed_at_location') AS key_name
        WHERE key_name NOT IN ('lat','lng','address')
      ) THEN
        RAISE EXCEPTION 'failed_at_location contains unsupported fields' USING ERRCODE = '22023';
      END IF;
    END IF;

    v_failure := p_failed_delivery_metadata
      || pg_catalog.jsonb_build_object(
        'timestamp', v_now,
        'resolution_status', v_resolution_status
      );

    UPDATE public.ride_requests request
    SET status = v_to_state,
        failed_delivery_at = COALESCE(request.failed_delivery_at, v_now),
        failed_delivery_reason = v_failure_reason,
        failed_delivery_metadata = v_failure,
        updated_at = v_now
    WHERE request.id = p_ride_id;
  END IF;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, created_at
  ) VALUES (
    p_ride_id,
    p_expected_from_state,
    v_to_state,
    pg_catalog.left(pg_catalog.btrim(p_changed_by), 128),
    NULLIF(pg_catalog.left(COALESCE(p_reason, ''), 1000), ''),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'updated', TRUE,
    'ride_id', p_ride_id,
    'from_state', p_expected_from_state,
    'to_state', v_to_state
  );
END;
$function$;

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
        'failure_reason','item_destination','item_current_holder','timestamp',
        'resolution_status','resolution_notes','failed_at_location','photos',
        'attempt_number','attempted_delivery_count'
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
) IS 'G70 service-only delivery command boundary. final price is server-owned from persisted quote/ride data; p_final_price is compatibility-only and ignored by confirm_delivery; confirm_delivery records delivered and completed atomically.';

NOTIFY pgrst, 'reload schema';
