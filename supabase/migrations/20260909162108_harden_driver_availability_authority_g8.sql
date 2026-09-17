-- G8: make driver availability presence server-owned.
--
-- Browser clients may express presence intent through mobility-rpc, but they
-- must never write active_ride_id, busy_since or active_ride_mode directly.
-- Those fields are owned by atomic acceptance/release commands.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_availability FROM authenticated;

DROP POLICY IF EXISTS "Drivers can manage own availability"
  ON public.driver_availability;

CREATE OR REPLACE FUNCTION public.mobility_update_driver_availability(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_action text,
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL,
  p_ride_mode text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_profile_active boolean;
  v_profile_suspended boolean;
  v_verified boolean;
  v_subscription_active boolean;
  v_can_do_rides boolean;
  v_can_do_delivery boolean;
  v_active_ride_id uuid;
  v_row public.driver_availability%ROWTYPE;
BEGIN
  IF p_actor_user_id IS NULL OR p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Actor and driver profile are required' USING ERRCODE = '22023';
  END IF;

  IF p_action NOT IN (
    'go_online',
    'go_offline',
    'set_available',
    'pause_available',
    'heartbeat'
  ) THEN
    RAISE EXCEPTION 'Unsupported driver availability action: %', p_action
      USING ERRCODE = '22023';
  END IF;

  IF p_ride_mode IS NOT NULL AND p_ride_mode NOT IN ('ride', 'motoboy') THEN
    RAISE EXCEPTION 'Invalid ride mode' USING ERRCODE = '22023';
  END IF;

  SELECT
    profile.is_active,
    COALESCE(profile.is_suspended, false) OR COALESCE(profile.suspended, false),
    COALESCE(driver.is_verified, false),
    COALESCE(driver.subscription_active, false),
    COALESCE(driver.can_do_rides, false),
    COALESCE(driver.can_do_delivery, false)
  INTO
    v_profile_active,
    v_profile_suspended,
    v_verified,
    v_subscription_active,
    v_can_do_rides,
    v_can_do_delivery
  FROM public.profiles profile
  LEFT JOIN public.driver_data driver
    ON driver.profile_id = profile.id
  WHERE profile.id = p_profile_id
    AND profile.user_id = p_actor_user_id
    AND profile.profile_type = 'driver';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver profile is not owned by the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  SELECT availability.active_ride_id
  INTO v_active_ride_id
  FROM public.driver_availability availability
  WHERE availability.profile_id = p_profile_id;

  IF p_action IN ('go_online', 'set_available')
     AND v_active_ride_id IS NULL
  THEN
    IF v_profile_active IS NOT TRUE THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'profile_inactive',
        'error', 'Driver profile is not active'
      );
    END IF;

    IF v_profile_suspended IS TRUE THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'driver_suspended',
        'error', 'Driver is suspended'
      );
    END IF;

    IF v_verified IS NOT TRUE THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'driver_not_verified',
        'error', 'Driver is not verified'
      );
    END IF;

    IF v_subscription_active IS NOT TRUE THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'subscription_inactive',
        'error', 'Driver subscription is inactive'
      );
    END IF;

    IF p_ride_mode = 'ride' AND v_can_do_rides IS NOT TRUE THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'ride_capability_disabled',
        'error', 'Driver is not enabled for rides'
      );
    END IF;

    IF p_ride_mode = 'motoboy' AND v_can_do_delivery IS NOT TRUE THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'delivery_capability_disabled',
        'error', 'Driver is not enabled for deliveries'
      );
    END IF;

    IF p_ride_mode IS NULL
       AND v_can_do_rides IS NOT TRUE
       AND v_can_do_delivery IS NOT TRUE
    THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'driver_capability_disabled',
        'error', 'Driver has no enabled operational mode'
      );
    END IF;
  END IF;

  IF p_action = 'go_online' THEN
    INSERT INTO public.driver_availability (
      profile_id,
      is_online,
      is_available,
      last_seen_at,
      updated_at
    )
    VALUES (
      p_profile_id,
      true,
      false,
      v_now,
      v_now
    )
    ON CONFLICT (profile_id) DO NOTHING;

    UPDATE public.driver_availability availability
    SET
      is_online = true,
      is_available = false,
      last_seen_at = v_now,
      updated_at = v_now
    WHERE availability.profile_id = p_profile_id
    RETURNING availability.* INTO v_row;

  ELSIF p_action = 'go_offline' THEN
    UPDATE public.driver_availability availability
    SET
      is_online = false,
      is_available = false,
      last_seen_at = v_now,
      updated_at = v_now
    WHERE availability.profile_id = p_profile_id
      AND availability.active_ride_id IS NULL
    RETURNING availability.* INTO v_row;

    IF NOT FOUND THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'active_ride',
        'error', 'Cannot go offline with active ride'
      );
    END IF;

  ELSIF p_action = 'set_available' THEN
    IF p_lat IS NULL OR p_lng IS NULL
       OR p_lat < -90 OR p_lat > 90
       OR p_lng < -180 OR p_lng > 180
    THEN
      RAISE EXCEPTION 'Valid coordinates are required to become available'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.driver_availability availability
    SET
      is_available = true,
      current_lat = p_lat,
      current_lng = p_lng,
      last_location_update = v_now,
      last_seen_at = v_now,
      updated_at = v_now
    WHERE availability.profile_id = p_profile_id
      AND availability.is_online = true
      AND availability.active_ride_id IS NULL
    RETURNING availability.* INTO v_row;

    IF NOT FOUND THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'not_online_or_busy',
        'error', 'Driver must be online and not busy to become available'
      );
    END IF;

  ELSIF p_action = 'pause_available' THEN
    UPDATE public.driver_availability availability
    SET
      is_available = false,
      last_seen_at = v_now,
      updated_at = v_now
    WHERE availability.profile_id = p_profile_id
      AND availability.active_ride_id IS NULL
    RETURNING availability.* INTO v_row;

    IF NOT FOUND THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'active_ride_or_missing',
        'error', 'Availability cannot be paused while a ride is active'
      );
    END IF;

  ELSE
    UPDATE public.driver_availability availability
    SET last_seen_at = v_now
    WHERE availability.profile_id = p_profile_id
    RETURNING availability.* INTO v_row;

    IF NOT FOUND THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'availability_missing',
        'error', 'Driver availability was not initialized'
      );
    END IF;
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'availability', pg_catalog.to_jsonb(v_row)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_update_driver_availability(
  uuid, uuid, text, double precision, double precision, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_update_driver_availability(
  uuid, uuid, text, double precision, double precision, text
) TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_reconcile_stale_driver_availability(
  p_threshold_minutes integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '10s'
AS $function$
DECLARE
  v_cutoff timestamptz;
  v_marked_offline integer := 0;
  v_stale_busy integer := 0;
BEGIN
  IF p_threshold_minutes < 1 OR p_threshold_minutes > 1440 THEN
    RAISE EXCEPTION 'Invalid stale threshold' USING ERRCODE = '22023';
  END IF;

  v_cutoff := pg_catalog.clock_timestamp()
    - pg_catalog.make_interval(mins => p_threshold_minutes);

  SELECT pg_catalog.count(*)::integer
  INTO v_stale_busy
  FROM public.driver_availability availability
  WHERE availability.is_online = true
    AND availability.active_ride_id IS NOT NULL
    AND availability.last_seen_at IS NOT NULL
    AND availability.last_seen_at < v_cutoff;

  UPDATE public.driver_availability availability
  SET
    is_online = false,
    is_available = false,
    updated_at = pg_catalog.clock_timestamp()
  WHERE availability.is_online = true
    AND availability.is_available = true
    AND availability.active_ride_id IS NULL
    AND availability.last_seen_at IS NOT NULL
    AND availability.last_seen_at < v_cutoff;

  GET DIAGNOSTICS v_marked_offline = ROW_COUNT;

  RETURN pg_catalog.jsonb_build_object(
    'markedOffline', v_marked_offline,
    'staleBusy', v_stale_busy,
    'cutoff', v_cutoff
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_reconcile_stale_driver_availability(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_reconcile_stale_driver_availability(integer)
  TO service_role;

COMMENT ON FUNCTION public.mobility_update_driver_availability(
  uuid, uuid, text, double precision, double precision, text
) IS
  'Service-only driver presence command. Active ride ownership remains exclusively with atomic ride acceptance/release.';
COMMENT ON FUNCTION public.mobility_reconcile_stale_driver_availability(integer) IS
  'Service-only stale availability reconciliation. Busy drivers are counted but never auto-released.';
