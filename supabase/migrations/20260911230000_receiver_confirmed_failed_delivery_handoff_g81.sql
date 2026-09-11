BEGIN;

-- G81 consolidates the final G45-G54 custody model on top of the current
-- canonical lifecycle. An admin may select/request a nearby receiver, but the
-- package remains with the failed-delivery driver until that exact receiver,
-- authenticated by the broker, accepts. The generic ride transition command
-- remains unable to perform failed_delivery -> in_delivery.

-- ---------------------------------------------------------------------------
-- Admin candidate discovery. Ordinary discovery keeps its current authority;
-- failed-delivery discovery is a narrower <=500m admin-only surface.
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.mobility_find_available_drivers_for_ride(
  uuid, uuid, numeric, integer
) RENAME TO mobility_find_available_drivers_for_ride_base_g81;
ALTER FUNCTION public.mobility_find_available_drivers_for_ride_base_g81(
  uuid, uuid, numeric, integer
) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.mobility_find_available_drivers_for_ride_base_g81(
  uuid, uuid, numeric, integer
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mobility_find_available_drivers_for_ride(
  p_actor_user_id uuid,
  p_ride_id uuid,
  p_radius_km numeric DEFAULT 15,
  p_limit integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_current public.driver_availability%ROWTYPE;
  v_city_id uuid;
  v_radius numeric;
  v_result jsonb;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  SELECT request.* INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride not found' USING ERRCODE = '22023';
  END IF;

  IF v_ride.status IS DISTINCT FROM 'failed_delivery' THEN
    RETURN private.mobility_find_available_drivers_for_ride_base_g81(
      p_actor_user_id, p_ride_id, p_radius_km, p_limit
    );
  END IF;

  IF NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'Admin authority is required for failed-delivery handoff discovery'
      USING ERRCODE = '42501';
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy'
     OR v_ride.driver_profile_id IS NULL
     OR v_ride.failed_delivery_metadata IS NULL
     OR v_ride.failed_delivery_metadata->>'item_current_holder' IS DISTINCT FROM 'driver'
     OR v_ride.failed_delivery_metadata->>'item_destination' IS DISTINCT FROM 'handoff_to_another_driver'
     OR COALESCE(NULLIF(pg_catalog.btrim(v_ride.failed_delivery_metadata->>'resolution_status'), ''), 'pending') = 'resolved' THEN
    RAISE EXCEPTION 'Ride is not eligible for failed-delivery handoff discovery'
      USING ERRCODE = '22023';
  END IF;

  IF p_radius_km IS NULL OR p_radius_km <= 0 OR p_radius_km > 100
     OR p_limit NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid handoff discovery bounds' USING ERRCODE = '22023';
  END IF;

  SELECT availability.* INTO v_current
  FROM public.driver_availability availability
  WHERE availability.profile_id = v_ride.driver_profile_id;

  IF NOT FOUND
     OR v_current.active_ride_id IS DISTINCT FROM p_ride_id
     OR v_current.current_lat IS NULL
     OR v_current.current_lng IS NULL
     OR v_current.last_location_update IS NULL
     OR v_current.last_location_update < pg_catalog.now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'Current package custodian has no fresh operational location'
      USING ERRCODE = '22023';
  END IF;

  v_city_id := private.mobility_operational_city_id(v_ride.pickup_location_id);
  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'Ride operational city is required' USING ERRCODE = '42501';
  END IF;

  v_radius := LEAST(p_radius_km, 0.5);

  WITH candidates AS (
    SELECT
      profile.id AS profile_id,
      driver.rating,
      availability.current_lat,
      availability.current_lng,
      availability.last_seen_at,
      (
        public.ST_DistanceSphere(
          public.ST_MakePoint(availability.current_lng, availability.current_lat),
          public.ST_MakePoint(v_current.current_lng, v_current.current_lat)
        ) / 1000.0
      )::numeric AS distance_km,
      private.build_trust_policy_decision(
        profile.id,
        'courier'::public.trust_actor_role
      ) AS trust_decision
    FROM public.profiles profile
    JOIN public.driver_data driver ON driver.profile_id = profile.id
    JOIN public.driver_availability availability ON availability.profile_id = profile.id
    WHERE profile.id IS DISTINCT FROM v_ride.driver_profile_id
      AND profile.profile_type = 'driver'
      AND profile.is_active = true
      AND NOT (
        (COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false))
        AND (profile.suspended_until IS NULL OR profile.suspended_until > pg_catalog.now())
      )
      AND profile.user_id IS DISTINCT FROM (
        SELECT passenger.user_id
        FROM public.profiles passenger
        WHERE passenger.id = v_ride.passenger_profile_id
      )
      AND private.mobility_operational_city_id(profile.location_id) = v_city_id
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND driver.can_do_delivery = true
      AND availability.is_online = true
      AND availability.is_available = true
      AND availability.active_ride_id IS NULL
      AND availability.current_lat IS NOT NULL
      AND availability.current_lng IS NOT NULL
      AND availability.last_seen_at >= pg_catalog.now() - interval '5 minutes'
      AND availability.last_location_update >= pg_catalog.now() - interval '5 minutes'
      AND NOT EXISTS (
        SELECT 1
        FROM public.ride_requests active
        WHERE active.driver_profile_id = profile.id
          AND active.id <> p_ride_id
          AND active.status IN (
            'driver_assigned','driver_accepted','driver_arriving',
            'passenger_boarded','in_progress','pickup_confirmed','in_delivery'
          )
      )
  ), eligible AS (
    SELECT * FROM candidates
    WHERE distance_km <= v_radius
      AND COALESCE(trust_decision->>'dispatch_policy', '') <> 'block_until_admin_review'
    ORDER BY distance_km, rating DESC NULLS LAST, profile_id
    LIMIT p_limit
  )
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'profile_id', profile_id,
      'distance_km', distance_km,
      'rating', rating,
      'current_lat', current_lat,
      'current_lng', current_lng,
      'last_seen_at', last_seen_at,
      'risk_level', trust_decision->>'risk_level',
      'dispatch_policy', trust_decision->>'dispatch_policy'
    )),
    '[]'::jsonb
  ) INTO v_result
  FROM eligible;

  RETURN pg_catalog.jsonb_build_object('drivers', v_result);
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_find_available_drivers_for_ride(
  uuid, uuid, numeric, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_find_available_drivers_for_ride(
  uuid, uuid, numeric, integer
) TO service_role;

-- ---------------------------------------------------------------------------
-- Admin request. Direct administrative custody transfer is retired: supplying
-- handoff_driver_profile_id without handoff_requested=true now fails closed.
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  uuid, jsonb
) RENAME TO mobility_update_failed_delivery_resolution_base_g81;
ALTER FUNCTION public.mobility_update_failed_delivery_resolution_base_g81(
  uuid, jsonb
) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.mobility_update_failed_delivery_resolution_base_g81(
  uuid, jsonb
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.mobility_request_failed_delivery_handoff_g81(
  p_ride_id uuid,
  p_target_driver_profile_id uuid,
  p_resolution_action_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_from public.driver_availability%ROWTYPE;
  v_target public.driver_availability%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_expires_at timestamptz := v_now + interval '5 minutes';
  v_notes text;
  v_existing_target uuid;
  v_existing_expiry timestamptz;
  v_city_id uuid;
  v_target_city_id uuid;
  v_trust jsonb;
  v_distance_m numeric;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  v_notes := NULLIF(pg_catalog.btrim(COALESCE(p_resolution_action_notes, '')), '');
  IF p_ride_id IS NULL OR p_target_driver_profile_id IS NULL
     OR v_notes IS NULL OR pg_catalog.length(v_notes) > 2000 THEN
    RAISE EXCEPTION 'ride, target driver and valid handoff notes are required'
      USING ERRCODE = '22023';
  END IF;

  SELECT request.* INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy'
     OR v_ride.status IS DISTINCT FROM 'failed_delivery'
     OR v_ride.driver_profile_id IS NULL
     OR v_ride.failed_delivery_metadata IS NULL
     OR v_ride.failed_delivery_metadata->>'item_current_holder' IS DISTINCT FROM 'driver'
     OR v_ride.failed_delivery_metadata->>'item_destination' IS DISTINCT FROM 'handoff_to_another_driver'
     OR COALESCE(NULLIF(pg_catalog.btrim(v_ride.failed_delivery_metadata->>'resolution_status'), ''), 'pending') = 'resolved'
     OR NULLIF(pg_catalog.btrim(v_ride.failed_delivery_metadata->>'resolution_item_holder'), '') IS NOT NULL
     OR NULLIF(pg_catalog.btrim(v_ride.failed_delivery_metadata->>'next_ride_id'), '') IS NOT NULL THEN
    RAISE EXCEPTION 'ride is not awaiting a physical custody handoff'
      USING ERRCODE = '22023';
  END IF;

  IF v_ride.driver_profile_id IS NOT DISTINCT FROM p_target_driver_profile_id THEN
    RAISE EXCEPTION 'handoff target must differ from current custodian'
      USING ERRCODE = '22023';
  END IF;

  v_existing_target := NULLIF(
    pg_catalog.btrim(v_ride.failed_delivery_metadata->>'handoff_requested_driver_profile_id'),
    ''
  )::uuid;
  v_existing_expiry := NULLIF(
    pg_catalog.btrim(v_ride.failed_delivery_metadata->>'handoff_request_expires_at'),
    ''
  )::timestamptz;

  IF v_ride.failed_delivery_metadata->>'resolution_status' = 'in_progress'
     AND v_ride.failed_delivery_metadata->>'resolution_plan' = 'handoff_to_another_driver'
     AND v_existing_expiry IS NOT NULL AND v_existing_expiry > v_now THEN
    IF v_existing_target IS NOT DISTINCT FROM p_target_driver_profile_id THEN
      RETURN pg_catalog.jsonb_build_object(
        'updated', true,
        'ride_id', p_ride_id,
        'resolution_status', 'in_progress',
        'handoff_requested', true,
        'already_requested', true,
        'handoff_driver_profile_id', p_target_driver_profile_id,
        'handoff_request_expires_at', v_existing_expiry
      );
    END IF;
    RAISE EXCEPTION 'another handoff request is still active' USING ERRCODE = '40001';
  END IF;

  -- Serialize every live request for this receiver, including requests from
  -- different failed rides, without reserving custody before acceptance.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_target_driver_profile_id::text, 810047)
  );

  PERFORM availability.profile_id
  FROM public.driver_availability availability
  WHERE availability.profile_id IN (v_ride.driver_profile_id, p_target_driver_profile_id)
  ORDER BY availability.profile_id
  FOR UPDATE;

  SELECT availability.* INTO v_from
  FROM public.driver_availability availability
  WHERE availability.profile_id = v_ride.driver_profile_id;
  SELECT availability.* INTO v_target
  FROM public.driver_availability availability
  WHERE availability.profile_id = p_target_driver_profile_id;

  IF v_from.profile_id IS NULL
     OR v_from.active_ride_id IS DISTINCT FROM p_ride_id
     OR v_from.current_lat IS NULL OR v_from.current_lng IS NULL
     OR v_from.last_location_update IS NULL
     OR v_from.last_location_update < v_now - interval '5 minutes' THEN
    RAISE EXCEPTION 'current package custodian has no fresh operational location'
      USING ERRCODE = '22023';
  END IF;

  IF v_target.profile_id IS NULL
     OR v_target.is_online IS DISTINCT FROM true
     OR v_target.is_available IS DISTINCT FROM true
     OR v_target.active_ride_id IS NOT NULL
     OR v_target.current_lat IS NULL OR v_target.current_lng IS NULL
     OR v_target.last_seen_at IS NULL OR v_target.last_seen_at < v_now - interval '5 minutes'
     OR v_target.last_location_update IS NULL OR v_target.last_location_update < v_now - interval '5 minutes' THEN
    RAISE EXCEPTION 'handoff target is not freshly available' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.ride_requests competing
    WHERE competing.id <> p_ride_id
      AND competing.status = 'failed_delivery'
      AND competing.failed_delivery_metadata->>'resolution_status' = 'in_progress'
      AND competing.failed_delivery_metadata->>'resolution_plan' = 'handoff_to_another_driver'
      AND competing.failed_delivery_metadata->>'handoff_requested_driver_profile_id' = p_target_driver_profile_id::text
      AND NULLIF(pg_catalog.btrim(competing.failed_delivery_metadata->>'handoff_request_expires_at'), '')::timestamptz > v_now
  ) THEN
    RAISE EXCEPTION 'handoff target already has another live request' USING ERRCODE = '40001';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    JOIN public.driver_data driver ON driver.profile_id = profile.id
    WHERE profile.id = p_target_driver_profile_id
      AND profile.profile_type = 'driver'
      AND profile.is_active = true
      AND NOT (
        (COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false))
        AND (profile.suspended_until IS NULL OR profile.suspended_until > v_now)
      )
      AND profile.user_id IS DISTINCT FROM (
        SELECT passenger.user_id FROM public.profiles passenger
        WHERE passenger.id = v_ride.passenger_profile_id
      )
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND driver.can_do_delivery = true
  ) THEN
    RAISE EXCEPTION 'handoff target is not an eligible delivery driver'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.ride_requests active
    WHERE active.driver_profile_id = p_target_driver_profile_id
      AND active.id <> p_ride_id
      AND active.status IN (
        'driver_assigned','driver_accepted','driver_arriving',
        'passenger_boarded','in_progress','pickup_confirmed','in_delivery'
      )
  ) THEN
    RAISE EXCEPTION 'handoff target already has an active or reserved ride'
      USING ERRCODE = '22023';
  END IF;

  v_city_id := private.mobility_operational_city_id(v_ride.pickup_location_id);
  SELECT private.mobility_operational_city_id(profile.location_id)
  INTO v_target_city_id
  FROM public.profiles profile
  WHERE profile.id = p_target_driver_profile_id;
  IF v_city_id IS NULL OR v_target_city_id IS DISTINCT FROM v_city_id THEN
    RAISE EXCEPTION 'handoff target is outside the ride operational city'
      USING ERRCODE = '42501';
  END IF;

  v_trust := private.build_trust_policy_decision(
    p_target_driver_profile_id,
    'courier'::public.trust_actor_role
  );
  IF COALESCE(v_trust->>'dispatch_policy', '') = 'block_until_admin_review' THEN
    RAISE EXCEPTION 'handoff target is blocked by trust policy' USING ERRCODE = '42501';
  END IF;

  v_distance_m := public.ST_DistanceSphere(
    public.ST_MakePoint(v_from.current_lng, v_from.current_lat),
    public.ST_MakePoint(v_target.current_lng, v_target.current_lat)
  )::numeric;
  IF v_distance_m > 500 THEN
    RAISE EXCEPTION 'handoff target must be within 500 meters at request time'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.ride_requests request
  SET failed_delivery_metadata = request.failed_delivery_metadata || pg_catalog.jsonb_build_object(
        'resolution_status', 'in_progress',
        'resolution_plan', 'handoff_to_another_driver',
        'resolution_action_notes', v_notes,
        'handoff_requested_driver_profile_id', p_target_driver_profile_id::text,
        'handoff_requested_at', v_now,
        'handoff_request_expires_at', v_expires_at,
        'handoff_request_distance_m', v_distance_m
      ),
      updated_at = v_now
  WHERE request.id = p_ride_id AND request.status = 'failed_delivery';

  INSERT INTO public.ride_state_audit(
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id, 'failed_delivery', 'failed_delivery', 'admin:mobility-rpc',
    pg_catalog.left(v_notes, 1000),
    pg_catalog.jsonb_build_object(
      'event', 'handoff_requested',
      'requested_driver_profile_id', p_target_driver_profile_id,
      'request_distance_m', v_distance_m,
      'request_expires_at', v_expires_at,
      'trust_risk_level', v_trust->>'risk_level',
      'trust_dispatch_policy', v_trust->>'dispatch_policy'
    ), v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'updated', true,
    'ride_id', p_ride_id,
    'resolution_status', 'in_progress',
    'handoff_requested', true,
    'already_requested', false,
    'handoff_driver_profile_id', p_target_driver_profile_id,
    'handoff_request_expires_at', v_expires_at
  );
END;
$function$;
REVOKE ALL ON FUNCTION private.mobility_request_failed_delivery_handoff_g81(
  uuid, uuid, text
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
  v_requested boolean := false;
  v_target uuid;
  v_notes text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;
  IF p_ride_id IS NULL OR p_resolution_update IS NULL
     OR pg_catalog.jsonb_typeof(p_resolution_update) <> 'object'
     OR p_resolution_update = '{}'::jsonb THEN
    RAISE EXCEPTION 'invalid failed delivery resolution update' USING ERRCODE = '22023';
  END IF;

  IF p_resolution_update ? 'handoff_requested' THEN
    IF pg_catalog.jsonb_typeof(p_resolution_update->'handoff_requested') <> 'boolean' THEN
      RAISE EXCEPTION 'handoff_requested must be boolean' USING ERRCODE = '22023';
    END IF;
    v_requested := (p_resolution_update->>'handoff_requested')::boolean;
  END IF;

  IF v_requested THEN
    IF EXISTS (
      SELECT 1 FROM pg_catalog.jsonb_object_keys(p_resolution_update) key_name
      WHERE key_name NOT IN (
        'handoff_requested','handoff_driver_profile_id',
        'resolution_action_notes','resolution_status'
      )
    ) THEN
      RAISE EXCEPTION 'handoff request contains incompatible fields' USING ERRCODE = '22023';
    END IF;
    IF p_resolution_update ? 'resolution_status'
       AND NULLIF(pg_catalog.btrim(p_resolution_update->>'resolution_status'), '') IS DISTINCT FROM 'in_progress' THEN
      RAISE EXCEPTION 'handoff request resolution_status must be in_progress' USING ERRCODE = '22023';
    END IF;
    v_target := NULLIF(pg_catalog.btrim(p_resolution_update->>'handoff_driver_profile_id'), '')::uuid;
    v_notes := NULLIF(pg_catalog.btrim(p_resolution_update->>'resolution_action_notes'), '');
    IF v_target IS NULL OR v_notes IS NULL THEN
      RAISE EXCEPTION 'handoff target and notes are required' USING ERRCODE = '22023';
    END IF;
    RETURN private.mobility_request_failed_delivery_handoff_g81(
      p_ride_id, v_target, v_notes
    );
  END IF;

  IF p_resolution_update ? 'handoff_driver_profile_id' THEN
    RAISE EXCEPTION 'handoff custody requires handoff_requested=true and receiver acceptance'
      USING ERRCODE = '22023';
  END IF;

  RETURN private.mobility_update_failed_delivery_resolution_base_g81(
    p_ride_id, p_resolution_update
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.mobility_update_failed_delivery_resolution_atomic(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_update_failed_delivery_resolution_atomic(uuid, jsonb)
  TO service_role;

-- ---------------------------------------------------------------------------
-- PIN ownership follows the receiving courier without weakening requester/admin
-- verification requirements that already exist for the ride.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.mobility_reconcile_handoff_pin_g81(
  p_ride_id uuid,
  p_driver_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_requires_pin boolean := false;
  v_existing public.operational_verifications%ROWTYPE;
BEGIN
  SELECT COALESCE(profile.requires_pin_for_deliveries, false)
  INTO v_requires_pin
  FROM public.profiles profile
  WHERE profile.id = p_driver_profile_id;

  SELECT verification.* INTO v_existing
  FROM public.operational_verifications verification
  WHERE verification.ride_id = p_ride_id
    AND verification.verification_type = 'pin'
  FOR UPDATE;

  IF v_requires_pin THEN
    INSERT INTO public.operational_verifications(
      ride_id, verification_type, is_required, required_by, required_at,
      status, verification_attempts, created_at, updated_at
    ) VALUES (
      p_ride_id, 'pin', true, 'driver', v_now, 'pending', 0, v_now, v_now
    )
    ON CONFLICT (ride_id, verification_type)
    DO UPDATE SET
      is_required = true,
      required_by = CASE
        WHEN operational_verifications.is_required = true
         AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          THEN operational_verifications.required_by
        ELSE 'driver'
      END,
      required_at = COALESCE(operational_verifications.required_at, v_now),
      status = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN 'verified'
        ELSE 'pending'
      END,
      pin_hash = CASE
        WHEN operational_verifications.is_required = true
         AND operational_verifications.status = 'pending'
         AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          THEN operational_verifications.pin_hash
        ELSE NULL
      END,
      pin_generated_at = CASE
        WHEN operational_verifications.is_required = true
         AND operational_verifications.status = 'pending'
         AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          THEN operational_verifications.pin_generated_at
        ELSE NULL
      END,
      pin_expires_at = CASE
        WHEN operational_verifications.is_required = true
         AND operational_verifications.status = 'pending'
         AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          THEN operational_verifications.pin_expires_at
        ELSE NULL
      END,
      verified_at = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN operational_verifications.verified_at
        ELSE NULL
      END,
      verified_by = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN operational_verifications.verified_by
        ELSE NULL
      END,
      verification_attempts = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN operational_verifications.verification_attempts
        ELSE 0
      END,
      last_attempt_at = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN operational_verifications.last_attempt_at
        ELSE NULL
      END,
      updated_at = v_now;
    RETURN;
  END IF;

  IF FOUND AND v_existing.is_required = true
     AND v_existing.required_by IN ('passenger','sender','admin','operation') THEN
    IF v_existing.status = 'verified'
       AND v_existing.verified_by IS DISTINCT FROM p_driver_profile_id THEN
      UPDATE public.operational_verifications
      SET status = 'pending', pin_hash = NULL, pin_generated_at = NULL,
          pin_expires_at = NULL, verified_at = NULL, verified_by = NULL,
          verification_attempts = 0, last_attempt_at = NULL, updated_at = v_now
      WHERE id = v_existing.id;
    END IF;
    RETURN;
  END IF;

  IF FOUND AND v_existing.required_by = 'driver' THEN
    UPDATE public.operational_verifications
    SET is_required = false, required_by = NULL, required_at = NULL,
        status = 'not_required', pin_hash = NULL, pin_generated_at = NULL,
        pin_expires_at = NULL, verified_at = NULL, verified_by = NULL,
        verification_attempts = 0, last_attempt_at = NULL, updated_at = v_now
    WHERE id = v_existing.id;
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION private.mobility_reconcile_handoff_pin_g81(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Receiver acceptance and atomic physical custody transfer.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.mobility_confirm_failed_delivery_handoff_g81(
  p_actor_user_id uuid,
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_strategy text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_from public.driver_availability%ROWTYPE;
  v_target public.driver_availability%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_target_id uuid;
  v_expiry timestamptz;
  v_notes text;
  v_from_driver uuid;
  v_city_id uuid;
  v_target_city_id uuid;
  v_trust jsonb;
  v_distance_m numeric;
  v_rows integer := 0;
  v_history jsonb := '[]'::jsonb;
  v_history_event jsonb;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;
  IF p_actor_user_id IS NULL OR p_ride_id IS NULL OR p_driver_profile_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'invalid_input');
  END IF;
  IF p_strategy IS DISTINCT FROM 'exclusive_offer' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false, 'reason', 'handoff_strategy_required',
      'error', 'Failed-delivery handoff acceptance requires exclusive_offer strategy'
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.id = p_driver_profile_id AND profile.user_id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'handoff receiver profile does not belong to authenticated actor'
      USING ERRCODE = '42501';
  END IF;

  SELECT request.* INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_ride.status = 'in_delivery'
     AND v_ride.driver_profile_id IS NOT DISTINCT FROM p_driver_profile_id
     AND v_ride.failed_delivery_metadata->>'resolution_status' = 'resolved'
     AND v_ride.failed_delivery_metadata->>'resolution_action' = 'handoff_to_another_driver'
     AND v_ride.failed_delivery_metadata->>'handoff_driver_profile_id' = p_driver_profile_id::text
     AND v_ride.failed_delivery_metadata->>'handoff_acceptance_source' = 'authenticated_driver_accept' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true, 'reason', 'handoff_already_confirmed',
      'ride_id', p_ride_id, 'handoff_applied', true, 'already_applied', true,
      'status', 'in_delivery', 'driver_profile_id', p_driver_profile_id,
      'handoff_accepted_at', v_ride.failed_delivery_metadata->>'handoff_accepted_at'
    );
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy'
     OR v_ride.status IS DISTINCT FROM 'failed_delivery'
     OR v_ride.failed_delivery_metadata IS NULL
     OR v_ride.failed_delivery_metadata->>'item_current_holder' IS DISTINCT FROM 'driver'
     OR v_ride.failed_delivery_metadata->>'resolution_status' IS DISTINCT FROM 'in_progress'
     OR v_ride.failed_delivery_metadata->>'resolution_plan' IS DISTINCT FROM 'handoff_to_another_driver' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false, 'reason', 'handoff_not_pending',
      'error', 'Ride has no pending handoff request'
    );
  END IF;

  v_target_id := NULLIF(pg_catalog.btrim(
    v_ride.failed_delivery_metadata->>'handoff_requested_driver_profile_id'
  ), '')::uuid;
  v_expiry := NULLIF(pg_catalog.btrim(
    v_ride.failed_delivery_metadata->>'handoff_request_expires_at'
  ), '')::timestamptz;
  v_notes := NULLIF(pg_catalog.btrim(
    v_ride.failed_delivery_metadata->>'resolution_action_notes'
  ), '');
  v_from_driver := v_ride.driver_profile_id;

  IF v_target_id IS DISTINCT FROM p_driver_profile_id THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_assigned');
  END IF;
  IF v_expiry IS NULL OR v_expiry <= v_now THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'handoff_expired');
  END IF;
  IF v_notes IS NULL OR v_from_driver IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'invalid_state');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_driver_profile_id::text, 810047)
  );
  PERFORM availability.profile_id
  FROM public.driver_availability availability
  WHERE availability.profile_id IN (v_from_driver, p_driver_profile_id)
  ORDER BY availability.profile_id
  FOR UPDATE;

  SELECT availability.* INTO v_from
  FROM public.driver_availability availability
  WHERE availability.profile_id = v_from_driver;
  SELECT availability.* INTO v_target
  FROM public.driver_availability availability
  WHERE availability.profile_id = p_driver_profile_id;

  IF v_from.profile_id IS NULL
     OR v_from.active_ride_id IS DISTINCT FROM p_ride_id
     OR v_from.current_lat IS NULL OR v_from.current_lng IS NULL
     OR v_from.last_location_update IS NULL
     OR v_from.last_location_update < v_now - interval '5 minutes' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'handoff_unavailable');
  END IF;
  IF v_target.profile_id IS NULL
     OR v_target.is_online IS DISTINCT FROM true
     OR v_target.is_available IS DISTINCT FROM true
     OR v_target.active_ride_id IS NOT NULL
     OR v_target.current_lat IS NULL OR v_target.current_lng IS NULL
     OR v_target.last_seen_at IS NULL OR v_target.last_seen_at < v_now - interval '5 minutes'
     OR v_target.last_location_update IS NULL OR v_target.last_location_update < v_now - interval '5 minutes' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'handoff_unavailable');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles profile
    JOIN public.driver_data driver ON driver.profile_id = profile.id
    WHERE profile.id = p_driver_profile_id
      AND profile.user_id = p_actor_user_id
      AND profile.profile_type = 'driver'
      AND profile.is_active = true
      AND NOT (
        (COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false))
        AND (profile.suspended_until IS NULL OR profile.suspended_until > v_now)
      )
      AND profile.user_id IS DISTINCT FROM (
        SELECT passenger.user_id FROM public.profiles passenger
        WHERE passenger.id = v_ride.passenger_profile_id
      )
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND driver.can_do_delivery = true
  ) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_eligible');
  END IF;

  v_city_id := private.mobility_operational_city_id(v_ride.pickup_location_id);
  SELECT private.mobility_operational_city_id(profile.location_id)
  INTO v_target_city_id FROM public.profiles profile
  WHERE profile.id = p_driver_profile_id;
  IF v_city_id IS NULL OR v_target_city_id IS DISTINCT FROM v_city_id THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'wrong_territory');
  END IF;

  v_trust := private.build_trust_policy_decision(
    p_driver_profile_id, 'courier'::public.trust_actor_role
  );
  IF COALESCE(v_trust->>'dispatch_policy', '') = 'block_until_admin_review' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_eligible');
  END IF;

  v_distance_m := public.ST_DistanceSphere(
    public.ST_MakePoint(v_from.current_lng, v_from.current_lat),
    public.ST_MakePoint(v_target.current_lng, v_target.current_lat)
  )::numeric;
  IF v_distance_m > 500 THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'handoff_too_far');
  END IF;

  IF v_ride.source_type = 'gastronomy' AND v_ride.source_id IS NOT NULL THEN
    SELECT order_row.* INTO v_order
    FROM public.orders order_row
    WHERE order_row.id = v_ride.source_id
    FOR UPDATE;
    IF NOT FOUND
       OR v_order.logistics_status::text IS DISTINCT FROM 'picked_up'
       OR v_order.courier_profile_id IS DISTINCT FROM v_from_driver THEN
      RAISE EXCEPTION 'gastronomy order custody is inconsistent with mobility handoff'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  UPDATE public.driver_availability
  SET is_available = false, active_ride_id = p_ride_id,
      busy_since = v_now, active_ride_mode = 'motoboy',
      last_seen_at = v_now, updated_at = v_now
  WHERE profile_id = p_driver_profile_id
    AND is_online = true AND is_available = true AND active_ride_id IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'handoff target availability changed during transfer'
      USING ERRCODE = '40001';
  END IF;

  UPDATE public.driver_availability
  SET is_available = false, active_ride_id = NULL, busy_since = NULL,
      active_ride_mode = NULL, updated_at = v_now
  WHERE profile_id = v_from_driver AND active_ride_id = p_ride_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'original custodian availability changed during transfer'
      USING ERRCODE = '40001';
  END IF;

  IF pg_catalog.jsonb_typeof(v_ride.failed_delivery_metadata->'custody_handoff_history') = 'array' THEN
    v_history := v_ride.failed_delivery_metadata->'custody_handoff_history';
  END IF;
  v_history_event := pg_catalog.jsonb_build_object(
    'from_driver_profile_id', v_from_driver,
    'to_driver_profile_id', p_driver_profile_id,
    'confirmed_at', v_now,
    'source', 'failed_delivery_handoff'
  );
  IF NOT (v_history @> pg_catalog.jsonb_build_array(v_history_event)) THEN
    v_history := v_history || pg_catalog.jsonb_build_array(v_history_event);
  END IF;

  UPDATE public.ride_requests request
  SET status = 'in_delivery',
      driver_profile_id = p_driver_profile_id,
      driver_assigned_at = v_now,
      driver_accepted_at = v_now,
      failed_delivery_metadata = request.failed_delivery_metadata || pg_catalog.jsonb_build_object(
        'resolution_status', 'resolved',
        'resolution_action', 'handoff_to_another_driver',
        'resolution_item_holder', 'other_driver',
        'handoff_from_driver_profile_id', v_from_driver::text,
        'handoff_driver_profile_id', p_driver_profile_id::text,
        'handoff_confirmed_at', v_now,
        'handoff_distance_m', v_distance_m,
        'handoff_accepted_at', v_now,
        'handoff_acceptance_source', 'authenticated_driver_accept',
        'courier_settlement_allocation_required', true,
        'custody_handoff_history', v_history,
        'resolved_at', v_now
      ),
      updated_at = v_now
  WHERE request.id = p_ride_id
    AND request.status = 'failed_delivery'
    AND request.driver_profile_id = v_from_driver;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'failed delivery changed during handoff' USING ERRCODE = '40001';
  END IF;

  IF v_ride.source_type = 'gastronomy' AND v_ride.source_id IS NOT NULL THEN
    UPDATE public.orders
    SET courier_profile_id = p_driver_profile_id
    WHERE id = v_ride.source_id
      AND logistics_status::text = 'picked_up'
      AND courier_profile_id IS NOT DISTINCT FROM v_from_driver;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'gastronomy order courier changed during handoff'
        USING ERRCODE = '40001';
    END IF;

    INSERT INTO public.order_timeline_events(
      order_id, event_type, actor_role, reason, metadata, created_at
    ) VALUES (
      v_ride.source_id, 'courier_handoff', 'system', pg_catalog.left(v_notes, 1000),
      pg_catalog.jsonb_build_object(
        'source', 'mobility_failed_delivery_handoff',
        'ride_id', p_ride_id,
        'from_courier_profile_id', v_from_driver,
        'to_courier_profile_id', p_driver_profile_id,
        'handoff_distance_m', v_distance_m,
        'handoff_confirmed_at', v_now
      ), v_now
    );
  END IF;

  PERFORM private.mobility_reconcile_handoff_pin_g81(p_ride_id, p_driver_profile_id);

  INSERT INTO public.ride_state_audit(
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id, 'failed_delivery', 'in_delivery', p_driver_profile_id::text,
    pg_catalog.left(v_notes, 1000),
    pg_catalog.jsonb_build_object(
      'resolution_action', 'handoff_to_another_driver',
      'transfer_authority', 'authenticated_receiving_driver_acceptance',
      'requested_by', 'admin:mobility-rpc',
      'from_driver_profile_id', v_from_driver,
      'to_driver_profile_id', p_driver_profile_id,
      'handoff_distance_m', v_distance_m,
      'from_driver_lat', v_from.current_lat,
      'from_driver_lng', v_from.current_lng,
      'to_driver_lat', v_target.current_lat,
      'to_driver_lng', v_target.current_lng,
      'confirmed_at', v_now,
      'trust_risk_level', v_trust->>'risk_level',
      'trust_dispatch_policy', v_trust->>'dispatch_policy'
    ), v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true, 'reason', 'handoff_confirmed',
    'ride_id', p_ride_id, 'handoff_applied', true, 'already_applied', false,
    'status', 'in_delivery', 'driver_profile_id', p_driver_profile_id,
    'handoff_accepted_at', v_now
  );
END;
$function$;
REVOKE ALL ON FUNCTION private.mobility_confirm_failed_delivery_handoff_g81(
  uuid, uuid, uuid, text
) FROM PUBLIC, anon, authenticated, service_role;

-- Preserve ordinary three-argument callers but make the privileged handoff path
-- impossible without the authenticated actor-bound overload.
ALTER FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)
  RENAME TO mobility_accept_ride_atomic_base_g81;
ALTER FUNCTION public.mobility_accept_ride_atomic_base_g81(uuid, uuid, text)
  SET SCHEMA private;
REVOKE ALL ON FUNCTION private.mobility_accept_ride_atomic_base_g81(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mobility_accept_ride_atomic(
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_strategy text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE v_ride public.ride_requests%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'mobility_accept_ride_atomic requires service_role' USING ERRCODE = '42501';
  END IF;
  SELECT request.* INTO v_ride FROM public.ride_requests request WHERE request.id = p_ride_id;
  IF FOUND AND (
    (v_ride.status = 'failed_delivery'
      AND v_ride.failed_delivery_metadata->>'resolution_plan' = 'handoff_to_another_driver')
    OR (v_ride.status = 'in_delivery'
      AND v_ride.failed_delivery_metadata->>'resolution_action' = 'handoff_to_another_driver'
      AND v_ride.driver_profile_id IS NOT DISTINCT FROM p_driver_profile_id)
  ) THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false, 'reason', 'actor_bound_accept_required',
      'error', 'Failed-delivery handoff requires authenticated actor-bound acceptance'
    );
  END IF;
  RETURN private.mobility_accept_ride_atomic_base_g81(
    p_ride_id, p_driver_profile_id, p_strategy
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_accept_ride_atomic(
  p_actor_user_id uuid,
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_strategy text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE v_ride public.ride_requests%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'actor-bound mobility_accept_ride_atomic requires service_role'
      USING ERRCODE = '42501';
  END IF;
  SELECT request.* INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF (
    v_ride.status = 'failed_delivery'
    AND v_ride.failed_delivery_metadata->>'resolution_status' = 'in_progress'
    AND v_ride.failed_delivery_metadata->>'resolution_plan' = 'handoff_to_another_driver'
    AND v_ride.failed_delivery_metadata->>'handoff_requested_driver_profile_id' = p_driver_profile_id::text
  ) OR (
    v_ride.status = 'in_delivery'
    AND v_ride.driver_profile_id IS NOT DISTINCT FROM p_driver_profile_id
    AND v_ride.failed_delivery_metadata->>'resolution_action' = 'handoff_to_another_driver'
    AND v_ride.failed_delivery_metadata->>'handoff_driver_profile_id' = p_driver_profile_id::text
    AND v_ride.failed_delivery_metadata->>'handoff_acceptance_source' = 'authenticated_driver_accept'
  ) THEN
    RETURN private.mobility_confirm_failed_delivery_handoff_g81(
      p_actor_user_id, p_ride_id, p_driver_profile_id, p_strategy
    );
  END IF;

  RETURN private.mobility_accept_ride_atomic_base_g81(
    p_ride_id, p_driver_profile_id, p_strategy
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, uuid, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- If a receiver later fails the same ride, preserve only server-owned custody
-- lineage while allowing the new failure snapshot itself to remain independent.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.mobility_preserve_handoff_lineage_g81()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_old jsonb := COALESCE(OLD.failed_delivery_metadata, '{}'::jsonb);
  v_history jsonb := '[]'::jsonb;
  v_event jsonb;
BEGIN
  IF OLD.ride_mode IS DISTINCT FROM 'motoboy'
     OR OLD.status IS DISTINCT FROM 'in_delivery'
     OR NEW.status IS DISTINCT FROM 'failed_delivery'
     OR NOT (
       COALESCE((v_old->>'courier_settlement_allocation_required')::boolean, false)
       OR v_old->>'resolution_action' = 'handoff_to_another_driver'
     ) THEN
    RETURN NEW;
  END IF;

  IF pg_catalog.jsonb_typeof(v_old->'custody_handoff_history') = 'array' THEN
    v_history := v_old->'custody_handoff_history';
  END IF;
  IF v_old->>'resolution_action' = 'handoff_to_another_driver' THEN
    v_event := pg_catalog.jsonb_build_object(
      'from_driver_profile_id', v_old->>'handoff_from_driver_profile_id',
      'to_driver_profile_id', v_old->>'handoff_driver_profile_id',
      'confirmed_at', COALESCE(v_old->>'handoff_accepted_at', v_old->>'handoff_confirmed_at'),
      'source', 'failed_delivery_handoff'
    );
    IF v_event->>'from_driver_profile_id' IS NULL
       OR v_event->>'to_driver_profile_id' IS NULL
       OR v_event->>'confirmed_at' IS NULL THEN
      RAISE EXCEPTION 'confirmed handoff is missing custody lineage evidence'
        USING ERRCODE = '23514';
    END IF;
    IF NOT (v_history @> pg_catalog.jsonb_build_array(v_event)) THEN
      v_history := v_history || pg_catalog.jsonb_build_array(v_event);
    END IF;
  END IF;

  NEW.failed_delivery_metadata := COALESCE(NEW.failed_delivery_metadata, '{}'::jsonb)
    || pg_catalog.jsonb_build_object(
      'courier_settlement_allocation_required', true,
      'custody_handoff_history', v_history
    );
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.mobility_preserve_handoff_lineage_g81()
  FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS trg_mobility_preserve_handoff_lineage_g81 ON public.ride_requests;
CREATE TRIGGER trg_mobility_preserve_handoff_lineage_g81
BEFORE UPDATE OF status, failed_delivery_metadata ON public.ride_requests
FOR EACH ROW
WHEN (
  OLD.ride_mode = 'motoboy'
  AND OLD.status = 'in_delivery'
  AND NEW.status = 'failed_delivery'
)
EXECUTE FUNCTION private.mobility_preserve_handoff_lineage_g81();

NOTIFY pgrst, 'reload schema';
COMMIT;
