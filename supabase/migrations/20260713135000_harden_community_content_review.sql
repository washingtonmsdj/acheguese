-- Atomic, server-authorized review for reported community posts and comments.
-- Report status, content visibility and audit evidence are committed together.

CREATE OR REPLACE FUNCTION private.review_community_content_reports(
  p_target_type TEXT,
  p_target_id UUID,
  p_decision TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_user_id UUID := auth.uid();
  v_actor_profile_id UUID;
  v_reason TEXT := trim(COALESCE(p_reason, ''));
  v_pending_count INTEGER;
  v_report_status TEXT;
BEGIN
  IF v_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_user(v_actor_user_id), FALSE) THEN
    RAISE EXCEPTION 'community_content_review_not_authorized' USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_target_type NOT IN ('post', 'comment') THEN
    RAISE EXCEPTION 'invalid_community_review_target_type' USING ERRCODE = '22023';
  END IF;
  IF p_decision NOT IN ('dismiss', 'hide', 'remove') THEN
    RAISE EXCEPTION 'invalid_community_review_decision' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_reason) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION 'invalid_community_review_reason' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_target_type || ':' || p_target_id::TEXT, 0)
  );

  IF p_target_type = 'post' THEN
    PERFORM 1 FROM public.posts WHERE id = p_target_id FOR UPDATE;
  ELSE
    PERFORM 1 FROM public.comments WHERE id = p_target_id FOR UPDATE;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_review_target_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT count(*)::INTEGER
  INTO v_pending_count
  FROM public.community_reports
  WHERE target_type = p_target_type
    AND target_id = p_target_id
    AND status IN ('pending', 'under_review');

  IF v_pending_count = 0 THEN
    RETURN jsonb_build_object(
      'target_type', p_target_type,
      'target_id', p_target_id,
      'decision', p_decision,
      'affected_reports', 0,
      'already_reviewed', TRUE
    );
  END IF;

  IF p_decision = 'dismiss' THEN
    v_report_status := 'dismissed';
  ELSIF p_decision = 'hide' THEN
    v_report_status := 'approved';
    IF p_target_type = 'post' THEN
      UPDATE public.posts
      SET is_hidden = TRUE
      WHERE id = p_target_id;
    ELSE
      UPDATE public.comments
      SET is_hidden = TRUE
      WHERE id = p_target_id;
    END IF;
  ELSE
    v_report_status := 'removed';
    IF p_target_type = 'post' THEN
      UPDATE public.posts
      SET is_hidden = TRUE,
          is_removed = TRUE,
          is_published = FALSE,
          removed_reason = v_reason,
          removed_at = now(),
          removed_by = v_actor_profile_id
      WHERE id = p_target_id;
    ELSE
      UPDATE public.comments
      SET is_hidden = TRUE,
          is_removed = TRUE,
          removed_reason = v_reason,
          removed_at = now(),
          removed_by = v_actor_profile_id
      WHERE id = p_target_id;
    END IF;
  END IF;

  UPDATE public.community_reports
  SET status = v_report_status,
      admin_notes = v_reason,
      updated_at = now()
  WHERE target_type = p_target_type
    AND target_id = p_target_id
    AND status IN ('pending', 'under_review');

  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_actor_user_id,
    v_actor_profile_id,
    'moderation.content.' || p_decision,
    p_target_type,
    p_target_id,
    jsonb_build_object(
      'reason', v_reason,
      'affected_reports', v_pending_count,
      'report_status', v_report_status
    )
  );

  RETURN jsonb_build_object(
    'target_type', p_target_type,
    'target_id', p_target_id,
    'decision', p_decision,
    'affected_reports', v_pending_count,
    'already_reviewed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION private.review_community_content_reports(TEXT, UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.review_community_content_reports(TEXT, UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_community_content_reports(
  p_target_type TEXT,
  p_target_id UUID,
  p_decision TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.review_community_content_reports(
    p_target_type,
    p_target_id,
    p_decision,
    p_reason
  );
$$;

REVOKE ALL ON FUNCTION public.review_community_content_reports(TEXT, UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_community_content_reports(TEXT, UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_community_moderation_stats()
RETURNS TABLE (
  pending_posts BIGINT,
  pending_comments BIGINT,
  approved_reports BIGINT,
  rejected_reports BIGINT,
  hidden_content BIGINT,
  removed_content BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'community_moderation_stats_not_authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    count(*) FILTER (
      WHERE reports.target_type = 'post'
        AND reports.status IN ('pending', 'under_review')
    ),
    count(*) FILTER (
      WHERE reports.target_type = 'comment'
        AND reports.status IN ('pending', 'under_review')
    ),
    count(*) FILTER (WHERE reports.status IN ('approved', 'removed')),
    count(*) FILTER (WHERE reports.status IN ('rejected', 'dismissed')),
    (
      SELECT count(*) FROM public.posts WHERE is_hidden = TRUE AND is_removed = FALSE
    ) + (
      SELECT count(*) FROM public.comments WHERE is_hidden = TRUE AND is_removed = FALSE
    ),
    (
      SELECT count(*) FROM public.posts WHERE is_removed = TRUE
    ) + (
      SELECT count(*) FROM public.comments WHERE is_removed = TRUE
    )
  FROM public.community_reports reports;
END;
$$;

REVOKE ALL ON FUNCTION public.get_community_moderation_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_moderation_stats() TO authenticated;

COMMENT ON FUNCTION private.review_community_content_reports(TEXT, UUID, TEXT, TEXT) IS
  'Private atomic implementation for community content review and audit.';
COMMENT ON FUNCTION public.review_community_content_reports(TEXT, UUID, TEXT, TEXT) IS
  'Authenticated SECURITY INVOKER broker for atomic community content review.';
COMMENT ON FUNCTION public.get_community_moderation_stats() IS
  'Admin-only aggregate for the canonical community content moderation queue.';
