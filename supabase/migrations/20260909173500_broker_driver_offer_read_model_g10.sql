-- G10: canonical driver offer read model.
--
-- Fixes two coupled problems without opening ride_requests by RLS:
-- 1. drivers could not read unassigned open-board/reservation rides because
--    ride_requests is participant/admin-only;
-- 2. get_ride_offer_trust_decisions could inspect arbitrary unassigned ride ids
--    without proving the same territorial offer surface.
--
-- departure_time remains the single scheduling timestamp. No duplicate
-- is_scheduled/scheduled_for columns are introduced.

CREATE OR REPLACE FUNCTION private.mobility_operational_city_id(
  p_location_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '2s'
AS $function$
DECLARE
  v_current_id uuid := p_location_id;
  v_parent_id uuid;
  v_type text;
  v_depth integer := 0;
BEGIN
  WHILE v_current_id IS NOT NULL AND v_depth < 8 LOOP
    SELECT location.type, location.parent_id
    INTO v_type, v_parent_id
    FROM public.locations location
    WHERE location.id = v_current_id;

    IF NOT FOUND THEN
      RETURN NULL;
    END IF;

    IF v_type = 'city' THEN
      RETURN v_current_id;
    END IF;

    v_current_id := v_parent_id;
    v_depth := v_depth + 1;
  END LOOP;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION private.mobility_operational_city_id(uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.mobility_list_driver_offers(
  p_actor_user_id uuid,
  p_driver_profile_id uuid,
  p_strategy text,
  p_limit integer DEFAULT 10,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_package_sizes text[] DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_ascending boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_driver_location_id uuid;
  v_driver_city_id uuid;
  v_can_do_rides boolean;
  v_can_do_delivery boolean;
  v_result jsonb;
BEGIN
  IF p_actor_user_id IS NULL OR p_driver_profile_id IS NULL THEN
    RAISE EXCEPTION 'Actor and driver profile are required'
      USING ERRCODE = '22023';
  END IF;

  IF p_strategy NOT IN ('exclusive_offer', 'open_board', 'reservation_board') THEN
    RAISE EXCEPTION 'Invalid dispatch strategy' USING ERRCODE = '22023';
  END IF;

  IF p_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Offer limit out of range' USING ERRCODE = '22023';
  END IF;

  IF p_sort_by NOT IN ('created_at', 'suggested_price', 'departure_time') THEN
    RAISE EXCEPTION 'Invalid offer sort' USING ERRCODE = '22023';
  END IF;

  IF p_min_price IS NOT NULL AND p_min_price < 0 THEN
    RAISE EXCEPTION 'Invalid minimum price' USING ERRCODE = '22023';
  END IF;

  IF p_max_price IS NOT NULL AND p_max_price < 0 THEN
    RAISE EXCEPTION 'Invalid maximum price' USING ERRCODE = '22023';
  END IF;

  IF p_min_price IS NOT NULL
     AND p_max_price IS NOT NULL
     AND p_min_price > p_max_price
  THEN
    RAISE EXCEPTION 'Minimum price cannot exceed maximum price'
      USING ERRCODE = '22023';
  END IF;

  SELECT
    profile.location_id,
    COALESCE(driver.can_do_rides, false),
    COALESCE(driver.can_do_delivery, false)
  INTO
    v_driver_location_id,
    v_can_do_rides,
    v_can_do_delivery
  FROM public.profiles profile
  JOIN public.driver_data driver
    ON driver.profile_id = profile.id
  JOIN public.driver_availability availability
    ON availability.profile_id = profile.id
  WHERE profile.id = p_driver_profile_id
    AND profile.user_id = p_actor_user_id
    AND profile.profile_type = 'driver'
    AND profile.is_active = true
    AND NOT (
      (COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false))
      AND (profile.suspended_until IS NULL OR profile.suspended_until > v_now)
    )
    AND driver.is_verified = true
    AND driver.subscription_active = true
    AND availability.is_online = true
    AND availability.is_available = true
    AND availability.active_ride_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Eligible online driver profile required'
      USING ERRCODE = '42501';
  END IF;

  IF p_strategy = 'open_board' AND v_can_do_delivery IS NOT TRUE THEN
    RAISE EXCEPTION 'Delivery capability required' USING ERRCODE = '42501';
  END IF;

  IF p_strategy = 'exclusive_offer' AND v_can_do_rides IS NOT TRUE THEN
    RAISE EXCEPTION 'Ride capability required' USING ERRCODE = '42501';
  END IF;

  v_driver_city_id := private.mobility_operational_city_id(v_driver_location_id);
  IF v_driver_city_id IS NULL THEN
    RAISE EXCEPTION 'Driver operational city is required'
      USING ERRCODE = '42501';
  END IF;

  WITH candidates AS (
    SELECT
      ride.id,
      ride.origin,
      ride.destination,
      ride.origin_lat,
      ride.origin_lng,
      ride.destination_lat,
      ride.destination_lng,
      ride.suggested_price,
      ride.payment_method,
      ride.created_at,
      ride.driver_assigned_at,
      ride.departure_time,
      ride.ride_mode,
      ride.passenger_profile_id,
      ride.driver_profile_id,
      ride.package_size,
      ride.package_description,
      ride.source_type,
      ride.source_id,
      ride.status,
      decision.value ->> 'risk_level' AS risk_level,
      decision.value ->> 'dispatch_policy' AS dispatch_policy
    FROM public.ride_requests ride
    CROSS JOIN LATERAL (
      SELECT private.build_trust_policy_decision(
        ride.passenger_profile_id,
        'customer'::public.trust_actor_role
      ) AS value
    ) decision
    WHERE ride.passenger_profile_id IS NOT NULL
      AND ride.pickup_location_id IS NOT NULL
      AND private.mobility_operational_city_id(ride.pickup_location_id)
          = v_driver_city_id
      AND (
        (ride.ride_mode = 'ride' AND v_can_do_rides = true)
        OR (ride.ride_mode = 'motoboy' AND v_can_do_delivery = true)
      )
      AND (
        (
          p_strategy = 'exclusive_offer'
          AND ride.driver_profile_id = p_driver_profile_id
          AND ride.status = 'driver_assigned'
          AND ride.driver_accepted_at IS NULL
          AND ride.ride_mode = 'ride'
        )
        OR
        (
          p_strategy = 'open_board'
          AND ride.driver_profile_id IS NULL
          AND ride.status IN ('pending', 'requested', 'searching_driver')
          AND ride.ride_mode = 'motoboy'
          AND (
            ride.departure_time IS NULL
            OR ride.departure_time < v_now + INTERVAL '2 hours'
          )
        )
        OR
        (
          p_strategy = 'reservation_board'
          AND ride.driver_profile_id IS NULL
          AND ride.status IN ('pending', 'requested', 'searching_driver')
          AND ride.departure_time >= v_now + INTERVAL '2 hours'
          AND ride.departure_time <= v_now + INTERVAL '7 days'
        )
      )
      AND (p_min_price IS NULL OR ride.suggested_price >= p_min_price)
      AND (p_max_price IS NULL OR ride.suggested_price <= p_max_price)
      AND (
        p_package_sizes IS NULL
        OR pg_catalog.cardinality(p_package_sizes) = 0
        OR ride.package_size = ANY(p_package_sizes)
      )
  ),
  ordered AS (
    SELECT *
    FROM candidates
    ORDER BY
      CASE WHEN p_sort_by = 'created_at' AND p_ascending
        THEN created_at END ASC,
      CASE WHEN p_sort_by = 'created_at' AND NOT p_ascending
        THEN created_at END DESC,
      CASE WHEN p_sort_by = 'suggested_price' AND p_ascending
        THEN suggested_price END ASC,
      CASE WHEN p_sort_by = 'suggested_price' AND NOT p_ascending
        THEN suggested_price END DESC,
      CASE WHEN p_sort_by = 'departure_time' AND p_ascending
        THEN departure_time END ASC,
      CASE WHEN p_sort_by = 'departure_time' AND NOT p_ascending
        THEN departure_time END DESC,
      created_at DESC,
      id
    LIMIT p_limit
  )
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', offer.id,
        'origin', offer.origin,
        'destination', offer.destination,
        'origin_lat', offer.origin_lat,
        'origin_lng', offer.origin_lng,
        'destination_lat', offer.destination_lat,
        'destination_lng', offer.destination_lng,
        'suggested_price', offer.suggested_price,
        'payment_method', offer.payment_method,
        'created_at', offer.created_at,
        'driver_assigned_at', offer.driver_assigned_at,
        'scheduled_for', offer.departure_time,
        'ride_mode', offer.ride_mode,
        'passenger_profile_id', offer.passenger_profile_id,
        'driver_profile_id', offer.driver_profile_id,
        'package_size', offer.package_size,
        'package_description', offer.package_description,
        'source_type', offer.source_type,
        'source_id', offer.source_id,
        'status', offer.status,
        'risk_level', offer.risk_level,
        'dispatch_policy', offer.dispatch_policy
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM ordered offer;

  RETURN pg_catalog.jsonb_build_object('offers', v_result);
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_list_driver_offers(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_list_driver_offers(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) TO service_role;

-- These legacy client-callable projections are superseded by the territorially
-- scoped offer broker. Keep the functions for server/internal callers, but
-- remove direct browser execution.
REVOKE EXECUTE ON FUNCTION public.get_ride_offer_trust_decisions(uuid[])
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_driver_dispatch_summaries(uuid[])
  FROM authenticated;

COMMENT ON FUNCTION public.mobility_list_driver_offers(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) IS
  'Service-only driver offer read model. Enforces ownership, eligibility, online availability and same operational city before returning ride/trust offer data.';
