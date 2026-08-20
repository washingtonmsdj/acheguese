-- Incremental F-005 allowlist for SECURITY DEFINER functions executable by anon.
--
-- Project-owned public APIs are intentional anonymous entrypoints. PostGIS and
-- supabase_functions entries are managed surfaces and are classified separately
-- rather than mutated by Achegue-se migrations. Any new anonymous privileged
-- function must be reviewed and explicitly added here or the test fails.

DO $contract$
DECLARE
  v_expected text[] := ARRAY[
    'public.get_community_poll_for_post(uuid)',
    'public.get_professional_trust_reputation(uuid)',
    'public.get_ride_rating_summary(uuid)',
    'public.get_shared_ride_safety_data(text)',
    'public.profile_public_territory_projection(uuid)',
    'public.st_estimatedextent(text, text)',
    'public.st_estimatedextent(text, text, text)',
    'public.st_estimatedextent(text, text, text, boolean)',
    'public.track_analytics_event(text, uuid, analytics_event_type, analytics_event_source, uuid, text, inet, text, text, numeric, numeric, jsonb)',
    'supabase_functions.http_request()'
  ];
  v_unexpected integer;
  v_missing integer;
  v_private_anon integer;
  v_bad_owned_api integer;
  v_bad_postgis integer;
  v_bad_supabase integer;
BEGIN
  WITH actual AS (
    SELECT format('%I.%I(%s)', n.nspname, p.proname, oidvectortypes(p.proargtypes)) AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  )
  SELECT count(*) INTO v_unexpected
  FROM actual
  WHERE NOT (signature = ANY(v_expected));

  IF v_unexpected <> 0 THEN
    RAISE EXCEPTION 'unexpected SECURITY DEFINER function is executable by anon';
  END IF;

  WITH actual AS (
    SELECT format('%I.%I(%s)', n.nspname, p.proname, oidvectortypes(p.proargtypes)) AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  )
  SELECT count(*) INTO v_missing
  FROM unnest(v_expected) expected(signature)
  WHERE NOT EXISTS (
    SELECT 1 FROM actual WHERE actual.signature = expected.signature
  );

  IF v_missing <> 0 THEN
    RAISE EXCEPTION 'anonymous SECURITY DEFINER allowlist drifted: expected entry missing';
  END IF;

  SELECT count(*) INTO v_private_anon
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE n.nspname = 'private'
    AND owner_role.rolname = 'postgres'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE');

  IF v_private_anon <> 0 THEN
    RAISE EXCEPTION 'project-owned private SECURITY DEFINER functions must not be executable by anon';
  END IF;

  SELECT count(*) INTO v_bad_owned_api
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE n.nspname = 'public'
    AND owner_role.rolname = 'postgres'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND (
      p.proconfig IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) setting
        WHERE setting LIKE 'search_path=%'
      )
    );

  IF v_bad_owned_api <> 0 THEN
    RAISE EXCEPTION 'project-owned anonymous SECURITY DEFINER APIs must have fixed search_path';
  END IF;

  SELECT count(*) INTO v_bad_postgis
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles owner_role ON owner_role.oid = p.proowner
  LEFT JOIN pg_depend d
    ON d.classid = 'pg_proc'::regclass
   AND d.objid = p.oid
   AND d.deptype = 'e'
  LEFT JOIN pg_extension e ON e.oid = d.refobjid
  WHERE n.nspname = 'public'
    AND p.proname = 'st_estimatedextent'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND (owner_role.rolname <> 'supabase_admin' OR e.extname IS DISTINCT FROM 'postgis');

  IF v_bad_postgis <> 0 THEN
    RAISE EXCEPTION 'PostGIS anonymous SECURITY DEFINER classification changed';
  END IF;

  SELECT count(*) INTO v_bad_supabase
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE n.nspname = 'supabase_functions'
    AND p.proname = 'http_request'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND owner_role.rolname <> 'supabase_functions_admin';

  IF v_bad_supabase <> 0 THEN
    RAISE EXCEPTION 'Supabase managed anonymous SECURITY DEFINER classification changed';
  END IF;
END
$contract$;
