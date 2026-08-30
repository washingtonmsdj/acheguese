DO $$
BEGIN
  IF to_regclass('public.billing_transactions') IS NULL THEN
    RAISE EXCEPTION 'required table missing: public.billing_transactions';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='billing_transactions'
      AND cmd='SELECT'
      AND qual ~ 'user_id.*auth.uid'
  ) THEN
    RAISE EXCEPTION 'billing_transactions own-user SELECT policy missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='billing_transactions'
      AND cmd='ALL'
      AND qual ~ 'service_role'
  ) THEN
    RAISE EXCEPTION 'billing_transactions service-role writer policy missing';
  END IF;
END
$$;

REVOKE ALL PRIVILEGES ON TABLE public.billing_transactions
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.billing_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.billing_transactions TO service_role;

COMMENT ON TABLE public.billing_transactions IS
  'Billing transaction history. Browser sessions may read only rows authorized by RLS; all writes remain service_role/server-owned.';

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.billing_transactions', 'SELECT')
     OR has_table_privilege('anon', 'public.billing_transactions', 'INSERT')
     OR has_table_privilege('anon', 'public.billing_transactions', 'UPDATE')
     OR has_table_privilege('anon', 'public.billing_transactions', 'DELETE') THEN
    RAISE EXCEPTION 'anonymous billing_transactions privilege remained';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.billing_transactions', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated billing_transactions SELECT missing';
  END IF;
  IF has_table_privilege('authenticated', 'public.billing_transactions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.billing_transactions', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.billing_transactions', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated billing_transactions write privilege remained';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.billing_transactions', 'SELECT,INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'service_role billing_transactions authority missing';
  END IF;
END
$$;
