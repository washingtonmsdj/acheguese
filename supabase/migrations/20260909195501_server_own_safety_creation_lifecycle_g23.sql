-- G23: make Safety alert/incident creation server-owned.
--
-- Browser INSERT previously allowed callers to pre-populate lifecycle fields such
-- as status/resolved_at. Creation now derives the active Profile, fixes initial
-- lifecycle state/timestamps, and leaves audit/notification side effects to the
-- existing canonical INSERT triggers.

CREATE OR REPLACE FUNCTION public.create_safety_emergency_alert(
  p_profile_id uuid,
  p_ride_id uuid,
  p_alert_type text,
  p_description text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision,
  p_metadata jsonb
)
RETURNS public.emergency_alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_alert public.emergency_alerts%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_metadata jsonb := COALESCE(p_metadata, '{}'::jsonb);
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_profile_id IS NULL OR p_profile_id IS DISTINCT FROM v_actor_profile_id THEN
    RAISE EXCEPTION 'safety_actor_profile_mismatch' USING ERRCODE = '42501';
  END IF;

  IF p_alert_type NOT IN ('sos','emergency_button','automatic','manual','panic') THEN
    RAISE EXCEPTION 'invalid_safety_alert_type' USING ERRCODE = '22023';
  END IF;

  IF p_description IS NOT NULL AND (
    pg_catalog.char_length(p_description) NOT BETWEEN 1 AND 1000
    OR p_description ~ '[<>]'
  ) THEN
    RAISE EXCEPTION 'invalid_safety_alert_description' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    (p_latitude IS NULL AND p_longitude IS NULL)
    OR (
      p_latitude BETWEEN -90 AND 90
      AND p_longitude BETWEEN -180 AND 180
    )
  ) THEN
    RAISE EXCEPTION 'invalid_safety_alert_location' USING ERRCODE = '22023';
  END IF;

  IF p_accuracy IS NOT NULL AND (p_accuracy < 0 OR p_accuracy > 100000) THEN
    RAISE EXCEPTION 'invalid_safety_alert_accuracy' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(v_metadata) <> 'object'
     OR pg_catalog.pg_column_size(v_metadata) > 32768
  THEN
    RAISE EXCEPTION 'invalid_safety_alert_metadata' USING ERRCODE = '22023';
  END IF;

  IF p_ride_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.ride_requests ride
    WHERE ride.id = p_ride_id
      AND v_actor_profile_id IN (
        ride.passenger_profile_id,
        ride.driver_profile_id
      )
  ) THEN
    RAISE EXCEPTION 'safety_ride_participant_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.emergency_alerts (
    ride_id,
    profile_id,
    alert_type,
    description,
    status,
    latitude,
    longitude,
    accuracy,
    metadata,
    created_at,
    updated_at,
    resolved_at
  )
  VALUES (
    p_ride_id,
    v_actor_profile_id,
    p_alert_type,
    p_description,
    'active',
    p_latitude,
    p_longitude,
    p_accuracy,
    v_metadata,
    v_now,
    v_now,
    NULL
  )
  RETURNING * INTO v_alert;

  RETURN v_alert;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_safety_incident(
  p_reported_by uuid,
  p_ride_id uuid,
  p_incident_type text,
  p_severity text,
  p_description text,
  p_latitude double precision,
  p_longitude double precision
)
RETURNS public.safety_incidents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_incident public.safety_incidents%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_reported_by IS NULL OR p_reported_by IS DISTINCT FROM v_actor_profile_id THEN
    RAISE EXCEPTION 'safety_actor_profile_mismatch' USING ERRCODE = '42501';
  END IF;

  IF p_incident_type NOT IN (
    'harassment','unsafe_driving','route_deviation',
    'vehicle_issue','accident','other'
  ) THEN
    RAISE EXCEPTION 'invalid_safety_incident_type' USING ERRCODE = '22023';
  END IF;

  IF p_severity NOT IN ('low','medium','high','critical') THEN
    RAISE EXCEPTION 'invalid_safety_incident_severity' USING ERRCODE = '22023';
  END IF;

  IF p_description IS NULL
     OR pg_catalog.char_length(pg_catalog.btrim(p_description)) NOT BETWEEN 10 AND 2000
     OR p_description ~ '[<>]'
  THEN
    RAISE EXCEPTION 'invalid_safety_incident_description' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    (p_latitude IS NULL AND p_longitude IS NULL)
    OR (
      p_latitude BETWEEN -90 AND 90
      AND p_longitude BETWEEN -180 AND 180
    )
  ) THEN
    RAISE EXCEPTION 'invalid_safety_incident_location' USING ERRCODE = '22023';
  END IF;

  IF p_ride_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.ride_requests ride
    WHERE ride.id = p_ride_id
      AND v_actor_profile_id IN (
        ride.passenger_profile_id,
        ride.driver_profile_id
      )
  ) THEN
    RAISE EXCEPTION 'safety_ride_participant_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.safety_incidents (
    ride_id,
    reported_by,
    incident_type,
    severity,
    status,
    description,
    latitude,
    longitude,
    metadata,
    created_at,
    updated_at,
    resolved_at
  )
  VALUES (
    p_ride_id,
    v_actor_profile_id,
    p_incident_type,
    p_severity,
    'reported',
    p_description,
    p_latitude,
    p_longitude,
    '{}'::jsonb,
    v_now,
    v_now,
    NULL
  )
  RETURNING * INTO v_incident;

  RETURN v_incident;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_safety_emergency_alert(
  uuid, uuid, text, text, double precision, double precision, double precision, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_safety_emergency_alert(
  uuid, uuid, text, text, double precision, double precision, double precision, jsonb
) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_safety_incident(
  uuid, uuid, text, text, text, double precision, double precision
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_safety_incident(
  uuid, uuid, text, text, text, double precision, double precision
) TO authenticated, service_role;

REVOKE INSERT ON TABLE public.emergency_alerts FROM authenticated;
REVOKE INSERT ON TABLE public.safety_incidents FROM authenticated;

DROP POLICY IF EXISTS emergency_alerts_insert_own ON public.emergency_alerts;
DROP POLICY IF EXISTS safety_incidents_insert_own ON public.safety_incidents;

COMMENT ON FUNCTION public.create_safety_emergency_alert(
  uuid, uuid, text, text, double precision, double precision, double precision, jsonb
) IS
  'Authenticated active-Profile Safety alert creation command. Initial lifecycle state and timestamps are server-owned; existing insert triggers own audit and notification side effects.';

COMMENT ON FUNCTION public.create_safety_incident(
  uuid, uuid, text, text, text, double precision, double precision
) IS
  'Authenticated active-Profile Safety incident creation command. Initial reported state and timestamps are server-owned; existing insert triggers own audit and notification side effects.';
