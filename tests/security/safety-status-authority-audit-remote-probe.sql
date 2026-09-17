-- Rollback-only proof for Safety status authority and audit-contract alignment.
-- Verifies that a non-owner cannot mutate an alert, a non-admin owner can only
-- mark its own alert as false_alarm, and an admin can transition an incident.

BEGIN;

DO $setup$
DECLARE
  v_owner_user_id uuid;
  v_owner_profile_id uuid;
  v_outsider_user_id uuid;
  v_outsider_profile_id uuid;
  v_admin_user_id uuid;
  v_admin_profile_id uuid;
  v_alert_id uuid;
  v_incident_id uuid;
BEGIN
  SELECT p.user_id, p.id
  INTO v_owner_user_id, v_owner_profile_id
  FROM public.profiles p
  WHERE p.user_id IS NOT NULL
    AND p.is_active IS TRUE
    AND NOT COALESCE(private.is_admin_from_roles(p.user_id), false)
    AND NOT EXISTS (
      SELECT 1 FROM public.account_deletion_requests request
      WHERE request.user_id = p.user_id
        AND request.status IN ('scheduled','processing','failed','completed')
    )
  ORDER BY p.created_at, p.id
  LIMIT 1;

  SELECT p.user_id, p.id
  INTO v_outsider_user_id, v_outsider_profile_id
  FROM public.profiles p
  WHERE p.user_id IS NOT NULL
    AND p.is_active IS TRUE
    AND p.user_id <> v_owner_user_id
    AND NOT COALESCE(private.is_admin_from_roles(p.user_id), false)
    AND NOT EXISTS (
      SELECT 1 FROM public.account_deletion_requests request
      WHERE request.user_id = p.user_id
        AND request.status IN ('scheduled','processing','failed','completed')
    )
  ORDER BY p.created_at, p.id
  LIMIT 1;

  SELECT p.user_id, p.id
  INTO v_admin_user_id, v_admin_profile_id
  FROM public.profiles p
  WHERE p.user_id IS NOT NULL
    AND p.is_active IS TRUE
    AND COALESCE(private.is_admin_from_roles(p.user_id), false)
    AND NOT EXISTS (
      SELECT 1 FROM public.account_deletion_requests request
      WHERE request.user_id = p.user_id
        AND request.status IN ('scheduled','processing','failed','completed')
    )
  ORDER BY p.created_at, p.id
  LIMIT 1;

  IF v_owner_user_id IS NULL OR v_outsider_user_id IS NULL OR v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'safety_status_probe_requires_owner_outsider_admin';
  END IF;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES
    (v_owner_user_id, v_owner_profile_id),
    (v_outsider_user_id, v_outsider_profile_id),
    (v_admin_user_id, v_admin_profile_id)
  ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  INSERT INTO public.emergency_alerts(profile_id, alert_type, description, status, metadata)
  VALUES (v_owner_profile_id, 'manual', 'rollback-only safety status authority probe', 'active', '{}'::jsonb)
  RETURNING id INTO v_alert_id;

  INSERT INTO public.safety_incidents(reported_by, incident_type, severity, status, description, metadata)
  VALUES (v_owner_profile_id, 'other', 'low', 'reported', 'Rollback-only safety status authority probe.', '{}'::jsonb)
  RETURNING id INTO v_incident_id;

  PERFORM set_config('app.safety_status_probe.owner_user_id', v_owner_user_id::text, true);
  PERFORM set_config('app.safety_status_probe.owner_profile_id', v_owner_profile_id::text, true);
  PERFORM set_config('app.safety_status_probe.outsider_user_id', v_outsider_user_id::text, true);
  PERFORM set_config('app.safety_status_probe.outsider_profile_id', v_outsider_profile_id::text, true);
  PERFORM set_config('app.safety_status_probe.admin_user_id', v_admin_user_id::text, true);
  PERFORM set_config('app.safety_status_probe.admin_profile_id', v_admin_profile_id::text, true);
  PERFORM set_config('app.safety_status_probe.alert_id', v_alert_id::text, true);
  PERFORM set_config('app.safety_status_probe.incident_id', v_incident_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.sub', current_setting('app.safety_status_probe.outsider_user_id'), true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.safety_status_probe.outsider_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $outsider$
DECLARE
  v_blocked boolean := false;
BEGIN
  BEGIN
    PERFORM public.update_safety_emergency_alert_status(
      current_setting('app.safety_status_probe.alert_id')::uuid,
      'false_alarm',
      current_setting('app.safety_status_probe.outsider_profile_id')::uuid
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := true;
  END;
  IF NOT v_blocked THEN
    RAISE EXCEPTION 'outsider_changed_foreign_alert';
  END IF;
END;
$outsider$;

SELECT set_config('request.jwt.claim.sub', current_setting('app.safety_status_probe.owner_user_id'), true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.safety_status_probe.owner_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $owner$
DECLARE
  v_blocked boolean := false;
  v_status text;
BEGIN
  BEGIN
    PERFORM public.update_safety_emergency_alert_status(
      current_setting('app.safety_status_probe.alert_id')::uuid,
      'acknowledged',
      current_setting('app.safety_status_probe.owner_profile_id')::uuid
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := true;
  END;
  IF NOT v_blocked THEN
    RAISE EXCEPTION 'non_admin_owner_acknowledged_alert';
  END IF;

  SELECT status INTO v_status
  FROM public.update_safety_emergency_alert_status(
    current_setting('app.safety_status_probe.alert_id')::uuid,
    'false_alarm',
    current_setting('app.safety_status_probe.owner_profile_id')::uuid
  );
  IF v_status IS DISTINCT FROM 'false_alarm' THEN
    RAISE EXCEPTION 'owner_false_alarm_failed';
  END IF;
END;
$owner$;

SELECT set_config('request.jwt.claim.sub', current_setting('app.safety_status_probe.admin_user_id'), true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.safety_status_probe.admin_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $admin$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM public.update_safety_incident_status(
    current_setting('app.safety_status_probe.incident_id')::uuid,
    'investigating',
    current_setting('app.safety_status_probe.admin_profile_id')::uuid
  );
  IF v_status IS DISTINCT FROM 'investigating' THEN
    RAISE EXCEPTION 'admin_incident_transition_failed';
  END IF;
END;
$admin$;

RESET ROLE;

DO $audit$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.safety_audit_log
    WHERE entity_id = current_setting('app.safety_status_probe.alert_id')::uuid
      AND action = 'alert_false_alarm'
  ) THEN
    RAISE EXCEPTION 'alert_false_alarm_audit_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.safety_audit_log
    WHERE entity_id = current_setting('app.safety_status_probe.incident_id')::uuid
      AND action = 'incident_status_updated'
  ) THEN
    RAISE EXCEPTION 'incident_status_updated_audit_missing';
  END IF;
END;
$audit$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'safety_status_authority_and_audit',
  'passed', true,
  'outsider_blocked', true,
  'owner_admin_transition_blocked', true,
  'owner_false_alarm_allowed', true,
  'admin_incident_transition_allowed', true,
  'audit_contract_valid', true,
  'rolled_back', true
) AS result;
