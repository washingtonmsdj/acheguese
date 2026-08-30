-- G5: retire trigger-returning helpers that have zero trigger bindings and
-- have been superseded by current authorities or their target relation no longer exists.

DO $g5_orphan_trigger_preflight$
DECLARE
  v_name text;
  v_oid oid;
  v_trigger_count integer;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'auto_log_pii_access',
    'handle_new_user_profile',
    'sync_comment_likes_count',
    'update_tourist_points_v2_updated_at'
  ]
  LOOP
    SELECT p.oid
      INTO v_oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = v_name
      AND pg_get_function_identity_arguments(p.oid) = ''
      AND p.prorettype = 'pg_catalog.trigger'::regtype;

    IF v_oid IS NULL THEN
      RAISE EXCEPTION
        'G5_ORPHAN_TRIGGER_BLOCKED: %.() missing or no longer RETURNS trigger',
        v_name;
    END IF;

    SELECT count(*)::integer
      INTO v_trigger_count
    FROM pg_trigger t
    WHERE NOT t.tgisinternal
      AND t.tgfoid = v_oid;

    IF v_trigger_count <> 0 THEN
      RAISE EXCEPTION
        'G5_ORPHAN_TRIGGER_BLOCKED: % still has % trigger bindings',
        v_name,
        v_trigger_count;
    END IF;
  END LOOP;

  IF to_regclass('public.tourist_points_v2') IS NOT NULL THEN
    RAISE EXCEPTION
      'G5_ORPHAN_TRIGGER_BLOCKED: public.tourist_points_v2 still exists';
  END IF;

  IF to_regprocedure('public.handle_new_user()') IS NULL OR NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND t.tgenabled <> 'D'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
      AND t.tgfoid = to_regprocedure('public.handle_new_user()')
  ) THEN
    RAISE EXCEPTION
      'G5_ORPHAN_TRIGGER_BLOCKED: canonical auth.users handle_new_user trigger is missing';
  END IF;

  IF to_regprocedure('private.sync_community_social_counters()') IS NULL OR NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND t.tgenabled <> 'D'
      AND n.nspname = 'public'
      AND c.relname = 'comment_likes'
      AND t.tgfoid = to_regprocedure('private.sync_community_social_counters()')
  ) THEN
    RAISE EXCEPTION
      'G5_ORPHAN_TRIGGER_BLOCKED: canonical comment_likes counter trigger is missing';
  END IF;
END
$g5_orphan_trigger_preflight$;

DROP FUNCTION public.auto_log_pii_access();
DROP FUNCTION public.handle_new_user_profile();
DROP FUNCTION public.sync_comment_likes_count();
DROP FUNCTION public.update_tourist_points_v2_updated_at();

DO $g5_orphan_trigger_assertions$
BEGIN
  IF to_regprocedure('public.auto_log_pii_access()') IS NOT NULL
     OR to_regprocedure('public.handle_new_user_profile()') IS NOT NULL
     OR to_regprocedure('public.sync_comment_likes_count()') IS NOT NULL
     OR to_regprocedure('public.update_tourist_points_v2_updated_at()') IS NOT NULL THEN
    RAISE EXCEPTION
      'G5_ORPHAN_TRIGGER_BLOCKED: one or more orphan trigger helpers remain';
  END IF;
END
$g5_orphan_trigger_assertions$;
