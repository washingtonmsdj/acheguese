-- Negative authorization proof for authenticated callers against admin/moderation
-- SECURITY DEFINER RPCs. Uses one existing non-admin profile as identity and
-- rolls back any temporary active-profile selection.

BEGIN;

DO $setup$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
BEGIN
  SELECT p.user_id, p.id
  INTO v_user_id, v_profile_id
  FROM public.profiles p
  WHERE p.user_id IS NOT NULL
    AND p.is_active IS TRUE
    AND NOT COALESCE(private.is_admin_user(p.user_id), false)
    AND NOT COALESCE(private.is_admin_from_roles(p.user_id), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.account_deletion_requests request
      WHERE request.user_id = p.user_id
        AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
    )
  ORDER BY CASE WHEN p.profile_type::text = 'personal' THEN 0 ELSE 1 END,
           p.created_at,
           p.id
  LIMIT 1;

  IF v_user_id IS NULL OR v_profile_id IS NULL THEN
    RAISE EXCEPTION 'authenticated_admin_boundary_probe_requires_non_admin_profile';
  END IF;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES (v_user_id, v_profile_id)
  ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  PERFORM set_config('app.admin_boundary_probe.user_id', v_user_id::text, true);
  PERFORM set_config('app.admin_boundary_probe.profile_id', v_profile_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.admin_boundary_probe.user_id'), true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.admin_boundary_probe.user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $probe$
DECLARE
  v_blocked boolean;
  v_profile_id uuid := current_setting('app.admin_boundary_probe.profile_id')::uuid;
BEGIN
  v_blocked := false;
  BEGIN
    PERFORM public.append_driver_moderation_event(gen_random_uuid(), 'approved', NULL, '{}'::jsonb);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_append_driver_moderation_event_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM public.apply_trust_admin_actions(ARRAY[gen_random_uuid()], 'warning', 'security probe', NULL, NULL);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_apply_trust_admin_actions_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.get_community_rpc_operational_metrics(5);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_get_community_rpc_operational_metrics_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.get_community_rpc_slo_status(5, 1, 100.0, 60000);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_get_community_rpc_slo_status_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.get_review_aggregates_admin(ARRAY[gen_random_uuid()], 'business');
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_get_review_aggregates_admin_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.list_business_profile_correction_queue('pending', 1);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_list_business_profile_correction_queue_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.list_community_social_audit_events(NULL, NULL, 1);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_list_community_social_audit_events_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.list_federated_moderation_queue('open', NULL, NULL, NULL, NULL, 1);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_list_federated_moderation_queue_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.list_trust_admin_actions_admin(1, NULL, NULL);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_list_trust_admin_actions_admin_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM * FROM public.list_trust_events_admin(
      1, NULL, NULL, NULL::public.trust_context_type, NULL::public.trust_event_status
    );
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_list_trust_events_admin_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM public.moderate_classified_conversation(gen_random_uuid(), 'block', 'security probe');
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_moderate_classified_conversation_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM public.moderate_community_direct_report(gen_random_uuid(), 'dismiss', 'security probe');
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_moderate_community_direct_report_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM public.review_trust_events_admin(
      ARRAY[gen_random_uuid()], 'confirmed'::public.trust_event_status, 'security probe'
    );
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_review_trust_events_admin_succeeded'; END IF;

  v_blocked := false;
  BEGIN
    PERFORM public.update_safety_incident_status(gen_random_uuid(), 'resolved', v_profile_id);
  EXCEPTION WHEN insufficient_privilege THEN v_blocked := true; END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'non_admin_update_safety_incident_status_succeeded'; END IF;
END;
$probe$;

RESET ROLE;
ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'authenticated_admin_security_definer_negative',
  'passed', true,
  'functions_checked', 14,
  'rolled_back', true
) AS result;
