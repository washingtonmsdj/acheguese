-- G6 Business profile reporting.
-- Factual corrections are intentionally separate product semantics; this
-- aggregate is only for policy, fraud, safety and abuse reports.

CREATE TABLE IF NOT EXISTS public.business_profile_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_data(id) ON DELETE CASCADE,
  reporter_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (
    reason IN (
      'fraud',
      'impersonation',
      'misleading',
      'harmful',
      'privacy_or_safety',
      'duplicate',
      'closed_or_not_here',
      'policy_violation',
      'other'
    )
  ),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'resolved', 'dismissed')
  ),
  reviewed_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_profile_reports_description_length_check
    CHECK (
      description IS NULL
      OR char_length(trim(description)) BETWEEN 3 AND 1000
    ),
  CONSTRAINT business_profile_reports_admin_notes_length_check
    CHECK (
      admin_notes IS NULL
      OR char_length(trim(admin_notes)) BETWEEN 3 AND 2000
    )
);

ALTER TABLE public.business_profile_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_business_profile_reports_business
  ON public.business_profile_reports(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_profile_reports_reporter
  ON public.business_profile_reports(reporter_profile_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS business_profile_reports_open_dedupe_uidx
  ON public.business_profile_reports(reporter_profile_id, business_id, reason)
  WHERE status IN ('pending', 'under_review');

DROP TRIGGER IF EXISTS update_business_profile_reports_updated_at
ON public.business_profile_reports;
CREATE TRIGGER update_business_profile_reports_updated_at
BEFORE UPDATE ON public.business_profile_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE private.sensitive_report_audit_log
  DROP CONSTRAINT IF EXISTS sensitive_report_audit_log_domain_check;
ALTER TABLE private.sensitive_report_audit_log
  ADD CONSTRAINT sensitive_report_audit_log_domain_check
  CHECK (
    domain IN ('classified', 'vaga', 'review', 'ride', 'business_profile')
  );

CREATE OR REPLACE FUNCTION private.audit_sensitive_report_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
DECLARE
  v_new jsonb := to_jsonb(NEW);
  v_old jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  v_domain text := TG_ARGV[0];
  v_actor_profile_id uuid;
  v_target_id uuid;
BEGIN
  v_actor_profile_id := COALESCE(
    NULLIF(v_new->>'reviewed_by', '')::uuid,
    NULLIF(v_new->>'reviewed_by_profile_id', '')::uuid,
    NULLIF(v_new->>'reporter_id', '')::uuid,
    NULLIF(v_new->>'reporter_profile_id', '')::uuid
  );
  v_target_id := COALESCE(
    NULLIF(v_new->>'classified_id', '')::uuid,
    NULLIF(v_new->>'vaga_id', '')::uuid,
    NULLIF(v_new->>'review_id', '')::uuid,
    NULLIF(v_new->>'ride_id', '')::uuid,
    NULLIF(v_new->>'business_id', '')::uuid
  );

  INSERT INTO private.sensitive_report_audit_log (
    domain,
    action,
    report_id,
    actor_user_id,
    actor_profile_id,
    previous_status,
    next_status,
    metadata
  ) VALUES (
    v_domain,
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'reviewed' END,
    NEW.id,
    auth.uid(),
    v_actor_profile_id,
    CASE WHEN TG_OP = 'UPDATE' THEN v_old->>'status' ELSE NULL END,
    v_new->>'status',
    jsonb_strip_nulls(jsonb_build_object(
      'target_id', v_target_id,
      'reason', COALESCE(v_new->>'reason', v_new->>'report_type'),
      'severity', v_new->>'severity'
    ))
  );
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.audit_sensitive_report_write() FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.guard_business_profile_report_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_target_profile_id uuid;
  v_recent_count integer;
BEGIN
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT bd.profile_id
    INTO v_target_profile_id
    FROM public.business_data bd
    WHERE bd.id = NEW.business_id
      AND bd.status = 'active';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'business_profile_not_found' USING ERRCODE = 'P0002';
    END IF;

    IF COALESCE(
      private.user_can_manage_profile(auth.uid(), v_target_profile_id),
      false
    ) THEN
      RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext('business_profile_report_rate'),
      hashtext(v_actor_profile_id::text)
    );

    SELECT count(*)::integer
    INTO v_recent_count
    FROM public.business_profile_reports r
    WHERE r.reporter_profile_id = v_actor_profile_id
      AND r.created_at >= now() - interval '1 hour';

    IF v_recent_count >= 10 THEN
      RAISE EXCEPTION 'business_profile_report_rate_limit_exceeded'
        USING ERRCODE = 'P0001';
    END IF;

    NEW.reporter_profile_id := v_actor_profile_id;
    NEW.description := NULLIF(trim(COALESCE(NEW.description, '')), '');
    NEW.status := 'pending';
    NEW.reviewed_by_profile_id := NULL;
    NEW.reviewed_at := NULL;
    NEW.admin_notes := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.reporter_profile_id IS DISTINCT FROM OLD.reporter_profile_id
       OR NEW.reason IS DISTINCT FROM OLD.reason
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'business_profile_report_identity_is_immutable'
        USING ERRCODE = '42501';
    END IF;

    IF NOT COALESCE(private.is_admin_user(auth.uid()), false) THEN
      RAISE EXCEPTION 'business_profile_report_review_not_authorized'
        USING ERRCODE = '42501';
    END IF;

    IF OLD.status IN ('resolved', 'dismissed')
       AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'business_profile_report_is_terminal'
        USING ERRCODE = '22023';
    END IF;

    IF NEW.status NOT IN ('under_review', 'resolved', 'dismissed') THEN
      RAISE EXCEPTION 'invalid_business_profile_report_status'
        USING ERRCODE = '22023';
    END IF;

    NEW.reviewed_by_profile_id := private.current_active_profile_id();
    NEW.reviewed_at := now();
    NEW.admin_notes := NULLIF(trim(COALESCE(NEW.admin_notes, '')), '');
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_business_profile_report_write()
FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_business_profile_report_write
ON public.business_profile_reports;
CREATE TRIGGER trg_guard_business_profile_report_write
BEFORE INSERT OR UPDATE
ON public.business_profile_reports
FOR EACH ROW
EXECUTE FUNCTION private.guard_business_profile_report_write();

DROP TRIGGER IF EXISTS trg_audit_business_profile_report_write
ON public.business_profile_reports;
CREATE TRIGGER trg_audit_business_profile_report_write
AFTER INSERT OR UPDATE
ON public.business_profile_reports
FOR EACH ROW
EXECUTE FUNCTION private.audit_sensitive_report_write('business_profile');

DROP POLICY IF EXISTS business_profile_reports_select_own_or_admin
ON public.business_profile_reports;
CREATE POLICY business_profile_reports_select_own_or_admin
ON public.business_profile_reports
FOR SELECT TO authenticated
USING (
  reporter_profile_id = private.current_active_profile_id()
  OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)
);

REVOKE INSERT, UPDATE, DELETE
ON public.business_profile_reports
FROM authenticated, anon;
GRANT SELECT ON public.business_profile_reports TO authenticated;

CREATE OR REPLACE FUNCTION private.create_business_profile_report(
  p_business_id uuid,
  p_reason text,
  p_description text DEFAULT NULL
)
RETURNS public.business_profile_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
DECLARE
  v_report public.business_profile_reports;
  v_actor_profile_id uuid := private.current_active_profile_id();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_reason NOT IN (
    'fraud',
    'impersonation',
    'misleading',
    'harmful',
    'privacy_or_safety',
    'duplicate',
    'closed_or_not_here',
    'policy_violation',
    'other'
  ) THEN
    RAISE EXCEPTION 'invalid_business_profile_report_reason'
      USING ERRCODE = '22023';
  END IF;

  IF NULLIF(trim(COALESCE(p_description, '')), '') IS NOT NULL
     AND char_length(trim(p_description)) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION 'invalid_business_profile_report_description'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_report
  FROM public.business_profile_reports r
  WHERE r.reporter_profile_id = v_actor_profile_id
    AND r.business_id = p_business_id
    AND r.reason = p_reason
    AND r.status IN ('pending', 'under_review')
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_report.id IS NOT NULL THEN
    RETURN v_report;
  END IF;

  INSERT INTO public.business_profile_reports (
    business_id,
    reporter_profile_id,
    reason,
    description
  )
  VALUES (
    p_business_id,
    v_actor_profile_id,
    p_reason,
    p_description
  )
  RETURNING * INTO v_report;

  RETURN v_report;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_business_profile_report(
  p_business_id uuid,
  p_reason text,
  p_description text DEFAULT NULL
)
RETURNS public.business_profile_reports
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $function$
  SELECT private.create_business_profile_report(
    p_business_id,
    p_reason,
    p_description
  );
$function$;

CREATE OR REPLACE FUNCTION private.moderate_business_profile_report(
  p_report_id uuid,
  p_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS public.business_profile_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
DECLARE
  v_report public.business_profile_reports;
BEGIN
  IF NOT COALESCE(private.is_admin_user(auth.uid()), false) THEN
    RAISE EXCEPTION 'business_profile_report_review_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.business_profile_reports
  SET
    status = p_status,
    admin_notes = p_admin_notes
  WHERE id = p_report_id
  RETURNING * INTO v_report;

  IF v_report.id IS NULL THEN
    RAISE EXCEPTION 'business_profile_report_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_report;
END;
$function$;

CREATE OR REPLACE FUNCTION public.moderate_business_profile_report(
  p_report_id uuid,
  p_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS public.business_profile_reports
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $function$
  SELECT private.moderate_business_profile_report(
    p_report_id,
    p_status,
    p_admin_notes
  );
$function$;

REVOKE ALL ON FUNCTION private.create_business_profile_report(uuid, text, text)
FROM PUBLIC;
REVOKE ALL ON FUNCTION private.moderate_business_profile_report(uuid, text, text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_business_profile_report(uuid, text, text)
TO authenticated;
GRANT EXECUTE ON FUNCTION private.moderate_business_profile_report(uuid, text, text)
TO authenticated;

REVOKE ALL ON FUNCTION public.create_business_profile_report(uuid, text, text)
FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_business_profile_report(uuid, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_profile_report(uuid, text, text)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_business_profile_report(uuid, text, text)
TO authenticated;

COMMENT ON TABLE public.business_profile_reports IS
  'Canonical business/profile abuse and policy report aggregate. Incorrect factual data belongs to correction suggestions, not this table.';
COMMENT ON FUNCTION public.create_business_profile_report(uuid, text, text) IS
  'Authenticated report command with server-derived reporter, self-report guard, dedupe and rate limit.';


-- Admin-only, read-only moderation queue across independent report aggregates.
-- Source tables remain the status masters; this function stores no state and
-- intentionally excludes descriptions, notes and reporter identities.

CREATE INDEX IF NOT EXISTS idx_business_profile_reports_moderation_queue
  ON public.business_profile_reports (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_review_reports_moderation_queue
  ON public.review_reports (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_ride_reports_moderation_queue
  ON public.ride_reports (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_group_message_reports_moderation_queue
  ON public.group_message_reports (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_community_alert_reports_moderation_queue
  ON public.community_alert_reports (created_at DESC, id DESC, alert_id);
CREATE INDEX IF NOT EXISTS idx_community_issue_reports_moderation_queue
  ON public.community_issue_reports (created_at DESC, id DESC, issue_id);

-- security-authority: public-rpc public.list_federated_moderation_queue
CREATE OR REPLACE FUNCTION public.list_federated_moderation_queue(
  p_queue_state TEXT DEFAULT 'open',
  p_domain TEXT DEFAULT NULL,
  p_before_created_at TIMESTAMPTZ DEFAULT NULL,
  p_before_domain TEXT DEFAULT NULL,
  p_before_report_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  domain TEXT,
  report_id UUID,
  target_type TEXT,
  target_id UUID,
  reason_code TEXT,
  queue_state TEXT,
  source_status TEXT,
  created_at TIMESTAMPTZ,
  report_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 51);
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'federated_moderation_queue_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_queue_state IS NOT NULL
     AND p_queue_state NOT IN ('open', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'invalid_federated_moderation_queue_state'
      USING ERRCODE = '22023';
  END IF;

  IF p_domain IS NOT NULL
     AND p_domain NOT IN (
       'community_content',
       'classified',
       'vaga',
       'review',
       'ride',
       'group_message',
       'community_direct',
       'community_alert',
       'community_issue',
       'business_profile'
     ) THEN
    RAISE EXCEPTION 'invalid_federated_moderation_domain'
      USING ERRCODE = '22023';
  END IF;

  IF (p_before_created_at IS NULL)::INTEGER
     + (p_before_domain IS NULL)::INTEGER
     + (p_before_report_id IS NULL)::INTEGER NOT IN (0, 3) THEN
    RAISE EXCEPTION 'incomplete_federated_moderation_cursor'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH queue_items AS (
    SELECT
      'community_content'::TEXT AS domain,
      (array_agg(r.id ORDER BY r.created_at DESC, r.id DESC))[1] AS report_id,
      r.target_type::TEXT AS target_type,
      r.target_id AS target_id,
      CASE
        WHEN count(DISTINCT r.reason) = 1 THEN min(r.reason)
        ELSE 'multiple'
      END::TEXT AS reason_code,
      CASE
        WHEN bool_or(r.status IN ('pending', 'under_review')) THEN 'open'
        WHEN bool_and(r.status IN ('dismissed', 'rejected')) THEN 'dismissed'
        ELSE 'resolved'
      END::TEXT AS queue_state,
      (array_agg(r.status ORDER BY r.created_at DESC, r.id DESC))[1]::TEXT
        AS source_status,
      max(r.created_at) AS created_at,
      count(*)::BIGINT AS report_count
    FROM public.community_reports r
    GROUP BY r.target_type, r.target_id

    UNION ALL

    SELECT
      'classified', r.id, 'classified', r.classified_id, r.reason,
      CASE
        WHEN r.status IN ('dismissed', 'rejected') THEN 'dismissed'
        WHEN r.status IN ('resolved', 'closed', 'actioned') THEN 'resolved'
        ELSE 'open'
      END,
      r.status, r.created_at, 1::BIGINT
    FROM public.classified_reports r

    UNION ALL

    SELECT
      'vaga', r.id, 'vaga', r.vaga_id, r.reason,
      CASE
        WHEN r.status IN ('dismissed', 'rejected') THEN 'dismissed'
        WHEN r.status IN ('resolved', 'closed', 'actioned') THEN 'resolved'
        ELSE 'open'
      END,
      r.status, r.created_at, 1::BIGINT
    FROM public.vaga_reports r

    UNION ALL

    SELECT
      'business_profile', r.id, 'business_profile', r.business_id, r.reason,
      CASE
        WHEN r.status = 'dismissed' THEN 'dismissed'
        WHEN r.status = 'resolved' THEN 'resolved'
        ELSE 'open'
      END,
      r.status, r.created_at, 1::BIGINT
    FROM public.business_profile_reports r

    UNION ALL

    SELECT
      'review', r.id, 'review', r.review_id, r.reason,
      CASE
        WHEN r.status IN ('dismissed', 'rejected') THEN 'dismissed'
        WHEN r.status IN ('resolved', 'closed', 'actioned') THEN 'resolved'
        ELSE 'open'
      END,
      r.status, r.created_at, 1::BIGINT
    FROM public.review_reports r

    UNION ALL

    SELECT
      'ride', r.id, 'ride', r.ride_id, r.report_type,
      CASE
        WHEN r.status IN ('dismissed', 'rejected', 'ignored') THEN 'dismissed'
        WHEN r.status IN ('resolved', 'closed', 'actioned') THEN 'resolved'
        ELSE 'open'
      END,
      r.status, r.created_at, 1::BIGINT
    FROM public.ride_reports r

    UNION ALL

    SELECT
      'group_message', r.id, 'group_message', r.message_id, r.reason,
      CASE
        WHEN r.status IN ('dismissed', 'rejected') THEN 'dismissed'
        WHEN r.status IN ('resolved', 'closed', 'actioned', 'removed') THEN 'resolved'
        ELSE 'open'
      END,
      r.status, r.created_at, 1::BIGINT
    FROM public.group_message_reports r

    UNION ALL

    SELECT
      'community_direct', r.id, 'community_direct_message',
      COALESCE(r.message_id, r.thread_id), r.reason,
      CASE
        WHEN r.status IN ('dismissed', 'rejected') THEN 'dismissed'
        WHEN r.status IN ('resolved', 'closed', 'actioned', 'removed') THEN 'resolved'
        ELSE 'open'
      END,
      r.status, r.created_at, 1::BIGINT
    FROM public.community_direct_message_reports r

    UNION ALL

    SELECT
      'community_alert',
      (array_agg(r.id ORDER BY r.created_at DESC, r.id DESC))[1],
      'community_alert',
      r.alert_id,
      CASE
        WHEN count(DISTINCT r.reason) = 1 THEN min(r.reason)
        ELSE 'multiple'
      END,
      CASE
        WHEN a.status IN ('dismissed', 'rejected') THEN 'dismissed'
        WHEN a.removed_at IS NOT NULL
          OR a.status IN ('resolved', 'removed', 'expired', 'archived')
          THEN 'resolved'
        ELSE 'open'
      END,
      CASE WHEN a.under_review THEN 'under_review' ELSE a.status END,
      max(r.created_at),
      count(*)::BIGINT
    FROM public.community_alert_reports r
    JOIN public.community_alerts a ON a.id = r.alert_id
    GROUP BY r.alert_id, a.status, a.removed_at, a.under_review

    UNION ALL

    SELECT
      'community_issue',
      (array_agg(r.id ORDER BY r.created_at DESC, r.id DESC))[1],
      'community_issue',
      r.issue_id,
      CASE
        WHEN count(DISTINCT r.reason) = 1 THEN min(r.reason)
        ELSE 'multiple'
      END,
      CASE
        WHEN i.status IN ('rejeitado', 'rejected', 'dismissed') THEN 'dismissed'
        WHEN i.status IN ('resolvido', 'resolved', 'closed', 'archived') THEN 'resolved'
        ELSE 'open'
      END,
      i.status,
      max(r.created_at),
      count(*)::BIGINT
    FROM public.community_issue_reports r
    JOIN public.community_issues i ON i.id = r.issue_id
    GROUP BY r.issue_id, i.status
  )
  SELECT
    q.domain,
    q.report_id,
    q.target_type,
    q.target_id,
    q.reason_code,
    q.queue_state,
    q.source_status,
    q.created_at,
    q.report_count
  FROM queue_items q
  WHERE (p_queue_state IS NULL OR q.queue_state = p_queue_state)
    AND (p_domain IS NULL OR q.domain = p_domain)
    AND (
      p_before_created_at IS NULL
      OR (q.created_at, q.domain, q.report_id)
         < (p_before_created_at, p_before_domain, p_before_report_id)
    )
  ORDER BY q.created_at DESC, q.domain DESC, q.report_id DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.list_federated_moderation_queue(
  TEXT, TEXT, TIMESTAMPTZ, TEXT, UUID, INTEGER
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_federated_moderation_queue(
  TEXT, TEXT, TIMESTAMPTZ, TEXT, UUID, INTEGER
) TO authenticated;

COMMENT ON FUNCTION public.list_federated_moderation_queue(
  TEXT, TEXT, TIMESTAMPTZ, TEXT, UUID, INTEGER
) IS
  'Admin-only keyset read model. Source report aggregates retain canonical status and commands.';
