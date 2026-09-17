-- Rollback-only remote probe: current-user favorites/preferences must stay isolated to auth.uid().

BEGIN;

DO $setup$
DECLARE
  v_actor_user_id uuid;
  v_other_user_id uuid;
  v_business_id uuid;
  v_foreign_favorite_id uuid;
BEGIN
  SELECT u.id
  INTO v_actor_user_id
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = u.id
      AND p.is_active = true
  )
  ORDER BY u.created_at
  LIMIT 1;

  SELECT u.id
  INTO v_other_user_id
  FROM auth.users u
  WHERE u.id IS DISTINCT FROM v_actor_user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = u.id
        AND p.is_active = true
    )
  ORDER BY u.created_at
  LIMIT 1;

  SELECT business.id
  INTO v_business_id
  FROM public.business_data business
  WHERE business.status = 'active'
  ORDER BY business.created_at NULLS LAST, business.id
  LIMIT 1;

  IF v_actor_user_id IS NULL
     OR v_other_user_id IS NULL
     OR v_business_id IS NULL THEN
    RAISE EXCEPTION 'preferences_probe_requires_two_users_and_active_business';
  END IF;

  INSERT INTO public.user_favorite_businesses(user_id, business_id, notes)
  VALUES(v_other_user_id, v_business_id, 'foreign-before')
  ON CONFLICT ON CONSTRAINT unique_user_favorite
  DO UPDATE SET notes = 'foreign-before'
  RETURNING id INTO v_foreign_favorite_id;

  INSERT INTO public.notification_preferences(user_id, marketing_enabled)
  VALUES(v_other_user_id, false)
  ON CONFLICT(user_id) DO UPDATE SET marketing_enabled = false;

  PERFORM set_config('app.pref_probe.actor_user_id', v_actor_user_id::text, true);
  PERFORM set_config('app.pref_probe.other_user_id', v_other_user_id::text, true);
  PERFORM set_config('app.pref_probe.foreign_favorite_id', v_foreign_favorite_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.pref_probe.actor_user_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.pref_probe.actor_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $isolation$
DECLARE
  v_favorite uuid := current_setting('app.pref_probe.foreign_favorite_id')::uuid;
  v_other_user uuid := current_setting('app.pref_probe.other_user_id')::uuid;
  v_blocked boolean := false;
  v_foreign_marketing_before boolean;
  v_foreign_marketing_after boolean;
BEGIN
  SELECT marketing_enabled
  INTO v_foreign_marketing_before
  FROM public.notification_preferences
  WHERE user_id = v_other_user;

  BEGIN
    PERFORM public.patch_current_user_business_favorite(
      v_favorite,
      NULL,
      NULL,
      true,
      'hijacked',
      false,
      NULL
    );
  EXCEPTION WHEN no_data_found THEN
    v_blocked := true;
  END;

  IF NOT v_blocked THEN
    RAISE EXCEPTION 'foreign_business_favorite_patch_unexpectedly_allowed';
  END IF;

  PERFORM public.patch_current_notification_preferences(
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    NULL,
    false,
    NULL,
    NULL,
    NULL
  );

  SELECT marketing_enabled
  INTO v_foreign_marketing_after
  FROM public.notification_preferences
  WHERE user_id = v_other_user;

  IF v_foreign_marketing_after IS DISTINCT FROM v_foreign_marketing_before THEN
    RAISE EXCEPTION 'notification_preference_patch_crossed_user_boundary';
  END IF;
END;
$isolation$;

RESET ROLE;
ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'current_user_preferences_isolation',
  'passed', true,
  'blocked_foreign_favorite', true,
  'foreign_notification_unchanged', true,
  'rolled_back', true
) AS result;
