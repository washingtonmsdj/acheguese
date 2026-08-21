-- LGPD pending-deletion write boundary.
--
-- This migration complements 20260821022500 by closing write paths that do not
-- traverse the profile authorization helpers. A scheduled/processing/failed/
-- completed account remains authenticated so it can reach the privacy broker,
-- but browser-originated DML is rejected at the table boundary.
--
-- The guard is statement-level (one indexed account-state lookup per DML
-- statement, not per row), applies to every application-owned base table in
-- public, and deliberately excludes extension-owned relations such as PostGIS
-- spatial_ref_sys.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.account_deletion_requests') IS NULL THEN
    RAISE EXCEPTION 'account deletion authority foundation is missing';
  END IF;

  IF to_regprocedure('private.auth_account_operational()') IS NULL THEN
    RAISE EXCEPTION 'pending deletion account-state helper is missing';
  END IF;

  IF to_regprocedure('private.guard_pending_deletion_write()') IS NOT NULL THEN
    RAISE EXCEPTION 'guard_pending_deletion_write already exists out-of-band';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger trigger_row
    WHERE trigger_row.tgname = 'account_operational_write_guard'
      AND NOT trigger_row.tgisinternal
  ) THEN
    RAISE EXCEPTION 'account_operational_write_guard trigger already exists out-of-band';
  END IF;
END;
$$;

CREATE FUNCTION private.guard_pending_deletion_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_role TEXT := COALESCE(auth.role(), '');
  v_user_id UUID := auth.uid();
BEGIN
  -- Only authenticated browser/user JWTs are subject to the hold. service_role,
  -- postgres and internal jobs remain able to process cancellation/export/purge
  -- and maintenance workflows.
  IF v_role <> 'authenticated' THEN
    RETURN NULL;
  END IF;

  -- An authenticated JWT without a subject must never be allowed to mutate
  -- application state through this boundary.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_USER_CONTEXT_MISSING'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.account_deletion_requests request
    WHERE request.user_id = v_user_id
      AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
  ) THEN
    RAISE EXCEPTION 'ACCOUNT_PENDING_DELETION_READ_ONLY'
      USING ERRCODE = '42501';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_pending_deletion_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_pending_deletion_write() FROM anon;
REVOKE ALL ON FUNCTION private.guard_pending_deletion_write() FROM authenticated;

DO $$
DECLARE
  v_table RECORD;
BEGIN
  FOR v_table IN
    SELECT c.oid, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend dependency
        JOIN pg_extension extension_row
          ON extension_row.oid = dependency.refobjid
        WHERE dependency.classid = 'pg_class'::regclass
          AND dependency.objid = c.oid
          AND dependency.deptype = 'e'
      )
    ORDER BY c.relname
  LOOP
    EXECUTE format(
      'CREATE TRIGGER account_operational_write_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION private.guard_pending_deletion_write()',
      v_table.relname
    );
  END LOOP;
END;
$$;

DO $$
DECLARE
  v_function_oid OID := to_regprocedure('private.guard_pending_deletion_write()');
  v_expected_tables INTEGER;
  v_guarded_tables INTEGER;
  v_bad_trigger_count INTEGER;
BEGIN
  IF v_function_oid IS NULL THEN
    RAISE EXCEPTION 'pending deletion write guard function missing after creation';
  END IF;

  IF has_function_privilege('anon', v_function_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', v_function_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'browser role can execute pending deletion trigger function directly';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc function_row
    WHERE function_row.oid = v_function_oid
      AND function_row.prosecdef
      AND function_row.proconfig @> ARRAY[
        'search_path=pg_catalog, public, private, pg_temp',
        'statement_timeout=2s'
      ]::TEXT[]
  ) THEN
    RAISE EXCEPTION 'pending deletion trigger function runtime config drifted';
  END IF;

  SELECT COUNT(*)
  INTO v_expected_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT EXISTS (
      SELECT 1
      FROM pg_depend dependency
      JOIN pg_extension extension_row
        ON extension_row.oid = dependency.refobjid
      WHERE dependency.classid = 'pg_class'::regclass
        AND dependency.objid = c.oid
        AND dependency.deptype = 'e'
    );

  SELECT COUNT(DISTINCT trigger_row.tgrelid)
  INTO v_guarded_tables
  FROM pg_trigger trigger_row
  JOIN pg_class c ON c.oid = trigger_row.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND trigger_row.tgname = 'account_operational_write_guard'
    AND NOT trigger_row.tgisinternal;

  IF v_guarded_tables <> v_expected_tables THEN
    RAISE EXCEPTION
      'pending deletion DML guard coverage mismatch: expected %, guarded %',
      v_expected_tables,
      v_guarded_tables;
  END IF;

  SELECT COUNT(*)
  INTO v_bad_trigger_count
  FROM pg_trigger trigger_row
  JOIN pg_class c ON c.oid = trigger_row.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND trigger_row.tgname = 'account_operational_write_guard'
    AND NOT trigger_row.tgisinternal
    AND (
      -- Statement-level BEFORE INSERT + DELETE + UPDATE = tgtype bits 2+4+8+16.
      (trigger_row.tgtype & 1) <> 0
      OR (trigger_row.tgtype & 2) = 0
      OR (trigger_row.tgtype & 4) = 0
      OR (trigger_row.tgtype & 8) = 0
      OR (trigger_row.tgtype & 16) = 0
      OR trigger_row.tgenabled <> 'O'
      OR trigger_row.tgfoid <> v_function_oid
    );

  IF v_bad_trigger_count <> 0 THEN
    RAISE EXCEPTION 'one or more pending deletion DML guards have invalid trigger shape';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger trigger_row
    JOIN pg_depend dependency
      ON dependency.classid = 'pg_class'::regclass
     AND dependency.objid = trigger_row.tgrelid
     AND dependency.deptype = 'e'
    JOIN pg_extension extension_row
      ON extension_row.oid = dependency.refobjid
    WHERE trigger_row.tgname = 'account_operational_write_guard'
      AND NOT trigger_row.tgisinternal
  ) THEN
    RAISE EXCEPTION 'pending deletion DML guard was attached to extension-owned relation';
  END IF;
END;
$$;

COMMIT;
