-- Queue cards represent unique content targets, not the number of reports on them.
-- Keep resolved report totals as report occurrences for audit reporting.

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
    count(DISTINCT reports.target_id) FILTER (
      WHERE reports.target_type = 'post'
        AND reports.status IN ('pending', 'under_review')
    ),
    count(DISTINCT reports.target_id) FILTER (
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

COMMENT ON FUNCTION public.get_community_moderation_stats() IS
  'Admin-only aggregate for the canonical community content moderation queue; pending totals count unique content targets.';
