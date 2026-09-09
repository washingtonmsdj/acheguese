-- Harden failed-delivery resolution invariants after broker authority was narrowed to admins.
--
-- The command remains service-role-only. The database now validates references
-- against their canonical owners and owns the resolution timestamp.

CREATE OR REPLACE FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  p_ride_id uuid,
  p_resolution_update jsonb
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
  v_update jsonb;
  v_status text;
  v_current_status text;
  v_next_ride_id uuid;
  v_handoff_profile_id uuid;
  v_owner_profile_id uuid;
BEGIN
  IF p_ride_id IS NULL
     OR p_resolution_update IS NULL
     OR pg_catalog.jsonb_typeof(p_resolution_update) <> 'object'
     OR p_resolution_update = '{}'::jsonb THEN
    RAISE EXCEPTION 'invalid failed delivery resolution update' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_object_keys(p_resolution_update) AS key_name
    WHERE key_name NOT IN (
      'next_ride_id','handoff_driver_profile_id',
      'manual_resolution_owner_profile_id','resolution_status',
      'resolution_action_notes'
    )
  ) THEN
    RAISE EXCEPTION 'failed delivery resolution contains unsupported fields' USING ERRCODE = '22023';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy'
     OR v_ride.status IS DISTINCT FROM 'failed_delivery'
     OR v_ride.failed_delivery_metadata IS NULL THEN
    RAISE EXCEPTION 'ride is not an unresolved failed delivery' USING ERRCODE = '22023';
  END IF;

  v_current_status := COALESCE(
    NULLIF(pg_catalog.btrim(v_ride.failed_delivery_metadata->>'resolution_status'), ''),
    'pending'
  );
  v_status := NULLIF(pg_catalog.btrim(p_resolution_update->>'resolution_status'), '');

  IF v_status IS NOT NULL
     AND v_status NOT IN ('pending','in_progress','resolved','escalated') THEN
    RAISE EXCEPTION 'invalid resolution_status' USING ERRCODE = '22023';
  END IF;

  IF v_current_status = 'resolved'
     AND v_status IS NOT NULL
     AND v_status <> 'resolved' THEN
    RAISE EXCEPTION 'resolved delivery resolution cannot be reopened'
      USING ERRCODE = '22023';
  END IF;

  IF p_resolution_update ? 'next_ride_id' THEN
    IF pg_catalog.jsonb_typeof(p_resolution_update->'next_ride_id') <> 'string' THEN
      RAISE EXCEPTION 'next_ride_id must be a uuid string' USING ERRCODE = '22023';
    END IF;
    v_next_ride_id := NULLIF(pg_catalog.btrim(p_resolution_update->>'next_ride_id'), '')::uuid;
    IF v_next_ride_id = p_ride_id THEN
      RAISE EXCEPTION 'next ride cannot reference the failed delivery itself'
        USING ERRCODE = '22023';
    END IF;

    IF v_next_ride_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM public.ride_requests next_request
         WHERE next_request.id = v_next_ride_id
           AND next_request.ride_mode = 'motoboy'
           AND next_request.passenger_profile_id IS NOT DISTINCT FROM v_ride.passenger_profile_id
           AND next_request.source_type IS NOT DISTINCT FROM v_ride.source_type
           AND next_request.source_id IS NOT DISTINCT FROM v_ride.source_id
       ) THEN
      RAISE EXCEPTION 'next ride is not a compatible redelivery'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_resolution_update ? 'handoff_driver_profile_id' THEN
    IF pg_catalog.jsonb_typeof(p_resolution_update->'handoff_driver_profile_id') <> 'string' THEN
      RAISE EXCEPTION 'handoff_driver_profile_id must be a uuid string' USING ERRCODE = '22023';
    END IF;
    v_handoff_profile_id :=
      NULLIF(pg_catalog.btrim(p_resolution_update->>'handoff_driver_profile_id'), '')::uuid;
    IF v_handoff_profile_id IS NOT NULL
       AND v_ride.failed_delivery_metadata->>'item_destination' <> 'handoff_to_another_driver' THEN
      RAISE EXCEPTION 'handoff driver is incompatible with item destination'
        USING ERRCODE = '22023';
    END IF;

    IF v_handoff_profile_id IS NOT NULL
       AND v_handoff_profile_id IS NOT DISTINCT FROM v_ride.driver_profile_id THEN
      RAISE EXCEPTION 'handoff driver must differ from the failed delivery driver'
        USING ERRCODE = '22023';
    END IF;

    IF v_handoff_profile_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM public.driver_data driver
         JOIN public.profiles profile ON profile.id = driver.profile_id
         WHERE driver.profile_id = v_handoff_profile_id
           AND driver.can_do_delivery IS TRUE
           AND driver.is_verified IS TRUE
           AND driver.subscription_active IS TRUE
           AND profile.is_active IS DISTINCT FROM FALSE
           AND NOT (
             (profile.is_suspended IS TRUE OR profile.suspended IS TRUE)
             AND (
               profile.suspended_until IS NULL
               OR profile.suspended_until > v_now
             )
           )
       ) THEN
      RAISE EXCEPTION 'handoff profile is not an eligible delivery driver'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_resolution_update ? 'manual_resolution_owner_profile_id' THEN
    IF pg_catalog.jsonb_typeof(p_resolution_update->'manual_resolution_owner_profile_id') <> 'string' THEN
      RAISE EXCEPTION 'manual_resolution_owner_profile_id must be a uuid string' USING ERRCODE = '22023';
    END IF;
    v_owner_profile_id :=
      NULLIF(pg_catalog.btrim(p_resolution_update->>'manual_resolution_owner_profile_id'), '')::uuid;
    IF v_owner_profile_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM public.profiles profile
         WHERE profile.id = v_owner_profile_id
           AND profile.is_active IS DISTINCT FROM FALSE
           AND public.is_admin(profile.user_id)
       ) THEN
      RAISE EXCEPTION 'resolution owner must belong to an active admin profile'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_resolution_update ? 'resolution_action_notes'
     AND (
       pg_catalog.jsonb_typeof(p_resolution_update->'resolution_action_notes') <> 'string'
       OR pg_catalog.length(p_resolution_update->>'resolution_action_notes') > 2000
     ) THEN
    RAISE EXCEPTION 'invalid resolution_action_notes' USING ERRCODE = '22023';
  END IF;

  IF v_status = 'escalated'
     AND v_owner_profile_id IS NULL
     AND NULLIF(
       pg_catalog.btrim(v_ride.failed_delivery_metadata->>'manual_resolution_owner_profile_id'),
       ''
     ) IS NULL THEN
    RAISE EXCEPTION 'manual_resolution_owner_profile_id is required when escalated'
      USING ERRCODE = '22023';
  END IF;

  IF v_status = 'resolved'
     AND v_ride.failed_delivery_metadata->>'item_destination' = 'handoff_to_another_driver'
     AND v_handoff_profile_id IS NULL
     AND NULLIF(
       pg_catalog.btrim(v_ride.failed_delivery_metadata->>'handoff_driver_profile_id'),
       ''
     ) IS NULL THEN
    RAISE EXCEPTION 'handoff_driver_profile_id is required to resolve a handoff'
      USING ERRCODE = '22023';
  END IF;

  v_update := p_resolution_update;

  IF v_status = 'resolved' AND v_current_status <> 'resolved' THEN
    v_update := v_update || pg_catalog.jsonb_build_object('resolved_at', v_now);
  END IF;

  UPDATE public.ride_requests request
  SET failed_delivery_metadata = request.failed_delivery_metadata || v_update,
      updated_at = v_now
  WHERE request.id = p_ride_id;

  RETURN pg_catalog.jsonb_build_object(
    'updated', TRUE,
    'ride_id', p_ride_id,
    'resolution_status',
      COALESCE(v_status, v_ride.failed_delivery_metadata->>'resolution_status')
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  uuid, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_update_failed_delivery_resolution_atomic(
  uuid, jsonb
) TO service_role;
