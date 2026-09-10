-- G43 phase 2 (pending): remove browser DML from territorial group tables.
--
-- DO NOT PROMOTE this migration merely because phase 1 exists in Git.
-- Manual release gate before promotion:
--   1. 20260910220500_create_territorial_group_admin_commands_g43.sql is
--      promoted and its postconditions pass in this exact environment;
--   2. territorial-group-admin-rpc is ACTIVE with verify_jwt=true and exact
--      source provenance;
--   3. authenticated admin AAL2 smoke proves saveGroup + setStatus;
--   4. the browser owner has been switched to the broker and certified.
--
-- Public/product reads remain unchanged: active groups/members continue to be
-- exposed only by their existing SELECT policies. This migration creates a
-- separate admin SELECT path so inactive groups stay manageable after the old
-- FOR ALL policies are removed.

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.territorial_groups') IS NULL
     OR to_regclass('public.territorial_group_members') IS NULL THEN
    RAISE EXCEPTION 'preflight: territorial group tables missing';
  END IF;

  IF to_regprocedure(
    'public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[])'
  ) IS NULL OR to_regprocedure(
    'public.territorial_admin_set_group_status(uuid,text)'
  ) IS NULL THEN
    RAISE EXCEPTION 'preflight: G43 transactional group commands missing';
  END IF;

  IF to_regprocedure('private.is_admin(uuid)') IS NULL THEN
    RAISE EXCEPTION 'preflight: canonical private.is_admin helper missing';
  END IF;

  IF NOT has_function_privilege(
    'service_role',
    'public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[])',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'service_role',
    'public.territorial_admin_set_group_status(uuid,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'preflight: service_role cannot execute G43 commands';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[])',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.territorial_admin_set_group_status(uuid,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'preflight: browser can execute G43 commands directly';
  END IF;
END
$preflight$;

-- Remove every known administrative write policy name from the historical
-- lineage. Public active-only SELECT policies are deliberately untouched.
DROP POLICY IF EXISTS "Admins podem gerenciar grupos territoriais"
  ON public.territorial_groups;
DROP POLICY IF EXISTS "Admins manage territorial groups"
  ON public.territorial_groups;
DROP POLICY IF EXISTS "Admins podem gerenciar membros de grupos"
  ON public.territorial_group_members;
DROP POLICY IF EXISTS "Admins manage territorial group members"
  ON public.territorial_group_members;

-- Rebuild the read-only admin inventory explicitly. These policies do not grant
-- table privileges by themselves; SELECT remains the only browser grant after
-- the privilege revocation below.
DROP POLICY IF EXISTS "Admins view all territorial groups"
  ON public.territorial_groups;
CREATE POLICY "Admins view all territorial groups"
  ON public.territorial_groups
  FOR SELECT
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins view all territorial group members"
  ON public.territorial_group_members;
CREATE POLICY "Admins view all territorial group members"
  ON public.territorial_group_members
  FOR SELECT
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.territorial_groups
  FROM authenticated;
REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.territorial_group_members
  FROM authenticated;

-- Keep the read contract explicit and keep the broker's server identity able to
-- execute the underlying transaction.
GRANT SELECT ON TABLE public.territorial_groups TO authenticated;
GRANT SELECT ON TABLE public.territorial_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.territorial_groups
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.territorial_group_members
  TO service_role;

DO $postcondition$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'territorial_groups',
    'territorial_group_members'
  ]
  LOOP
    IF NOT has_table_privilege(
      'authenticated',
      format('public.%I', v_table),
      'SELECT'
    ) THEN
      RAISE EXCEPTION 'postcondition: authenticated SELECT missing on %', v_table;
    END IF;

    IF has_table_privilege(
      'authenticated',
      format('public.%I', v_table),
      'INSERT'
    ) OR has_table_privilege(
      'authenticated',
      format('public.%I', v_table),
      'UPDATE'
    ) OR has_table_privilege(
      'authenticated',
      format('public.%I', v_table),
      'DELETE'
    ) THEN
      RAISE EXCEPTION 'postcondition: authenticated DML remains on %', v_table;
    END IF;

    IF NOT has_table_privilege(
      'service_role',
      format('public.%I', v_table),
      'SELECT'
    ) OR NOT has_table_privilege(
      'service_role',
      format('public.%I', v_table),
      'INSERT'
    ) OR NOT has_table_privilege(
      'service_role',
      format('public.%I', v_table),
      'UPDATE'
    ) OR NOT has_table_privilege(
      'service_role',
      format('public.%I', v_table),
      'DELETE'
    ) THEN
      RAISE EXCEPTION 'postcondition: service_role DML incomplete on %', v_table;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_policies AS policy
      WHERE policy.schemaname = 'public'
        AND policy.tablename = v_table
        AND policy.roles @> ARRAY['authenticated']::NAME[]
        AND policy.cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    ) THEN
      RAISE EXCEPTION 'postcondition: authenticated write policy remains on %', v_table;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'territorial_groups'
      AND policyname = 'Admins view all territorial groups'
      AND cmd = 'SELECT'
      AND roles @> ARRAY['authenticated']::NAME[]
      AND COALESCE(qual, '') ILIKE '%private.is_admin%'
  ) THEN
    RAISE EXCEPTION 'postcondition: admin territorial_groups SELECT policy missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'territorial_group_members'
      AND policyname = 'Admins view all territorial group members'
      AND cmd = 'SELECT'
      AND roles @> ARRAY['authenticated']::NAME[]
      AND COALESCE(qual, '') ILIKE '%private.is_admin%'
  ) THEN
    RAISE EXCEPTION 'postcondition: admin territorial_group_members SELECT policy missing';
  END IF;
END
$postcondition$;

NOTIFY pgrst, 'reload schema';
COMMIT;
