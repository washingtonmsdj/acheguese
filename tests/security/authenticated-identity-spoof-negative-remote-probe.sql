-- Rollback-only remote probe: authenticated callers must not spoof another user/profile or mutate foreign coverage.
-- This validates identity/ownership boundaries of SECURITY DEFINER RPCs.

BEGIN;

DO $$
DECLARE
  v_actor_user_id uuid;
  v_actor_profile_id uuid;
  v_other_user_id uuid;
  v_other_profile_id uuid;
  v_foreign_classified_id uuid;
  v_blocked integer := 0;
BEGIN
  SELECT u.id, p.id
    INTO v_actor_user_id, v_actor_profile_id
    FROM auth.users u
    JOIN public.profiles p
      ON p.user_id = u.id
     AND p.is_active = true
   WHERE NOT COALESCE(private.is_admin_user(u.id), false)
   ORDER BY u.created_at
   LIMIT 1;

  SELECT u.id, p.id
    INTO v_other_user_id, v_other_profile_id
    FROM auth.users u
    JOIN public.profiles p
      ON p.user_id = u.id
     AND p.is_active = true
   WHERE u.id <> v_actor_user_id
   ORDER BY u.created_at
   LIMIT 1;

  SELECT c.id
    INTO v_foreign_classified_id
    FROM public.classifieds c
   WHERE COALESCE(c.profile_id, c.seller_id) IS DISTINCT FROM v_actor_profile_id
   LIMIT 1;

  IF v_actor_user_id IS NULL
     OR v_actor_profile_id IS NULL
     OR v_other_user_id IS NULL
     OR v_other_profile_id IS NULL
     OR v_foreign_classified_id IS NULL THEN
    RAISE EXCEPTION 'probe requires two active users/profiles and a foreign classified';
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_actor_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.create_notification(
      v_other_user_id,
      'probe',
      'system',
      'probe',
      'probe',
      'low',
      NULL,
      NULL,
      '{}'::jsonb
    );
    RAISE EXCEPTION 'create_notification unexpectedly allowed cross-user target';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.create_safety_emergency_alert(
      v_other_profile_id,
      NULL,
      'manual',
      'probe',
      NULL,
      NULL,
      NULL,
      '{}'::jsonb
    );
    RAISE EXCEPTION 'create_safety_emergency_alert unexpectedly allowed profile spoof';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.request_profile_verification(
      v_other_profile_id,
      'email',
      NULL,
      NULL,
      NULL
    );
    RAISE EXCEPTION 'request_profile_verification unexpectedly allowed foreign profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_profile_access_members(v_other_profile_id);
    RAISE EXCEPTION 'list_profile_access_members unexpectedly allowed foreign profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.remove_entity_coverage(
      'classified',
      v_foreign_classified_id,
      NULL
    );
    RAISE EXCEPTION 'remove_entity_coverage unexpectedly allowed foreign classified';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 5 THEN
    RAISE EXCEPTION 'expected 5 spoof denials, got %', v_blocked;
  END IF;
END $$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'authenticated_identity_spoof_negative',
  'passed', true,
  'blocked_rpc_count', 5,
  'rolled_back', true
) AS result;
