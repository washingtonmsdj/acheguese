BEGIN;

DO $pre$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'professional_leads'
    AND policyname = 'professional_leads_authenticated_insert'
    AND cmd = 'INSERT'
    AND roles = ARRAY['authenticated']::name[];
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: professional_leads_authenticated_insert contract changed';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'analytics_daily_metrics'
    AND policyname = 'analytics_daily_metrics_authorized_select'
    AND cmd = 'SELECT'
    AND roles = ARRAY['authenticated']::name[];
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: analytics_daily_metrics_authorized_select contract changed';
  END IF;
END
$pre$;

ALTER POLICY professional_leads_authenticated_insert
  ON public.professional_leads
  WITH CHECK (
    requester_user_id = (SELECT auth.uid())
    AND (
      requester_profile_id IS NULL
      OR requester_profile_id = private.current_active_profile_id()
    )
    AND status = 'new'::public.professional_lead_status
    AND EXISTS (
      SELECT 1
      FROM public.professional_data pd
      WHERE pd.id = professional_leads.professional_id
        AND pd.is_accepting_clients = true
    )
  );

ALTER POLICY analytics_daily_metrics_authorized_select
  ON public.analytics_daily_metrics
  USING (
    entity_type = 'business'
    AND EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = analytics_daily_metrics.entity_id
        AND (
          private.can_manage_profile(bd.profile_id)
          OR private.is_admin((SELECT auth.uid()))
        )
    )
  );

DO $post$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname IN ('public','private')
    AND (
      coalesce(qual, '') ~ 'auth\.(uid|role|jwt)\(\)'
      OR coalesce(with_check, '') ~ 'auth\.(uid|role|jwt)\(\)'
    )
    AND NOT (
      coalesce(qual, '') ~ '\(\s*SELECT\s+auth\.(uid|role|jwt)\(\)'
      OR coalesce(with_check, '') ~ '\(\s*SELECT\s+auth\.(uid|role|jwt)\(\)'
    );

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'G5 postcondition failed: % policies still call auth helpers outside InitPlan form', v_count;
  END IF;
END
$post$;

COMMIT;
