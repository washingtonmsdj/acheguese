-- Rollback-only remote probe: authenticated callers cannot act as reviewer/voter profiles they do not own.

BEGIN;

DO $$
DECLARE
  v_actor_user_id uuid;
  v_other_profile_id uuid;
  v_dummy uuid := gen_random_uuid();
  v_blocked integer := 0;
BEGIN
  SELECT u.id
    INTO v_actor_user_id
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

  SELECT p.id
    INTO v_other_profile_id
    FROM public.profiles p
   WHERE p.is_active = true
     AND p.user_id IS DISTINCT FROM v_actor_user_id
   ORDER BY p.created_at
   LIMIT 1;

  IF v_actor_user_id IS NULL OR v_other_profile_id IS NULL THEN
    RAISE EXCEPTION 'probe requires actor and foreign active profile';
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_actor_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.upsert_profile_review(v_dummy, v_other_profile_id, 5, 'probe');
    RAISE EXCEPTION 'upsert_profile_review unexpectedly allowed reviewer spoof';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.delete_profile_review(v_dummy, v_other_profile_id);
    RAISE EXCEPTION 'delete_profile_review unexpectedly allowed reviewer spoof';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.set_review_helpfulness(v_dummy, v_other_profile_id, true);
    RAISE EXCEPTION 'set_review_helpfulness unexpectedly allowed voter spoof';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.get_current_review_helpfulness(v_dummy, v_other_profile_id);
    RAISE EXCEPTION 'get_current_review_helpfulness unexpectedly allowed voter spoof';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 4 THEN
    RAISE EXCEPTION 'expected 4 review identity denials, got %', v_blocked;
  END IF;
END $$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'review_identity_spoof_negative',
  'passed', true,
  'blocked_rpc_count', 4,
  'rolled_back', true
) AS result;
