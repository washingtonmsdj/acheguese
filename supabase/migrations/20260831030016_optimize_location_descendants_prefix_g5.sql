BEGIN;

DO $$
DECLARE
  v_exists boolean;
  v_is_stable boolean;
  v_security_invoker boolean;
  v_search_path boolean;
BEGIN
  SELECT true,
         p.provolatile = 's',
         p.prosecdef = false,
         p.proconfig @> ARRAY['search_path=public, pg_temp']::text[]
    INTO v_exists, v_is_stable, v_security_invoker, v_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'rpc_get_location_descendants_ids'
    AND pg_get_function_identity_arguments(p.oid) = 'p_location_id uuid';

  IF COALESCE(v_exists, false) IS NOT TRUE
     OR COALESCE(v_is_stable, false) IS NOT TRUE
     OR COALESCE(v_security_invoker, false) IS NOT TRUE
     OR COALESCE(v_search_path, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'rpc_get_location_descendants_ids precondition failed: exists=%, stable=%, invoker=%, search_path=%',
      v_exists, v_is_stable, v_security_invoker, v_search_path;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_location_descendants_ids(p_location_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_group BOOLEAN;
  v_path TEXT;
  v_result UUID[];
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.territorial_groups
    WHERE id = p_location_id
  ) INTO v_is_group;

  IF v_is_group THEN
    SELECT ARRAY_AGG(location_id)
    INTO v_result
    FROM public.territorial_group_members
    WHERE group_id = p_location_id;

    RETURN COALESCE(v_result, ARRAY[]::UUID[]);
  END IF;

  SELECT geographic_path
  INTO v_path
  FROM public.locations
  WHERE id = p_location_id;

  IF v_path IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY_AGG(id)
  INTO v_result
  FROM public.locations
  WHERE geographic_path = v_path
     OR geographic_path LIKE v_path || '/%';

  RETURN COALESCE(v_result, ARRAY[]::UUID[]);
END;
$function$;

DO $$
DECLARE
  v_is_stable boolean;
  v_security_invoker boolean;
  v_search_path boolean;
  v_definition text;
BEGIN
  SELECT p.provolatile = 's',
         p.prosecdef = false,
         p.proconfig @> ARRAY['search_path=public, pg_temp']::text[],
         pg_get_functiondef(p.oid)
    INTO v_is_stable, v_security_invoker, v_search_path, v_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'rpc_get_location_descendants_ids'
    AND pg_get_function_identity_arguments(p.oid) = 'p_location_id uuid';

  IF COALESCE(v_is_stable, false) IS NOT TRUE
     OR COALESCE(v_security_invoker, false) IS NOT TRUE
     OR COALESCE(v_search_path, false) IS NOT TRUE
     OR v_definition NOT LIKE '%geographic_path = v_path%'
     OR v_definition NOT LIKE '%geographic_path LIKE v_path || ''/%%''%' THEN
    RAISE EXCEPTION 'rpc_get_location_descendants_ids postcondition failed';
  END IF;

  IF NOT has_function_privilege('anon', 'public.rpc_get_location_descendants_ids(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.rpc_get_location_descendants_ids(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.rpc_get_location_descendants_ids(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'rpc_get_location_descendants_ids grants changed unexpectedly';
  END IF;
END
$$;

COMMIT;
