-- Regression contract for Classifieds report RPC authorization.
-- The public RPCs are user-context APIs; the private helpers retain SECURITY
-- DEFINER only for the bounded write path and must not become service-role APIs.

DO $$
DECLARE
  fn regprocedure;
  is_definer boolean;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.create_classified_report(uuid,text,text)'::regprocedure,
    'public.moderate_classified_report(uuid,text,text)'::regprocedure
  ]
  LOOP
    IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated must be able to execute %', fn;
    END IF;
    IF has_function_privilege('anon', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon must not be able to execute %', fn;
    END IF;
    IF has_function_privilege('service_role', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'service_role must not be able to execute user-context RPC %', fn;
    END IF;

    SELECT p.prosecdef
      INTO is_definer
      FROM pg_proc p
      WHERE p.oid = fn;

    IF is_definer THEN
      RAISE EXCEPTION 'public wrapper % must remain SECURITY INVOKER', fn;
    END IF;
  END LOOP;

  FOREACH fn IN ARRAY ARRAY[
    'private.create_classified_report(uuid,text,text)'::regprocedure,
    'private.moderate_classified_report(uuid,text,text)'::regprocedure
  ]
  LOOP
    IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated must be able to execute helper %', fn;
    END IF;
    IF has_function_privilege('anon', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon must not be able to execute helper %', fn;
    END IF;
    IF has_function_privilege('service_role', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'service_role must not be able to execute helper %', fn;
    END IF;

    SELECT p.prosecdef
      INTO is_definer
      FROM pg_proc p
      WHERE p.oid = fn;

    IF NOT is_definer THEN
      RAISE EXCEPTION 'private helper % must remain SECURITY DEFINER', fn;
    END IF;
  END LOOP;
END
$$;
