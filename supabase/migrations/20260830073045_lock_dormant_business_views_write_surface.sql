DO $$
BEGIN
  IF to_regclass('public.business_views') IS NULL THEN
    RAISE EXCEPTION 'G5 business_views hardening blocked: public.business_views is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business_views'
      AND policyname = 'Business views insertable'
  ) THEN
    RAISE EXCEPTION 'G5 business_views hardening blocked: expected insert policy is missing';
  END IF;
END
$$;

REVOKE INSERT ON TABLE public.business_views FROM PUBLIC, anon, authenticated;
DROP POLICY "Business views insertable" ON public.business_views;

COMMENT ON TABLE public.business_views IS
  'Legacy business view event ledger retained for provenance/read compatibility. Browser writes are disabled; canonical public view counting is brokered through track-public-view -> increment_business_views -> business_stats.';

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.business_views', 'INSERT')
     OR has_table_privilege('authenticated', 'public.business_views', 'INSERT') THEN
    RAISE EXCEPTION 'G5 business_views hardening failed: browser INSERT remains granted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business_views'
      AND cmd = 'INSERT'
      AND ('anon' = ANY(roles) OR 'authenticated' = ANY(roles) OR 'public' = ANY(roles))
  ) THEN
    RAISE EXCEPTION 'G5 business_views hardening failed: browser INSERT policy remains';
  END IF;
END
$$;
