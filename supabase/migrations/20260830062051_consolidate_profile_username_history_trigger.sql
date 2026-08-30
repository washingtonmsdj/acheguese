DO $$
DECLARE
  v_old_trigger_count integer;
  v_new_trigger_count integer;
BEGIN
  IF to_regclass('public.profiles') IS NULL
     OR to_regclass('public.profile_username_history') IS NULL THEN
    RAISE EXCEPTION 'profile username history authority tables missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='profile_username_history'
      AND column_name='change_reason'
  ) THEN
    RAISE EXCEPTION 'profile_username_history.change_reason missing';
  END IF;

  SELECT count(*) INTO v_old_trigger_count
  FROM pg_trigger
  WHERE tgrelid='public.profiles'::regclass
    AND tgname='log_username_change_trigger'
    AND NOT tgisinternal
    AND tgenabled <> 'D';

  SELECT count(*) INTO v_new_trigger_count
  FROM pg_trigger
  WHERE tgrelid='public.profiles'::regclass
    AND tgname='trg_record_profile_username_history'
    AND NOT tgisinternal
    AND tgenabled <> 'D';

  IF v_old_trigger_count <> 1 OR v_new_trigger_count <> 1 THEN
    RAISE EXCEPTION 'expected duplicate username history trigger pair not found';
  END IF;

  IF to_regprocedure('public.fn_record_profile_username_history()') IS NULL THEN
    RAISE EXCEPTION 'working username history trigger function missing';
  END IF;
END
$$;

ALTER TABLE public.profile_username_history
  ALTER COLUMN change_reason SET DEFAULT 'user_requested';

ALTER TABLE public.profile_username_history
  DROP CONSTRAINT IF EXISTS profile_username_history_change_reason_check;
ALTER TABLE public.profile_username_history
  ADD CONSTRAINT profile_username_history_change_reason_check
  CHECK (change_reason IN ('user_requested', 'admin_action', 'policy_violation', 'territory_changed'));

DROP TRIGGER IF EXISTS log_username_change_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.log_username_change();

CREATE OR REPLACE FUNCTION public.fn_record_profile_username_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profile_username_history (
    profile_id,
    old_username,
    new_username,
    change_reason
  ) VALUES (
    NEW.id,
    COALESCE(OLD.username, ''),
    COALESCE(NEW.username, ''),
    CASE
      WHEN auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id
        THEN 'user_requested'
      ELSE 'admin_action'
    END
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_profile_username_history()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS trg_record_profile_username_history ON public.profiles;
CREATE TRIGGER trg_record_profile_username_history
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.username IS DISTINCT FROM NEW.username)
  EXECUTE FUNCTION public.fn_record_profile_username_history();

COMMENT ON FUNCTION public.fn_record_profile_username_history() IS
  'Canonical trigger-only profile username history writer. Empty string represents an absent username so first assignment and removal remain auditable while Public Identity keeps string identifiers.';
COMMENT ON COLUMN public.profile_username_history.old_username IS
  'Previous username; empty string represents no previous username.';
COMMENT ON COLUMN public.profile_username_history.new_username IS
  'New username; empty string represents username removal.';
COMMENT ON COLUMN public.profile_username_history.change_reason IS
  'Public Identity change reason: user_requested, admin_action, policy_violation or territory_changed.';

DO $$
DECLARE
  v_trigger_function oid;
BEGIN
  IF to_regprocedure('public.log_username_change()') IS NOT NULL THEN
    RAISE EXCEPTION 'obsolete log_username_change function remained';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.profiles'::regclass
      AND tgname='log_username_change_trigger'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'obsolete username history trigger remained';
  END IF;

  SELECT tgfoid INTO v_trigger_function
  FROM pg_trigger
  WHERE tgrelid='public.profiles'::regclass
    AND tgname='trg_record_profile_username_history'
    AND NOT tgisinternal
    AND tgenabled <> 'D';

  IF v_trigger_function IS NULL THEN
    RAISE EXCEPTION 'canonical username history trigger missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid=v_trigger_function
      AND p.prosecdef
      AND pg_get_userbyid(p.proowner)='postgres'
      AND pg_get_functiondef(p.oid) ILIKE '%COALESCE(OLD.username, '''')%'
      AND pg_get_functiondef(p.oid) ILIKE '%user_requested%'
      AND pg_get_functiondef(p.oid) ILIKE '%admin_action%'
  ) THEN
    RAISE EXCEPTION 'canonical username history trigger function contract invalid';
  END IF;
  IF has_function_privilege('anon', v_trigger_function, 'EXECUTE')
     OR has_function_privilege('authenticated', v_trigger_function, 'EXECUTE')
     OR has_function_privilege('service_role', v_trigger_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'username history trigger function remained directly executable by application roles';
  END IF;
END
$$;
