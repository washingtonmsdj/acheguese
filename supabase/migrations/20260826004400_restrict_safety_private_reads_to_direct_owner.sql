-- Safety records contain highly sensitive personal data: precise locations,
-- evidence references, audit history, and bearer share tokens. The canonical
-- Safety write contract already requires the profile to belong directly to
-- auth.uid(); reads must not be widened through profile_members.

DROP POLICY IF EXISTS emergency_alerts_select_authorized ON public.emergency_alerts;
CREATE POLICY emergency_alerts_select_authorized
ON public.emergency_alerts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = emergency_alerts.profile_id
      AND profile.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS safety_incidents_select_authorized ON public.safety_incidents;
CREATE POLICY safety_incidents_select_authorized
ON public.safety_incidents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = safety_incidents.reported_by
      AND profile.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS safety_evidence_select_authorized ON public.safety_evidence;
CREATE POLICY safety_evidence_select_authorized
ON public.safety_evidence
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.safety_incidents incident
    JOIN public.profiles profile ON profile.id = incident.reported_by
    WHERE incident.id = safety_evidence.incident_id
      AND profile.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS ride_shares_select_own ON public.ride_shares;
CREATE POLICY ride_shares_select_own
ON public.ride_shares
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = ride_shares.created_by
      AND profile.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS safety_audit_log_select_authorized ON public.safety_audit_log;
CREATE POLICY safety_audit_log_select_authorized
ON public.safety_audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = safety_audit_log.performed_by
      AND profile.user_id = (SELECT auth.uid())
  )
);

DO $verify$
DECLARE
  v_bad_policies integer;
  v_missing_policies integer;
BEGIN
  SELECT count(*)
  INTO v_bad_policies
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename IN (
      'emergency_alerts',
      'safety_incidents',
      'safety_evidence',
      'ride_shares',
      'safety_audit_log'
    )
    AND p.cmd = 'SELECT'
    AND (
      COALESCE(p.qual, '') ILIKE '%auth_can_access_profile%'
      OR COALESCE(p.qual, '') ILIKE '%profile_members%'
    );

  IF v_bad_policies <> 0 THEN
    RAISE EXCEPTION 'shared-profile Safety SELECT policies remain: %', v_bad_policies;
  END IF;

  SELECT count(*)
  INTO v_missing_policies
  FROM (VALUES
    ('emergency_alerts', 'emergency_alerts_select_authorized'),
    ('safety_incidents', 'safety_incidents_select_authorized'),
    ('safety_evidence', 'safety_evidence_select_authorized'),
    ('ride_shares', 'ride_shares_select_own'),
    ('safety_audit_log', 'safety_audit_log_select_authorized')
  ) AS expected(tablename, policyname)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = expected.tablename
      AND p.policyname = expected.policyname
      AND p.cmd = 'SELECT'
      AND p.roles @> ARRAY['authenticated']::name[]
  );

  IF v_missing_policies <> 0 THEN
    RAISE EXCEPTION 'expected owner-only Safety SELECT policies missing: %', v_missing_policies;
  END IF;
END
$verify$;
