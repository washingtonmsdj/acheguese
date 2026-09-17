-- Rollback-only remote probe: ordinary authenticated users must not read admin-only operational/audit queues.

BEGIN;

DO $$
DECLARE
  v_user_id uuid;
  v_blocked integer := 0;
BEGIN
  SELECT u.id
  INTO v_user_id
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = u.id
      AND p.is_active = true
  )
    AND NOT COALESCE(private.is_admin_user(u.id), false)
  ORDER BY u.created_at
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'probe requires non-admin user';
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM * FROM public.get_community_rpc_operational_metrics(60);
    RAISE EXCEPTION 'community_metrics_exposed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.get_community_rpc_slo_status(5, 20, 2.0, 1000);
    RAISE EXCEPTION 'community_slo_exposed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_business_profile_correction_queue('pending', 10);
    RAISE EXCEPTION 'business_correction_queue_exposed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_community_social_audit_events(NULL, NULL, 10);
    RAISE EXCEPTION 'community_social_audit_exposed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_federated_moderation_queue(
      'open', NULL, NULL, NULL, NULL, 10
    );
    RAISE EXCEPTION 'federated_moderation_queue_exposed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_trust_admin_actions_admin(10, NULL, NULL);
    RAISE EXCEPTION 'trust_admin_actions_exposed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_trust_events_admin(10, NULL, NULL, NULL, NULL);
    RAISE EXCEPTION 'trust_events_exposed';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 7 THEN
    RAISE EXCEPTION 'expected 7 admin-read denials, got %', v_blocked;
  END IF;
END $$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'authenticated_admin_read_negative',
  'passed', true,
  'blocked_rpc_count', 7,
  'rolled_back', true
) AS result;
