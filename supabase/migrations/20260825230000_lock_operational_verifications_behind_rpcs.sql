-- Gate 7 final lockdown.
-- The production client now uses server-authoritative RPCs for create/status/verify,
-- so browser roles no longer need direct table authority. This prevents clients
-- from reading pin_hash or forging verification state/attempt counters.

REVOKE ALL PRIVILEGES
ON TABLE public.operational_verifications
FROM anon, authenticated;

DROP POLICY IF EXISTS "operational_verifications_insert_by_requester"
  ON public.operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_select_by_participant"
  ON public.operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_update_by_participant"
  ON public.operational_verifications;

-- Service role already has explicit table CRUD and bypasses non-forced RLS. Keep
-- the existing service policy for compatibility with operational tooling.

DO $block$
BEGIN
  IF has_table_privilege('anon', 'public.operational_verifications', 'SELECT')
     OR has_table_privilege('anon', 'public.operational_verifications', 'INSERT')
     OR has_table_privilege('anon', 'public.operational_verifications', 'UPDATE')
     OR has_table_privilege('anon', 'public.operational_verifications', 'DELETE')
     OR has_table_privilege('authenticated', 'public.operational_verifications', 'SELECT')
     OR has_table_privilege('authenticated', 'public.operational_verifications', 'INSERT')
     OR has_table_privilege('authenticated', 'public.operational_verifications', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.operational_verifications', 'DELETE') THEN
    RAISE EXCEPTION 'browser roles retain operational_verifications table authority';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.create_operational_pin_verification(uuid,boolean,text,text)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.get_operational_verification_status(uuid)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.verify_operational_pin(uuid,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Gate 7 RPC authority missing while locking base table';
  END IF;
END;
$block$;
