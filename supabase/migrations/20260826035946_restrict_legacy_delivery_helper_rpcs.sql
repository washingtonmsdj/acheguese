-- Keep the retained legacy/fleet delivery graph server-only end to end.
-- Browser access to delivery_requests was already revoked; these helper RPCs
-- must not remain independently reachable by anon/authenticated roles.

BEGIN;

REVOKE ALL ON FUNCTION public.get_available_deliveries(NUMERIC, NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_delivery_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_next_delivery_request_number(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_delivery_status_change()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_available_deliveries(NUMERIC, NUMERIC, NUMERIC)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_delivery_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_delivery_request_number(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.log_delivery_status_change()
  TO service_role;

DO $verify$
DECLARE
  v_signature TEXT;
  v_oid OID;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.get_available_deliveries(numeric,numeric,numeric)',
    'public.get_delivery_stats(uuid,timestamptz,timestamptz)',
    'public.get_next_delivery_request_number(uuid)',
    'public.log_delivery_status_change()'
  ]
  LOOP
    v_oid := to_regprocedure(v_signature);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'legacy delivery helper missing: %', v_signature;
    END IF;

    IF has_function_privilege('anon', v_oid, 'EXECUTE')
       OR has_function_privilege('authenticated', v_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'browser execution remains on legacy delivery helper: %', v_signature;
    END IF;

    IF NOT has_function_privilege('service_role', v_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'service_role lost legacy delivery helper execution: %', v_signature;
    END IF;
  END LOOP;
END
$verify$;

COMMIT;