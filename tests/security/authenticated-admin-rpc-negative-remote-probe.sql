-- Rollback-only remote probe: ordinary authenticated users must not cross admin SECURITY DEFINER boundaries.
-- This is a sequential authorization probe, not a concurrency test.

BEGIN;

DO $$
DECLARE
  v_user_id uuid;
  v_dummy uuid := gen_random_uuid();
  v_blocked integer := 0;
BEGIN
  SELECT u.id
    INTO v_user_id
    FROM auth.users u
   WHERE EXISTS (
     SELECT 1
       FROM public.profiles p
      WHERE p.user_id = u.id
        AND p.is_active = true
   )
     AND NOT COALESCE(private.is_admin_user(u.id), false)
   ORDER BY u.created_at
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'probe requires a non-admin authenticated user';
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.apply_trust_admin_actions(
      ARRAY[v_dummy], 'note_only', 'probe', NULL, NULL
    );
    RAISE EXCEPTION 'apply_trust_admin_actions unexpectedly allowed non-admin';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.review_trust_events_admin(
      ARRAY[v_dummy], 'confirmed'::public.trust_event_status, 'probe'
    );
    RAISE EXCEPTION 'review_trust_events_admin unexpectedly allowed non-admin';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM *
      FROM public.get_review_aggregates_admin(ARRAY[v_dummy], 'business');
    RAISE EXCEPTION 'get_review_aggregates_admin unexpectedly allowed non-admin';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.append_driver_moderation_event(
      v_dummy, 'approved', NULL, '{}'::jsonb
    );
    RAISE EXCEPTION 'append_driver_moderation_event unexpectedly allowed non-admin';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.moderate_classified_conversation(
      v_dummy, 'block', 'probe reason'
    );
    RAISE EXCEPTION 'moderate_classified_conversation unexpectedly allowed non-admin';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.moderate_community_direct_report(v_dummy, 'dismiss', 'probe');
    RAISE EXCEPTION 'moderate_community_direct_report unexpectedly allowed non-admin';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 6 THEN
    RAISE EXCEPTION 'expected 6 admin denials, got %', v_blocked;
  END IF;
END $$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'authenticated_admin_rpc_negative',
  'passed', true,
  'blocked_rpc_count', 6,
  'rolled_back', true
) AS result;
