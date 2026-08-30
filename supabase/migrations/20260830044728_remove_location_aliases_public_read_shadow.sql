-- G5: remove a live RLS shadow that should have been superseded by
-- 20260514003000_fix_admin_users_location_aliases_rls_recursion.sql.
-- The canonical public read policy remains location_aliases_public_read.

DO $g5_location_aliases_shadow_preflight$
BEGIN
  IF to_regclass('public.location_aliases') IS NULL THEN
    RAISE EXCEPTION
      'G5_LOCATION_ALIASES_BLOCKED: public.location_aliases is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'location_aliases'
      AND policyname = 'location_aliases_public_read'
      AND cmd = 'SELECT'
      AND roles @> ARRAY['anon','authenticated']::name[]
  ) THEN
    RAISE EXCEPTION
      'G5_LOCATION_ALIASES_BLOCKED: canonical public read policy is missing';
  END IF;
END
$g5_location_aliases_shadow_preflight$;

DROP POLICY IF EXISTS "Location aliases public read"
  ON public.location_aliases;

DO $g5_location_aliases_shadow_assertions$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'location_aliases'
      AND policyname = 'Location aliases public read'
  ) THEN
    RAISE EXCEPTION
      'G5_LOCATION_ALIASES_BLOCKED: obsolete public-read shadow still exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'location_aliases'
      AND policyname = 'location_aliases_public_read'
      AND cmd = 'SELECT'
      AND roles @> ARRAY['anon','authenticated']::name[]
      AND qual ILIKE '%valid_until%'
  ) THEN
    RAISE EXCEPTION
      'G5_LOCATION_ALIASES_BLOCKED: canonical public read authority was not preserved';
  END IF;
END
$g5_location_aliases_shadow_assertions$;
