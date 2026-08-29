-- Repair Analytics read authority after detecting profile/user ID namespace drift.
--
-- business_data.profile_id points to profiles.id, not auth.users.id. The legacy
-- Analytics policies compared business_data.profile_id directly to auth.uid(),
-- which silently hid metrics from real Business owners/managers. Reuse the
-- canonical Business authority helper and keep global admins authorized.

BEGIN;

DROP POLICY IF EXISTS analytics_daily_metrics_owner_select ON public.analytics_daily_metrics;
DROP POLICY IF EXISTS analytics_daily_metrics_authorized_select ON public.analytics_daily_metrics;

CREATE POLICY analytics_daily_metrics_authorized_select
  ON public.analytics_daily_metrics
  FOR SELECT
  TO authenticated
  USING (
    entity_type = 'business'
    AND EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = analytics_daily_metrics.entity_id
        AND (
          private.can_manage_profile(bd.profile_id)
          OR private.is_admin(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS analytics_events_owner_select ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_business_manager_select ON public.analytics_events;

CREATE POLICY analytics_events_business_manager_select
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    entity_type = 'business'
    AND EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = analytics_events.entity_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

REVOKE SELECT ON TABLE public.analytics_events FROM anon;
REVOKE SELECT ON TABLE public.analytics_daily_metrics FROM anon;
GRANT SELECT ON TABLE public.analytics_events TO authenticated;
GRANT SELECT ON TABLE public.analytics_daily_metrics TO authenticated;

REVOKE ALL ON FUNCTION public.get_analytics_metrics(text, uuid, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_analytics_metrics(text, uuid, date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_metrics(text, uuid, date, date)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_recent_analytics_events(text, uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_recent_analytics_events(text, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_recent_analytics_events(text, uuid, integer)
  TO authenticated, service_role;

DO $verify$
DECLARE
  v_bad_policy_count integer;
BEGIN
  IF has_table_privilege('anon', 'public.analytics_events', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read analytics_events directly';
  END IF;
  IF has_table_privilege('anon', 'public.analytics_daily_metrics', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read analytics_daily_metrics directly';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.analytics_events', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must retain RLS-governed analytics_events SELECT';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.analytics_daily_metrics', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must retain RLS-governed analytics_daily_metrics SELECT';
  END IF;

  IF has_function_privilege('public', 'public.get_analytics_metrics(text,uuid,date,date)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_analytics_metrics(text,uuid,date,date)', 'EXECUTE') THEN
    RAISE EXCEPTION 'public/anon must not execute get_analytics_metrics';
  END IF;
  IF has_function_privilege('public', 'public.get_recent_analytics_events(text,uuid,integer)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_recent_analytics_events(text,uuid,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'public/anon must not execute get_recent_analytics_events';
  END IF;

  SELECT count(*)
    INTO v_bad_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('analytics_events', 'analytics_daily_metrics')
    AND policyname IN ('analytics_events_business_manager_select', 'analytics_daily_metrics_authorized_select')
    AND roles <> ARRAY['authenticated']::name[];

  IF v_bad_policy_count <> 0 THEN
    RAISE EXCEPTION 'analytics read policies must be authenticated-only';
  END IF;
END
$verify$;

COMMIT;
