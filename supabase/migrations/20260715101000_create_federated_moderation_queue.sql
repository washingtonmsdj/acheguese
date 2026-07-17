-- Admin-only, read-only moderation queue across independent report aggregates.
-- Source tables remain the status masters; this function stores no state and
-- intentionally excludes descriptions, notes and reporter identities.

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
       'community_issue'
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
