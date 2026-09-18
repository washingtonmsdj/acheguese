BEGIN;

-- Mobility audit/event tables are intentionally browser-internal. Keep the
-- browser roles without direct table privileges and rely on the explicitly
-- authorized privileged commands/triggers that append operational evidence.
REVOKE ALL ON TABLE public.ride_state_audit FROM anon, authenticated;
REVOKE ALL ON TABLE public.emergency_delivery_log FROM anon, authenticated;

COMMENT ON TABLE public.ride_state_audit IS
  'Internal immutable mobility lifecycle audit trail. Browser roles are intentionally default-deny; writes occur only through privileged operational commands.';

COMMENT ON TABLE public.emergency_delivery_log IS
  'Internal emergency-delivery provider/audit ledger. Browser roles are intentionally default-deny; access is service-owned only.';

DO $guard$
DECLARE
  v_table text;
  v_policy_count integer;
  v_function record;
  v_oid oid;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['ride_state_audit', 'emergency_delivery_log']
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = v_table
        AND c.relrowsecurity = true
    ) THEN
      RAISE EXCEPTION 'mobility audit table % must keep RLS enabled', v_table;
    END IF;

    IF has_table_privilege('anon', format('public.%I', v_table), 'SELECT')
       OR has_table_privilege('anon', format('public.%I', v_table), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', v_table), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', v_table), 'DELETE')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'SELECT')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'INSERT')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'DELETE') THEN
      RAISE EXCEPTION 'browser DML grant remains on public.%', v_table;
    END IF;

    SELECT count(*)::integer
    INTO v_policy_count
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = v_table;

    IF v_policy_count <> 0 THEN
      RAISE EXCEPTION 'public.% must remain RLS default-deny with no browser policies', v_table;
    END IF;
  END LOOP;

  FOR v_function IN
    SELECT * FROM (VALUES
      ('public.apply_emergency_delivery_provider_event(text,text,text,uuid,timestamp with time zone)'),
      ('public.authorize_emergency_email_dispatch(uuid,jsonb)'),
      ('public.begin_emergency_provider_attempt(uuid)'),
      ('public.claim_emergency_delivery_attempt(uuid,uuid,text)'),
      ('public.confirm_emergency_delivery_provider_acceptance(uuid,text,timestamp with time zone)'),
      ('public.fail_emergency_delivery_attempt(uuid,text,text,jsonb)'),
      ('public.get_emergency_email_provider_payload(uuid)'),
      ('public.require_emergency_delivery_reconciliation(uuid,text)')
    ) AS functions(signature)
  LOOP
    v_oid := pg_catalog.to_regprocedure(v_function.signature)::oid;
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'missing emergency delivery command: %', v_function.signature;
    END IF;

    IF has_function_privilege('anon', v_oid, 'EXECUTE')
       OR has_function_privilege('authenticated', v_oid, 'EXECUTE')
       OR NOT has_function_privilege('service_role', v_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'unexpected emergency delivery grants on %', v_function.signature;
    END IF;
  END LOOP;
END;
$guard$;

COMMIT;
