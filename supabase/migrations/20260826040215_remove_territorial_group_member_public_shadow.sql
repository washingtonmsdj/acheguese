-- Inactive territorial groups are intentionally hidden. The legacy PUBLIC
-- SELECT true policy made that lifecycle rule unenforceable because permissive
-- RLS policies are OR-combined. Keep only the active-group public projection.

BEGIN;

DROP POLICY IF EXISTS "Membros de grupos visíveis publicamente"
  ON public.territorial_group_members;

DO $verify$
DECLARE
  v_active_policy_qual TEXT;
  v_active_policy_roles NAME[];
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'territorial_group_members'
      AND policyname = 'Membros de grupos visíveis publicamente'
  ) THEN
    RAISE EXCEPTION 'legacy territorial_group_members SELECT true policy still exists';
  END IF;

  SELECT qual, roles
  INTO v_active_policy_qual, v_active_policy_roles
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'territorial_group_members'
    AND policyname = 'Territorial group members viewable by all'
    AND cmd = 'SELECT';

  IF v_active_policy_qual IS NULL
     OR v_active_policy_qual NOT ILIKE '%territorial_groups.status = ''active''%'
     OR NOT (v_active_policy_roles @> ARRAY['anon', 'authenticated']::NAME[]) THEN
    RAISE EXCEPTION 'active-group territorial membership public policy is missing or widened incorrectly';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'territorial_group_members'
      AND cmd IN ('SELECT', 'ALL')
      AND roles && ARRAY['public', 'anon', 'authenticated']::NAME[]
      AND COALESCE(BTRIM(qual), '') IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'territorial_group_members still has a browser SELECT true shadow';
  END IF;
END
$verify$;

COMMIT;