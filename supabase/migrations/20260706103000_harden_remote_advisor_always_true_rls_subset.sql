-- Remote security advisor hardening for always-true RLS policies with clear
-- ownership columns. Telemetry/audit/system-insert policies remain for a
-- dedicated review because their callers and event model need product context.

DO $$
BEGIN
  IF to_regclass('public.addresses') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'addresses'
        AND column_name = 'owner_user_id'
    )
  THEN
    DROP POLICY IF EXISTS "Authenticated users can create addresses" ON public.addresses;
    DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;

    CREATE POLICY "Users manage own addresses"
      ON public.addresses FOR ALL
      TO authenticated
      USING (owner_user_id = auth.uid())
      WITH CHECK (owner_user_id = auth.uid());
  END IF;

  IF to_regclass('public.classified_reports') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'classified_reports'
        AND column_name = 'reporter_id'
    )
  THEN
    DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.classified_reports;
    DROP POLICY IF EXISTS classified_reports_insert_own ON public.classified_reports;

    CREATE POLICY classified_reports_insert_own
      ON public.classified_reports
      FOR INSERT
      TO authenticated
      WITH CHECK (
        reporter_id IN (
          SELECT p.id
          FROM public.profiles p
          WHERE p.user_id = auth.uid()
        )
      );
  END IF;
END $$;
