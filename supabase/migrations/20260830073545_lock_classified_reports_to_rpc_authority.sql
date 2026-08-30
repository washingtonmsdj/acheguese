DO $$
BEGIN
  IF to_regclass('public.classified_reports') IS NULL THEN
    RAISE EXCEPTION 'G5 classified report hardening blocked: public.classified_reports is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='classified_reports'
      AND policyname='Anonymous users can create reports'
  ) THEN
    RAISE EXCEPTION 'G5 classified report hardening blocked: legacy anonymous insert policy is missing';
  END IF;
END
$$;

REVOKE INSERT ON TABLE public.classified_reports FROM anon;
DROP POLICY "Anonymous users can create reports" ON public.classified_reports;

COMMENT ON TABLE public.classified_reports IS
  'Sensitive classified reports. Mutations are server-owned through typed report commands; browser table writes are disabled.';

DO $$
BEGIN
  IF has_table_privilege('anon','public.classified_reports','INSERT') THEN
    RAISE EXCEPTION 'G5 classified report hardening failed: anon INSERT remains granted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='classified_reports'
      AND cmd='INSERT'
      AND ('anon'=ANY(roles) OR 'public'=ANY(roles))
  ) THEN
    RAISE EXCEPTION 'G5 classified report hardening failed: anonymous INSERT policy remains';
  END IF;
END
$$;
