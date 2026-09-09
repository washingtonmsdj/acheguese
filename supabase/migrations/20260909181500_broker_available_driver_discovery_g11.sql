-- G11: server-owned available-driver discovery for a concrete ride.
--
-- Replaces the client-side "find drivers around arbitrary lat/lng" contract
-- with a ride-scoped command that can prove requester, territory and ride mode.

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
  v_ride public.ride_requests%ROWTYPE;
  v_pickup_city_id uuid;
  v_result jsonb;
BEGIN
  IF p_actor_user_id IS NULL OR p_ride_id IS NULL THEN
    RAISE EXCEPTION 'Actor and ride are required' USING ERRCODE = '22023';
  END IF;

  IF p_radius_km IS NULL OR p_radius_km <= 0 OR p_radius_km > 100 THEN
    RAISE EXCEPTION 'Invalid dispatch radius' USING ERRCODE = '22023';
  END IF;

  IF p_limit NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Driver result limit out of range' USING ERRCODE = '22023';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride not found' USING ERRCODE = '22023';
  END IF;

  IF v_ride.driver_profile_id IS NOT NULL
     OR v_ride.status NOT IN ('pending', 'requested', 'searching_driver')
  THEN
    RAISE EXCEPTION 'Ride is not eligible for driver discovery'
      USING ERRCODE = '42501';
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = v_ride.passenger_profile_id
        AND profile.user_id = p_actor_user_id
    )
    OR COALESCE(private.is_admin(p_actor_user_id), false)
  ) THEN
    RAISE EXCEPTION 'Ride requester or admin authority required'
      USING ERRCODE = '42501';
  END IF;

  IF v_ride.pickup_location_id IS NULL
     OR v_ride.origin_lat IS NULL
     OR v_ride.origin_lng IS NULL
  THEN
    RAISE EXCEPTION 'Ride pickup territory and coordinates are required'
      USING ERRCODE = '42501';
  END IF;

  v_pickup_city_id := private.mobility_operational_city_id(
    v_ride.pickup_location_id
  );
  IF v_pickup_city_id IS NULL THEN
    RAISE EXCEPTION 'Ride operational city is required'
      USING ERRCODE = '42501';
  END IF;

  WITH candidates AS (
    SELECT
      profile.id AS profile_id,
      driver.rating,
      availability.current_lat,
      availability.current_lng,
      availability.last_seen_at,
      (
        public.ST_DistanceSphere(
          public.ST_MakePoint(
            availability.current_lng,
            availability.current_lat
          ),
          public.ST_MakePoint(
            v_ride.origin_lng::double precision,
            v_ride.origin_lat::double precision
          )
        ) / 1000.0
      )::numeric AS distance_km,
      private.build_trust_policy_decision(
        profile.id,
        CASE
          WHEN v_ride.ride_mode = 'motoboy'
            THEN 'courier'::public.trust_actor_role
          ELSE 'driver'::public.trust_actor_role
        END
      ) AS trust_decision
    FROM public.profiles profile
    JOIN public.driver_data driver
      ON driver.profile_id = profile.id
    JOIN public.driver_availability availability
      ON availability.profile_id = profile.id
    WHERE profile.profile_type = 'driver'
      AND profile.is_active = true
      AND NOT (
        (COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false))
        AND (
          profile.suspended_until IS NULL
          OR profile.suspended_until > pg_catalog.now()
        )
      )
      AND private.mobility_operational_city_id(profile.location_id)
          = v_pickup_city_id
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND (
        (v_ride.ride_mode = 'motoboy' AND driver.can_do_delivery = true)
        OR (v_ride.ride_mode = 'ride' AND driver.can_do_rides = true)
      )
      AND availability.is_online = true
      AND availability.is_available = true
      AND availability.active_ride_id IS NULL
      AND availability.current_lat IS NOT NULL
      AND availability.current_lng IS NOT NULL
      AND availability.last_seen_at IS NOT NULL
      AND availability.last_seen_at >= pg_catalog.now() - INTERVAL '5 minutes'
  ),
  eligible AS (
    SELECT *
    FROM candidates
    WHERE distance_km <= p_radius_km
      AND COALESCE(trust_decision ->> 'dispatch_policy', '')
          <> 'block_until_admin_review'
    ORDER BY distance_km ASC, rating DESC NULLS LAST, profile_id
    LIMIT p_limit
  )
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'profile_id', candidate.profile_id,
        'distance_km', candidate.distance_km,
        'rating', candidate.rating,
        'current_lat', candidate.current_lat,
        'current_lng', candidate.current_lng,
        'last_seen_at', candidate.last_seen_at,
        'risk_level', candidate.trust_decision ->> 'risk_level',
        'dispatch_policy', candidate.trust_decision ->> 'dispatch_policy'
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM eligible candidate;

  RETURN pg_catalog.jsonb_build_object('drivers', v_result);
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
  'Service-only dispatch discovery for one requester-owned ride. Filters by mode, verification, subscription, availability freshness, trust, radius and operational city.';
