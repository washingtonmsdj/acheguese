-- Harden the next reviewed subset of remote advisor always-true RLS policies.
--
-- This migration avoids blanket revokes. It removes duplicate broad policies
-- when narrower policies already exist and replaces telemetry insert policies
-- with integrity/ownership predicates that match current runtime callers.

DO $$
BEGIN
  IF to_regclass('public.emergency_alerts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated insert emergency alerts" ON public.emergency_alerts;
  END IF;

  IF to_regclass('public.community_issue_audit') IS NOT NULL THEN
    DROP POLICY IF EXISTS "System inserts audit" ON public.community_issue_audit;
  END IF;

  IF to_regclass('public.application_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "System can insert logs" ON public.application_logs;

    CREATE POLICY "System can insert logs"
      ON public.application_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id IS NULL OR user_id = auth.uid());
  END IF;

  IF to_regclass('public.business_views') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Business views insertable" ON public.business_views;

    CREATE POLICY "Business views insertable"
      ON public.business_views
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.business_data bd
          WHERE bd.id = business_id
        )
        AND (
          viewer_id IS NULL
          OR viewer_id IN (
            SELECT p.id
            FROM public.profiles p
            WHERE p.user_id = auth.uid()
          )
        )
      );
  END IF;

  IF to_regclass('public.education_analytics_events') IS NOT NULL THEN
    DROP POLICY IF EXISTS "allow_anonymous_insert_analytics" ON public.education_analytics_events;

    CREATE POLICY "allow_anonymous_insert_analytics"
      ON public.education_analytics_events
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.education_profiles ep
          WHERE ep.id = education_profile_id
        )
        AND (
          business_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.business_data bd
            WHERE bd.id = business_id
          )
        )
      );
  END IF;

  IF to_regclass('public.qr_code_scans') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can insert scans" ON public.qr_code_scans;

    CREATE POLICY "Anyone can insert scans"
      ON public.qr_code_scans
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        resolved_url <> ''
        AND EXISTS (
          SELECT 1
          FROM public.qr_codes qc
          WHERE qc.id = qr_code_id
            AND qc.is_active = true
        )
      );
  END IF;

  IF to_regclass('public.role_history') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Sistema pode inserir no histórico" ON public.role_history;

    CREATE POLICY "Sistema pode inserir no histórico"
      ON public.role_history
      FOR INSERT
      TO authenticated
      WITH CHECK (
        is_admin(auth.uid())
        AND performed_by = auth.uid()
      );
  END IF;
END $$;
