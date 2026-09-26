-- Remove two obsolete permissive policies on public.profiles without changing
-- effective authorization.
--
-- Safety invariants:
--   * owner DELETE remains authorized only by the canonical owner policy;
--   * owner UPDATE remains authorized by the canonical owner policy;
--   * server-owned/privileged profile fields remain protected by the live
--     trg_guard_profile_server_owned_fields trigger.
--
-- The removed DELETE policy used USING(false). Permissive RLS policies are OR'ed,
-- so it never denied rows already authorized by another permissive policy.
-- The removed UPDATE policy duplicated the owner predicate and contained
-- tautological checks; the trigger is the actual OLD-vs-NEW security boundary.

BEGIN;

DO $preflight$
DECLARE
  v_missing text[] := ARRAY[]::text[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='profiles'
      AND policyname='Only account owner can delete profiles'
      AND cmd='DELETE'
      AND roles = ARRAY['authenticated']::name[]
  ) THEN
    v_missing := array_append(v_missing, 'canonical owner DELETE policy');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='profiles'
      AND policyname='Account owners can update their profiles'
      AND cmd='UPDATE'
      AND roles = ARRAY['authenticated']::name[]
  ) THEN
    v_missing := array_append(v_missing, 'canonical owner UPDATE policy');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid='public.profiles'::regclass
      AND tgname='trg_guard_profile_server_owned_fields'
      AND NOT tgisinternal
      AND tgenabled <> 'D'
  ) THEN
    v_missing := array_append(v_missing, 'server-owned field guard trigger');
  END IF;

  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION 'profile RLS cleanup preflight failed: %', array_to_string(v_missing, ', ');
  END IF;
END;
$preflight$;

DROP POLICY IF EXISTS "Perfis não podem ser deletados"
  ON public.profiles;

DROP POLICY IF EXISTS "Usuários atualizam seus próprios perfis"
  ON public.profiles;

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='profiles'
      AND policyname IN (
        'Perfis não podem ser deletados',
        'Usuários atualizam seus próprios perfis'
      )
  ) THEN
    RAISE EXCEPTION 'obsolete profile policies still present after cleanup';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='profiles'
      AND policyname='Only account owner can delete profiles'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='profiles'
      AND policyname='Account owners can update their profiles'
  ) THEN
    RAISE EXCEPTION 'canonical profile owner policies were not preserved';
  END IF;
END;
$verify$;

COMMIT;
