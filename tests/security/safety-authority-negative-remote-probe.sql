-- Rollback-only remote probe: authenticated callers cannot attach Safety evidence to another reporter's incident,
-- mutate another profile's alert, or perform admin-only incident transitions.

BEGIN;

DO $setup$
DECLARE
  v_actor_user_id uuid;
  v_actor_profile_id uuid;
  v_foreign_profile_id uuid;
  v_incident_id uuid;
  v_alert_id uuid;
BEGIN
  SELECT u.id, p.id
  INTO v_actor_user_id, v_actor_profile_id
  FROM auth.users u
  JOIN public.profiles p
    ON p.user_id = u.id
   AND p.is_active = true
  WHERE NOT COALESCE(private.is_admin_user(u.id), false)
  ORDER BY u.created_at, p.created_at
  LIMIT 1;

  SELECT p.id
  INTO v_foreign_profile_id
  FROM public.profiles p
  WHERE p.is_active = true
    AND p.user_id IS NOT NULL
    AND p.id IS DISTINCT FROM v_actor_profile_id
  ORDER BY p.created_at, p.id
  LIMIT 1;

  IF v_actor_user_id IS NULL
     OR v_actor_profile_id IS NULL
     OR v_foreign_profile_id IS NULL THEN
    RAISE EXCEPTION 'safety_probe_requires_actor_and_foreign_profile';
  END IF;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES(v_actor_user_id, v_actor_profile_id)
  ON CONFLICT(user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  INSERT INTO public.safety_incidents(
    reported_by,
    incident_type,
    severity,
    status,
    description,
    metadata
  ) VALUES (
    v_foreign_profile_id,
    'other',
    'medium',
    'reported',
    'Security probe foreign incident',
    '{}'::jsonb
  ) RETURNING id INTO v_incident_id;

  INSERT INTO public.emergency_alerts(
    profile_id,
    alert_type,
    status,
    description,
    metadata
  ) VALUES (
    v_foreign_profile_id,
    'manual',
    'active',
    'Security probe foreign alert',
    '{}'::jsonb
  ) RETURNING id INTO v_alert_id;

  PERFORM set_config('app.safety_probe.actor_user_id', v_actor_user_id::text, true);
  PERFORM set_config('app.safety_probe.actor_profile_id', v_actor_profile_id::text, true);
  PERFORM set_config('app.safety_probe.incident_id', v_incident_id::text, true);
  PERFORM set_config('app.safety_probe.alert_id', v_alert_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.safety_probe.actor_user_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.safety_probe.actor_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $negative_authorization$
DECLARE
  v_actor_profile uuid := current_setting('app.safety_probe.actor_profile_id')::uuid;
  v_incident uuid := current_setting('app.safety_probe.incident_id')::uuid;
  v_alert uuid := current_setting('app.safety_probe.alert_id')::uuid;
  v_blocked integer := 0;
BEGIN
  BEGIN
    PERFORM public.register_safety_evidence(
      v_incident,
      'photo',
      v_incident::text || '/probe.jpg',
      'probe.jpg',
      '{}'::jsonb
    );
    RAISE EXCEPTION 'foreign_incident_evidence_registration_allowed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.update_safety_emergency_alert_status(
      v_alert,
      'false_alarm',
      v_actor_profile
    );
    RAISE EXCEPTION 'foreign_alert_status_mutation_allowed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.update_safety_incident_status(
      v_incident,
      'investigating',
      v_actor_profile
    );
    RAISE EXCEPTION 'non_admin_incident_status_mutation_allowed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 3 THEN
    RAISE EXCEPTION 'expected 3 safety denials, got %', v_blocked;
  END IF;
END;
$negative_authorization$;

RESET ROLE;
ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'safety_authority_negative',
  'passed', true,
  'blocked_rpc_count', 3,
  'rolled_back', true
) AS result;
