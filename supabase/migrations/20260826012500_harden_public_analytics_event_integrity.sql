-- Harden the intentionally public analytics broker without changing its API
-- signature. Browser telemetry may record engagement events, but operational
-- order/delivery lifecycle events are trusted-server only because daily
-- conversion metrics are derived from analytics_events.
--
-- Network/location fields are also trusted-server only. Canonical browser
-- callers do not send them, and accepting caller-declared IP/geolocation would
-- create misleading telemetry/audit data.

CREATE OR REPLACE FUNCTION public.track_analytics_event(
  p_entity_type text,
  p_entity_id uuid,
  p_event_type public.analytics_event_type,
  p_event_source public.analytics_event_source DEFAULT 'web'::public.analytics_event_source,
  p_user_id uuid DEFAULT NULL::uuid,
  p_session_id text DEFAULT NULL::text,
  p_ip_address inet DEFAULT NULL::inet,
  p_user_agent text DEFAULT NULL::text,
  p_referrer text DEFAULT NULL::text,
  p_latitude numeric DEFAULT NULL::numeric,
  p_longitude numeric DEFAULT NULL::numeric,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions', 'private', 'pg_temp'
SET statement_timeout TO '2s'
AS $function$
DECLARE
  v_event_id uuid := gen_random_uuid();
  v_auth_uid uuid := auth.uid();
  v_is_service_role boolean := coalesce(auth.role() = 'service_role', false);
  v_effective_user_id uuid;
  v_session_id text := nullif(btrim(p_session_id), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_recent_count integer := 0;
  v_existing_session_user uuid;
BEGIN
  IF p_entity_type IS NULL
     OR char_length(p_entity_type) NOT BETWEEN 1 AND 64
     OR p_entity_type !~ '^[a-z][a-z0-9_]{0,63}$' THEN
    RAISE EXCEPTION 'invalid_analytics_entity_type' USING ERRCODE = '22023';
  END IF;

  IF p_entity_id IS NULL THEN
    RAISE EXCEPTION 'analytics_entity_id_required' USING ERRCODE = '22023';
  END IF;

  IF v_session_id IS NOT NULL AND (
       char_length(v_session_id) > 128
       OR v_session_id !~ '^[A-Za-z0-9:_-]+$'
     ) THEN
    RAISE EXCEPTION 'invalid_analytics_session_id' USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role AND v_auth_uid IS NULL AND v_session_id IS NULL THEN
    RAISE EXCEPTION 'analytics_session_required' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(v_metadata) <> 'object' OR octet_length(v_metadata::text) > 8192 THEN
    RAISE EXCEPTION 'invalid_analytics_metadata' USING ERRCODE = '22023';
  END IF;

  IF p_user_agent IS NOT NULL AND char_length(p_user_agent) > 512 THEN
    RAISE EXCEPTION 'analytics_user_agent_too_long' USING ERRCODE = '22023';
  END IF;

  IF p_referrer IS NOT NULL AND char_length(p_referrer) > 2048 THEN
    RAISE EXCEPTION 'analytics_referrer_too_long' USING ERRCODE = '22023';
  END IF;

  IF p_latitude IS NOT NULL AND (p_latitude < -90 OR p_latitude > 90) THEN
    RAISE EXCEPTION 'analytics_latitude_out_of_range' USING ERRCODE = '22023';
  END IF;

  IF p_longitude IS NOT NULL AND (p_longitude < -180 OR p_longitude > 180) THEN
    RAISE EXCEPTION 'analytics_longitude_out_of_range' USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role
     AND p_event_type IN (
       'order_started'::public.analytics_event_type,
       'order_completed'::public.analytics_event_type,
       'order_cancelled'::public.analytics_event_type,
       'delivery_requested'::public.analytics_event_type,
       'delivery_completed'::public.analytics_event_type
     ) THEN
    RAISE EXCEPTION 'analytics_operational_event_requires_service_role'
      USING ERRCODE = '42501';
  END IF;

  IF v_is_service_role THEN
    v_effective_user_id := p_user_id;
  ELSE
    IF p_user_id IS NOT NULL AND (v_auth_uid IS NULL OR p_user_id <> v_auth_uid) THEN
      RAISE EXCEPTION 'analytics_user_spoofing_blocked' USING ERRCODE = '42501';
    END IF;
    v_effective_user_id := p_user_id;
  END IF;

  IF NOT v_is_service_role THEN
    IF v_session_id IS NOT NULL THEN
      PERFORM pg_advisory_xact_lock(hashtextextended('analytics:session:' || v_session_id, 0));
      SELECT count(*)::integer
        INTO v_recent_count
        FROM public.analytics_events
       WHERE session_id = v_session_id
         AND created_at >= clock_timestamp() - interval '1 minute';
    ELSIF v_auth_uid IS NOT NULL THEN
      PERFORM pg_advisory_xact_lock(hashtextextended('analytics:user:' || v_auth_uid::text, 0));
      SELECT count(*)::integer
        INTO v_recent_count
        FROM public.analytics_events
       WHERE user_id = v_auth_uid
         AND created_at >= clock_timestamp() - interval '1 minute';
    END IF;

    IF v_recent_count >= 120 THEN
      RAISE EXCEPTION 'analytics_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.analytics_events (
    id,
    entity_type,
    entity_id,
    event_type,
    event_source,
    user_id,
    session_id,
    ip_address,
    user_agent,
    referrer,
    latitude,
    longitude,
    metadata
  ) VALUES (
    v_event_id,
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_event_source,
    v_effective_user_id,
    v_session_id,
    CASE WHEN v_is_service_role THEN p_ip_address ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_user_agent ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_referrer ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_latitude ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_longitude ELSE NULL END,
    v_metadata
  );

  IF v_session_id IS NOT NULL THEN
    SELECT s.user_id
      INTO v_existing_session_user
      FROM public.analytics_sessions s
     WHERE s.session_id = v_session_id
     FOR UPDATE;

    IF FOUND
       AND NOT v_is_service_role
       AND v_existing_session_user IS NOT NULL
       AND v_existing_session_user IS DISTINCT FROM v_effective_user_id THEN
      RAISE EXCEPTION 'analytics_session_not_owned' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.analytics_sessions (
      session_id,
      user_id,
      ip_address,
      user_agent,
      first_seen_at,
      last_seen_at,
      metadata
    ) VALUES (
      v_session_id,
      v_effective_user_id,
      CASE WHEN v_is_service_role THEN p_ip_address ELSE NULL END,
      CASE WHEN v_is_service_role THEN p_user_agent ELSE NULL END,
      now(),
      now(),
      '{}'::jsonb
    )
    ON CONFLICT (session_id) DO UPDATE
      SET last_seen_at = now(),
          user_id = coalesce(public.analytics_sessions.user_id, excluded.user_id);
  END IF;

  RETURN v_event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.track_analytics_event(
  text,
  uuid,
  public.analytics_event_type,
  public.analytics_event_source,
  uuid,
  text,
  inet,
  text,
  text,
  numeric,
  numeric,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.track_analytics_event(
  text,
  uuid,
  public.analytics_event_type,
  public.analytics_event_source,
  uuid,
  text,
  inet,
  text,
  text,
  numeric,
  numeric,
  jsonb
) TO anon, authenticated, service_role;

DO $verify$
DECLARE
  v_definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname = 'track_analytics_event'
     AND pg_get_function_identity_arguments(p.oid) =
       'p_entity_type text, p_entity_id uuid, p_event_type analytics_event_type, p_event_source analytics_event_source, p_user_id uuid, p_session_id text, p_ip_address inet, p_user_agent text, p_referrer text, p_latitude numeric, p_longitude numeric, p_metadata jsonb';

  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'track_analytics_event definition missing';
  END IF;

  IF position('analytics_operational_event_requires_service_role' in v_definition) = 0 THEN
    RAISE EXCEPTION 'operational analytics event guard missing';
  END IF;

  IF position('CASE WHEN v_is_service_role THEN p_ip_address ELSE NULL END' in v_definition) = 0 THEN
    RAISE EXCEPTION 'browser network-field neutralization missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
