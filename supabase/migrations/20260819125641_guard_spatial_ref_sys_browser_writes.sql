DO $preflight$
DECLARE
  v_owner text;
  v_rls boolean;
BEGIN
  SELECT pg_get_userbyid(c.relowner), c.relrowsecurity
  INTO v_owner, v_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'spatial_ref_sys'
    AND c.relkind = 'r';

  IF v_owner IS DISTINCT FROM 'supabase_admin' OR v_rls IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'spatial_ref_sys preflight failed: owner/RLS baseline changed';
  END IF;

  IF NOT has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT') THEN
    RAISE EXCEPTION 'spatial_ref_sys preflight failed: browser SELECT baseline changed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relname='spatial_ref_sys'
      AND NOT t.tgisinternal
      AND t.tgname IN ('block_spatial_ref_sys_browser_dml','block_spatial_ref_sys_browser_truncate')
  ) THEN
    RAISE EXCEPTION 'spatial_ref_sys preflight failed: guard trigger already exists';
  END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.block_spatial_ref_sys_browser_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $function$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'browser writes to spatial_ref_sys are blocked';
  END IF;

  IF TG_LEVEL = 'STATEMENT' THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

ALTER FUNCTION public.block_spatial_ref_sys_browser_writes() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.block_spatial_ref_sys_browser_writes() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER block_spatial_ref_sys_browser_dml
BEFORE INSERT OR UPDATE OR DELETE ON public.spatial_ref_sys
FOR EACH ROW
EXECUTE FUNCTION public.block_spatial_ref_sys_browser_writes();

CREATE TRIGGER block_spatial_ref_sys_browser_truncate
BEFORE TRUNCATE ON public.spatial_ref_sys
FOR EACH STATEMENT
EXECUTE FUNCTION public.block_spatial_ref_sys_browser_writes();

DO $assert$
DECLARE
  v_trigger_count integer;
BEGIN
  SELECT count(*)
  INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relname='spatial_ref_sys'
    AND NOT t.tgisinternal
    AND t.tgname IN ('block_spatial_ref_sys_browser_dml','block_spatial_ref_sys_browser_truncate');

  IF v_trigger_count <> 2 THEN
    RAISE EXCEPTION 'spatial_ref_sys guard postcondition failed: expected 2 triggers, found %', v_trigger_count;
  END IF;

  IF NOT has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT') THEN
    RAISE EXCEPTION 'spatial_ref_sys guard postcondition failed: SELECT was damaged';
  END IF;
END;
$assert$;
