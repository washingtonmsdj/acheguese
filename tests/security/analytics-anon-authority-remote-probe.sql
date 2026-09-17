-- Negative authorization probe for the intentionally exposed analytics RPC.
-- Proves that authenticated callers cannot spoof another user_id and cannot
-- emit operational order/delivery events reserved for service_role.
-- Rollback-only: no synthetic analytics row is persisted.

BEGIN;

DO $probe$
DECLARE
  v_actor uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_entity uuid := gen_random_uuid();
  v_spoof_blocked boolean := false;
  v_operational_blocked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('role', 'authenticated', 'sub', v_actor::text)::text,
    true
  );

  BEGIN
    PERFORM public.track_analytics_event(
      'profile',
      v_entity,
      'page_view'::public.analytics_event_type,
      'web'::public.analytics_event_source,
      v_other,
      'probe_' || replace(gen_random_uuid()::text, '-', ''),
      '203.0.113.1'::inet,
      'probe-agent',
      'https://example.invalid',
      -12.3,
      -45.6,
      '{}'::jsonb
    );
  EXCEPTION
    WHEN insufficient_privilege THEN
      IF SQLERRM = 'analytics_user_spoofing_blocked' THEN
        v_spoof_blocked := true;
      ELSE
        RAISE;
      END IF;
  END;

  BEGIN
    PERFORM public.track_analytics_event(
      'order',
      v_entity,
      'order_completed'::public.analytics_event_type,
      'web'::public.analytics_event_source,
      NULL,
      'probe_' || replace(gen_random_uuid()::text, '-', ''),
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      '{}'::jsonb
    );
  EXCEPTION
    WHEN insufficient_privilege THEN
      IF SQLERRM = 'analytics_operational_event_requires_service_role' THEN
        v_operational_blocked := true;
      ELSE
        RAISE;
      END IF;
  END;

  IF NOT v_spoof_blocked THEN
    RAISE EXCEPTION 'analytics spoofing probe unexpectedly succeeded';
  END IF;
  IF NOT v_operational_blocked THEN
    RAISE EXCEPTION 'analytics operational event probe unexpectedly succeeded';
  END IF;
END;
$probe$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'analytics_anon_authority_negative',
  'passed', true,
  'rolled_back', true
) AS result;
