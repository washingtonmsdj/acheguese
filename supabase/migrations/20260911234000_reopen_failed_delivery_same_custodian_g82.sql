-- G82: retire caller-owned successor rides and reopen failed deliveries safely.
--
-- Historical G16 accepted next_ride_id from an administrative payload. That made
-- the caller responsible for creating/selecting a second ride and left pickup /
-- custody semantics outside the privileged transaction. G81 established the
-- safer pattern for custody handoff: keep one canonical delivery and reopen it
-- only after the server has revalidated the physical/operational state.
--
-- G82 applies the same principle when custody does NOT change. A project-admin
-- broker may request a retry, but PostgreSQL owns all invariants and reopens the
-- same ride atomically. next_ride_id is rejected at the outer privileged boundary.

ALTER FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  uuid, jsonb
) RENAME TO mobility_update_failed_delivery_resolution_base_g82;
ALTER FUNCTION public.mobility_update_failed_delivery_resolution_base_g82(
  uuid, jsonb
) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.mobility_update_failed_delivery_resolution_base_g82(
  uuid, jsonb
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.mobility_retry_failed_delivery_same_custodian_g82(
  p_ride_id uuid,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_availability public.driver_availability%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_driver_profile_id uuid;
  v_resolution_status text;
  v_handoff_expiry timestamptz;
  v_clean_metadata jsonb;
  v_rows integer := 0;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_ride_id IS NULL
     OR NULLIF(pg_catalog.btrim(COALESCE(p_notes, '')), '') IS NULL
     OR pg_catalog.length(p_notes) > 2000 THEN
    RAISE EXCEPTION 'invalid failed-delivery retry request' USING ERRCODE = '22023';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride not found' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotent replay after the transaction already reopened this same ride.
  IF v_ride.ride_mode = 'motoboy'
     AND v_ride.status = 'in_delivery'
     AND v_ride.failed_delivery_metadata->>'resolution_action' = 'retry_same_driver'
     AND v_ride.failed_delivery_metadata->>'retry_driver_profile_id' = v_ride.driver_profile_id::text
     AND NULLIF(v_ride.failed_delivery_metadata->>'retry_resumed_at', '') IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'updated', true,
      'ride_id', p_ride_id,
      'resolution_status', 'resolved',
      'retry_reopened', true,
      'already_applied', true,
      'status', 'in_delivery',
      'driver_profile_id', v_ride.driver_profile_id
    );
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy'
     OR v_ride.status IS DISTINCT FROM 'failed_delivery'
     OR v_ride.failed_delivery_metadata IS NULL THEN
    RAISE EXCEPTION 'ride is not a failed motoboy delivery' USING ERRCODE = '22023';
  END IF;

  IF v_ride.failed_delivery_metadata->>'item_current_holder' IS DISTINCT FROM 'driver' THEN
    RAISE EXCEPTION 'retry requires parcel custody to remain with the assigned driver'
      USING ERRCODE = '22023';
  END IF;

  IF v_ride.failed_delivery_metadata->>'item_destination' IS DISTINCT FROM 'awaiting_manual_resolution' THEN
    RAISE EXCEPTION 'same-driver retry requires awaiting_manual_resolution destination'
      USING ERRCODE = '22023';
  END IF;

  v_resolution_status := COALESCE(
    NULLIF(pg_catalog.btrim(v_ride.failed_delivery_metadata->>'resolution_status'), ''),
    'pending'
  );
  IF v_resolution_status = 'resolved' THEN
    RAISE EXCEPTION 'resolved failed delivery cannot be retried' USING ERRCODE = '22023';
  END IF;

  v_handoff_expiry := NULLIF(
    pg_catalog.btrim(v_ride.failed_delivery_metadata->>'handoff_request_expires_at'),
    ''
  )::timestamptz;
  IF v_ride.failed_delivery_metadata->>'resolution_plan' = 'handoff_to_another_driver'
     AND (v_handoff_expiry IS NULL OR v_handoff_expiry > v_now) THEN
    RAISE EXCEPTION 'active handoff must be completed or expire before same-driver retry'
      USING ERRCODE = '22023';
  END IF;

  v_driver_profile_id := v_ride.driver_profile_id;
  IF v_driver_profile_id IS NULL THEN
    RAISE EXCEPTION 'failed delivery has no assigned custodian' USING ERRCODE = '23514';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_driver_profile_id::text, 820047)
  );

  SELECT availability.*
  INTO v_availability
  FROM public.driver_availability availability
  WHERE availability.profile_id = v_driver_profile_id
  FOR UPDATE;

  IF v_availability.profile_id IS NULL
     OR v_availability.active_ride_id IS DISTINCT FROM p_ride_id
     OR v_availability.is_online IS DISTINCT FROM true
     OR v_availability.last_seen_at IS NULL
     OR v_availability.last_seen_at < v_now - interval '5 minutes' THEN
    RAISE EXCEPTION 'current custodian is not actively operating this delivery'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    JOIN public.driver_data driver ON driver.profile_id = profile.id
    WHERE profile.id = v_driver_profile_id
      AND profile.profile_type = 'driver'
      AND profile.is_active = true
      AND NOT (
        (COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false))
        AND (profile.suspended_until IS NULL OR profile.suspended_until > v_now)
      )
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND driver.can_do_delivery = true
  ) THEN
    RAISE EXCEPTION 'current custodian is no longer eligible for delivery operation'
      USING ERRCODE = '22023';
  END IF;

  -- External order custody must still agree with the same physical courier.
  IF v_ride.source_type = 'gastronomy' AND v_ride.source_id IS NOT NULL THEN
    SELECT order_row.*
    INTO v_order
    FROM public.orders order_row
    WHERE order_row.id = v_ride.source_id
    FOR UPDATE;

    IF NOT FOUND
       OR v_order.logistics_status::text IS DISTINCT FROM 'picked_up'
       OR v_order.courier_profile_id IS DISTINCT FROM v_driver_profile_id THEN
      RAISE EXCEPTION 'gastronomy order custody is inconsistent with delivery retry'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Expired handoff intent and historical caller-owned successor linkage cannot
  -- survive into the canonical retry state.
  v_clean_metadata := v_ride.failed_delivery_metadata - ARRAY[
    'next_ride_id',
    'handoff_requested_driver_profile_id',
    'handoff_requested_at',
    'handoff_request_expires_at',
    'handoff_request_distance_m'
  ]::text[];

  UPDATE public.ride_requests request
  SET status = 'in_delivery',
      failed_delivery_metadata = v_clean_metadata || pg_catalog.jsonb_build_object(
        'resolution_status', 'resolved',
        'resolution_plan', 'retry_same_driver',
        'resolution_action', 'retry_same_driver',
        'resolution_item_holder', 'driver',
        'retry_driver_profile_id', v_driver_profile_id::text,
        'retry_resumed_at', v_now,
        'resolution_action_notes', pg_catalog.left(pg_catalog.btrim(p_notes), 2000),
        'resolved_at', v_now
      ),
      updated_at = v_now
  WHERE request.id = p_ride_id
    AND request.status = 'failed_delivery'
    AND request.driver_profile_id = v_driver_profile_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'failed delivery changed during retry authorization'
      USING ERRCODE = '40001';
  END IF;

  -- The driver never stopped owning this active ride. Keep availability bound
  -- to the same ride and refresh the operational heartbeat without advertising
  -- the courier as available for another dispatch.
  UPDATE public.driver_availability
  SET is_available = false,
      active_ride_id = p_ride_id,
      active_ride_mode = 'motoboy',
      busy_since = COALESCE(busy_since, v_now),
      last_seen_at = v_now,
      updated_at = v_now
  WHERE profile_id = v_driver_profile_id
    AND active_ride_id = p_ride_id
    AND is_online = true;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'custodian availability changed during retry authorization'
      USING ERRCODE = '40001';
  END IF;

  INSERT INTO public.ride_state_audit(
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id,
    'failed_delivery',
    'in_delivery',
    'system:failed_delivery_retry',
    pg_catalog.left(pg_catalog.btrim(p_notes), 1000),
    pg_catalog.jsonb_build_object(
      'resolution_action', 'retry_same_driver',
      'custody_changed', false,
      'driver_profile_id', v_driver_profile_id,
      'authority', 'project_admin_retry_command'
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'updated', true,
    'ride_id', p_ride_id,
    'resolution_status', 'resolved',
    'retry_reopened', true,
    'already_applied', false,
    'status', 'in_delivery',
    'driver_profile_id', v_driver_profile_id
  );
END;
$function$;
REVOKE ALL ON FUNCTION private.mobility_retry_failed_delivery_same_custodian_g82(
  uuid, text
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  p_ride_id uuid,
  p_resolution_update jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_retry_requested boolean := false;
  v_notes text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_ride_id IS NULL
     OR p_resolution_update IS NULL
     OR pg_catalog.jsonb_typeof(p_resolution_update) <> 'object'
     OR p_resolution_update = '{}'::jsonb THEN
    RAISE EXCEPTION 'invalid failed delivery resolution update' USING ERRCODE = '22023';
  END IF;

  -- G16 legacy authority is retired. Historical metadata may still contain the
  -- key, but no caller may select or attach a successor ride anymore.
  IF p_resolution_update ? 'next_ride_id' THEN
    RAISE EXCEPTION 'next_ride_id is legacy server-owned metadata and cannot be supplied'
      USING ERRCODE = '22023';
  END IF;

  IF p_resolution_update ? 'retry_delivery_requested' THEN
    IF pg_catalog.jsonb_typeof(p_resolution_update->'retry_delivery_requested') <> 'boolean' THEN
      RAISE EXCEPTION 'retry_delivery_requested must be boolean' USING ERRCODE = '22023';
    END IF;
    v_retry_requested := (p_resolution_update->>'retry_delivery_requested')::boolean;
  END IF;

  IF v_retry_requested THEN
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_object_keys(p_resolution_update) key_name
      WHERE key_name NOT IN ('retry_delivery_requested', 'resolution_action_notes')
    ) THEN
      RAISE EXCEPTION 'retry request contains incompatible fields' USING ERRCODE = '22023';
    END IF;

    v_notes := NULLIF(pg_catalog.btrim(p_resolution_update->>'resolution_action_notes'), '');
    IF v_notes IS NULL OR pg_catalog.length(v_notes) > 2000 THEN
      RAISE EXCEPTION 'retry resolution_action_notes are required' USING ERRCODE = '22023';
    END IF;

    RETURN private.mobility_retry_failed_delivery_same_custodian_g82(
      p_ride_id,
      v_notes
    );
  END IF;

  IF p_resolution_update ? 'retry_delivery_requested' THEN
    RAISE EXCEPTION 'retry_delivery_requested must be true when supplied'
      USING ERRCODE = '22023';
  END IF;

  -- Preserve all G81 handoff behavior and the remaining hardened G16
  -- administrative resolution rules for non-retry commands.
  RETURN private.mobility_update_failed_delivery_resolution_base_g82(
    p_ride_id,
    p_resolution_update
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  uuid, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  uuid, jsonb
) TO service_role;

COMMENT ON FUNCTION public.mobility_update_failed_delivery_resolution_atomic(uuid, jsonb) IS
  'G82 service-only failed-delivery resolution boundary. Rejects caller-owned next_ride_id; G81 owns receiver-confirmed custody handoff; retry_delivery_requested reopens the same driver-held delivery only after server-side custody, availability, eligibility and linked-order checks.';
