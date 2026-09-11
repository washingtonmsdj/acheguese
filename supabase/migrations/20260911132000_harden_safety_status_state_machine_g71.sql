BEGIN;

-- G71: Safety lifecycle transitions are security/forensic commands.
-- The actor is derived from the authenticated active profile; the existing
-- p_actor_profile_id argument is retained only for API compatibility and must
-- match the server-derived actor. Terminal states are immutable.

CREATE OR REPLACE FUNCTION public.update_safety_emergency_alert_status(
  p_alert_id uuid,
  p_status text,
  p_actor_profile_id uuid
)
RETURNS public.emergency_alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_alert public.emergency_alerts%ROWTYPE;
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_actor_user_id uuid := auth.uid();
  v_is_owner boolean := false;
  v_is_admin boolean := false;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF v_actor_user_id IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_alert_id IS NULL
     OR p_actor_profile_id IS NULL
     OR p_actor_profile_id IS DISTINCT FROM v_actor_profile_id
     OR p_status NOT IN ('acknowledged', 'resolved', 'false_alarm') THEN
    RAISE EXCEPTION 'invalid_safety_alert_status_request'
      USING ERRCODE = '22023';
  END IF;

  SELECT alert.*
  INTO v_alert
  FROM public.emergency_alerts alert
  WHERE alert.id = p_alert_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'safety_alert_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_is_owner := v_alert.profile_id = v_actor_profile_id;
  v_is_admin := COALESCE(private.is_admin_from_roles(v_actor_user_id), false);

  IF NOT v_is_admin AND NOT v_is_owner THEN
    RAISE EXCEPTION 'forbidden_safety_alert_transition'
      USING ERRCODE = '42501';
  END IF;

  -- Exact repeats are idempotent and do not create duplicate forensic audit.
  IF v_alert.status = p_status THEN
    RETURN v_alert;
  END IF;

  IF v_alert.status IN ('resolved', 'false_alarm') THEN
    RAISE EXCEPTION 'terminal_safety_alert_cannot_reopen'
      USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_admin AND p_status <> 'false_alarm' THEN
    RAISE EXCEPTION 'forbidden_safety_alert_transition'
      USING ERRCODE = '42501';
  END IF;

  IF NOT (
    (v_alert.status = 'active' AND p_status IN ('acknowledged', 'resolved', 'false_alarm'))
    OR
    (v_alert.status = 'acknowledged' AND p_status IN ('resolved', 'false_alarm'))
  ) THEN
    RAISE EXCEPTION 'invalid_safety_alert_transition'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.emergency_alerts alert
  SET status = p_status,
      resolved_at = CASE
        WHEN p_status IN ('resolved', 'false_alarm') THEN v_now
        ELSE NULL
      END,
      updated_at = v_now
  WHERE alert.id = p_alert_id
  RETURNING * INTO v_alert;

  INSERT INTO public.safety_audit_log (
    action,
    entity_type,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    CASE p_status
      WHEN 'acknowledged' THEN 'alert_acknowledged'
      WHEN 'false_alarm' THEN 'alert_false_alarm'
      ELSE 'alert_resolved'
    END,
    'alert',
    p_alert_id,
    v_actor_profile_id,
    pg_catalog.jsonb_build_object(
      'new_status', p_status,
      'actor_user_id', v_actor_user_id
    )
  );

  RETURN v_alert;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_safety_emergency_alert_status(uuid, text, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_safety_emergency_alert_status(uuid, text, uuid)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_safety_incident_status(
  p_incident_id uuid,
  p_status text,
  p_actor_profile_id uuid
)
RETURNS public.safety_incidents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_incident public.safety_incidents%ROWTYPE;
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_actor_user_id uuid := auth.uid();
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF v_actor_user_id IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_incident_id IS NULL
     OR p_actor_profile_id IS NULL
     OR p_actor_profile_id IS DISTINCT FROM v_actor_profile_id
     OR p_status NOT IN ('investigating', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'invalid_safety_incident_status_request'
      USING ERRCODE = '22023';
  END IF;

  IF NOT COALESCE(private.is_admin_from_roles(v_actor_user_id), false) THEN
    RAISE EXCEPTION 'forbidden_safety_incident_transition'
      USING ERRCODE = '42501';
  END IF;

  SELECT incident.*
  INTO v_incident
  FROM public.safety_incidents incident
  WHERE incident.id = p_incident_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'safety_incident_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_incident.status = p_status THEN
    RETURN v_incident;
  END IF;

  IF v_incident.status IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'terminal_safety_incident_cannot_reopen'
      USING ERRCODE = '22023';
  END IF;

  IF NOT (
    (v_incident.status = 'reported' AND p_status IN ('investigating', 'resolved', 'dismissed'))
    OR
    (v_incident.status = 'investigating' AND p_status IN ('resolved', 'dismissed'))
  ) THEN
    RAISE EXCEPTION 'invalid_safety_incident_transition'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.safety_incidents incident
  SET status = p_status,
      resolved_at = CASE
        WHEN p_status IN ('resolved', 'dismissed') THEN v_now
        ELSE NULL
      END,
      updated_at = v_now
  WHERE incident.id = p_incident_id
  RETURNING * INTO v_incident;

  INSERT INTO public.safety_audit_log (
    action,
    entity_type,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    'incident_status_updated',
    'incident',
    p_incident_id,
    v_actor_profile_id,
    pg_catalog.jsonb_build_object(
      'new_status', p_status,
      'actor_user_id', v_actor_user_id
    )
  );

  RETURN v_incident;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_safety_incident_status(uuid, text, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_safety_incident_status(uuid, text, uuid)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.update_safety_emergency_alert_status(uuid, text, uuid) IS
  'G71 Safety alert lifecycle command. Actor is server-derived from the active profile; terminal resolved/false_alarm states cannot reopen.';

COMMENT ON FUNCTION public.update_safety_incident_status(uuid, text, uuid) IS
  'G71 admin Safety incident lifecycle command. Actor is server-derived from the active profile; terminal resolved/dismissed states cannot reopen.';

NOTIFY pgrst, 'reload schema';

COMMIT;
