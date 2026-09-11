-- G81: replace only the failed-delivery branch of the G81 discovery router.
--
-- The 23:00 G81 migration already moved the original G11 implementation to
-- private.mobility_find_available_drivers_for_ride_base_g81. Keep that exact
-- base as the normal-ride authority. This migration narrows failed-delivery
-- discovery to an admin-only, privacy-minimized <=500m search around the fresh
-- current package custodian location.

CREATE OR REPLACE FUNCTION private.mobility_find_failed_delivery_handoff_candidates_g81(
  p_actor_user_id uuid,
  p_ride_id uuid,
  p_limit integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_custodian_availability public.driver_availability%ROWTYPE;
  v_operational_city_id uuid;
  v_result jsonb;
BEGIN
  IF p_actor_user_id IS NULL OR p_ride_id IS NULL THEN
    RAISE EXCEPTION 'Actor and ride are required' USING ERRCODE = '22023';
  END IF;

  IF p_limit NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Driver result limit out of range' USING ERRCODE = '22023';
  END IF;

  IF NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'Admin authority is required for failed-delivery handoff discovery'
      USING ERRCODE = '42501';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy'
     OR v_ride.status IS DISTINCT FROM 'failed_delivery'
     OR v_ride.driver_profile_id IS NULL
     OR v_ride.failed_delivery_metadata IS NULL
  THEN
    RAISE EXCEPTION 'Ride is not eligible for failed-delivery handoff discovery'
      USING ERRCODE = '22023';
  END IF;

  IF v_ride.failed_delivery_metadata->>'item_current_holder' IS DISTINCT FROM 'driver'
     OR COALESCE(
          NULLIF(pg_catalog.btrim(v_ride.failed_delivery_metadata->>'resolution_status'), ''),
          'pending'
        ) = 'resolved'
     OR NULLIF(
          pg_catalog.btrim(v_ride.failed_delivery_metadata->>'next_ride_id'),
          ''
        ) IS NOT NULL
  THEN
    RAISE EXCEPTION 'Failed delivery custody is not eligible for handoff discovery'
      USING ERRCODE = '22023';
  END IF;

  SELECT availability.*
  INTO v_custodian_availability
  FROM public.driver_availability availability
  WHERE availability.profile_id = v_ride.driver_profile_id;

  IF NOT FOUND
     OR v_custodian_availability.active_ride_id IS DISTINCT FROM p_ride_id
     OR v_custodian_availability.current_lat IS NULL
     OR v_custodian_availability.current_lng IS NULL
     OR v_custodian_availability.last_location_update IS NULL
     OR v_custodian_availability.last_location_update < pg_catalog.now() - interval '5 minutes'
  THEN
    RAISE EXCEPTION 'Current package custodian has no fresh authoritative location'
      USING ERRCODE = '22023';
  END IF;

  v_operational_city_id := private.mobility_operational_city_id(
    v_ride.pickup_location_id
  );
  IF v_operational_city_id IS NULL THEN
    RAISE EXCEPTION 'Ride operational city is required'
      USING ERRCODE = '42501';
  END IF;

  WITH candidates AS (
    SELECT
      profile.id AS profile_id,
      driver.rating,
      availability.last_seen_at,
      (
        public.ST_DistanceSphere(
          public.ST_MakePoint(
            availability.current_lng,
            availability.current_lat
          ),
          public.ST_MakePoint(
            v_custodian_availability.current_lng,
            v_custodian_availability.current_lat
          )
        ) / 1000.0
      )::numeric AS distance_km,
      private.build_trust_policy_decision(
        profile.id,
        'courier'::public.trust_actor_role
      ) AS trust_decision
    FROM public.profiles profile
    JOIN public.driver_data driver
      ON driver.profile_id = profile.id
    JOIN public.driver_availability availability
      ON availability.profile_id = profile.id
    WHERE profile.id <> v_ride.driver_profile_id
      AND profile.profile_type = 'driver'
      AND profile.is_active = true
      AND NOT (
        (COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false))
        AND (
          profile.suspended_until IS NULL
          OR profile.suspended_until > pg_catalog.now()
        )
      )
      AND private.mobility_operational_city_id(profile.location_id)
          = v_operational_city_id
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND driver.can_do_delivery = true
      AND availability.is_online = true
      AND availability.is_available = true
      AND availability.active_ride_id IS NULL
      AND availability.current_lat IS NOT NULL
      AND availability.current_lng IS NOT NULL
      AND availability.last_seen_at IS NOT NULL
      AND availability.last_seen_at >= pg_catalog.now() - interval '5 minutes'
      AND availability.last_location_update IS NOT NULL
      AND availability.last_location_update >= pg_catalog.now() - interval '5 minutes'
      AND NOT EXISTS (
        SELECT 1
        FROM public.ride_requests active
        WHERE active.driver_profile_id = profile.id
          AND active.id <> p_ride_id
          AND active.status IN (
            'driver_assigned', 'driver_accepted', 'driver_arriving',
            'passenger_boarded', 'in_progress', 'pickup_confirmed',
            'in_delivery', 'delivered'
          )
      )
  ),
  eligible AS (
    SELECT candidate.*
    FROM candidates candidate
    WHERE candidate.distance_km <= 0.5
      AND COALESCE(candidate.trust_decision->>'dispatch_policy', '')
          <> 'block_until_admin_review'
    ORDER BY candidate.distance_km ASC,
             candidate.rating DESC NULLS LAST,
             candidate.profile_id
    LIMIT p_limit
  )
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'profile_id', candidate.profile_id,
        'distance_km', candidate.distance_km,
        'rating', candidate.rating,
        'last_seen_at', candidate.last_seen_at,
        'risk_level', candidate.trust_decision->>'risk_level',
        'dispatch_policy', candidate.trust_decision->>'dispatch_policy'
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM eligible candidate;

  RETURN pg_catalog.jsonb_build_object('drivers', v_result);
END;
$function$;

REVOKE ALL ON FUNCTION private.mobility_find_failed_delivery_handoff_candidates_g81(
  uuid, uuid, integer
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
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_status text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required'
      USING ERRCODE = '42501';
  END IF;

  SELECT request.status
  INTO v_status
  FROM public.ride_requests request
  WHERE request.id = p_ride_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_status = 'failed_delivery' THEN
    IF p_radius_km IS NULL OR p_radius_km <= 0 OR p_radius_km > 0.5 THEN
      RAISE EXCEPTION 'Failed-delivery handoff discovery radius cannot exceed 500 meters'
        USING ERRCODE = '22023';
    END IF;

    RETURN private.mobility_find_failed_delivery_handoff_candidates_g81(
      p_actor_user_id,
      p_ride_id,
      p_limit
    );
  END IF;

  RETURN private.mobility_find_available_drivers_for_ride_base_g81(
    p_actor_user_id,
    p_ride_id,
    p_radius_km,
    p_limit
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_find_available_drivers_for_ride(
  uuid, uuid, numeric, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_find_available_drivers_for_ride(
  uuid, uuid, numeric, integer
) TO service_role;

COMMENT ON FUNCTION public.mobility_find_available_drivers_for_ride(
  uuid, uuid, numeric, integer
) IS
  'G81 route-preserving discovery command. Normal rides delegate to the exact G11 base. Failed deliveries are admin-only and discover eligible handoff receivers within 500m of the fresh current package custodian location without returning candidate coordinates.';
