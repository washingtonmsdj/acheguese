-- Defense in depth for Community moderation queues.
--
-- These views expose moderation-only metadata (report reasons/descriptions,
-- reporter identities and priority scoring). security_invoker=true already
-- preserves base-table RLS, but authenticated non-admin reporters could still
-- query the admin projections for the rows they were allowed to see. Gate the
-- view contract itself on canonical platform-admin authority and remove anon
-- SELECT grants so route/UI guards are never the security boundary.

CREATE OR REPLACE VIEW public.admin_pending_post_reports
WITH (security_invoker = true)
AS
SELECT
  p.id,
  COALESCE(p.content, '') AS content,
  p.type AS type,
  COALESCE(p.images, '[]'::jsonb) AS images,
  p.author_profile_id,
  COALESCE(author_profile.name, 'Usuario') AS author_name,
  COALESCE(author_profile.avatar_url, '') AS author_avatar,
  COALESCE(author_profile.pontos, 0) AS author_reputation,
  COALESCE(previous_reports.count, 0)::INTEGER AS author_previous_reports,
  COUNT(r.id)::INTEGER AS reports_count,
  CASE
    WHEN BOOL_OR(r.status = 'under_review') THEN 'under_review'
    ELSE 'pending'
  END AS status,
  (
    COUNT(r.id)::INTEGER * 5
    + CASE WHEN COALESCE(author_profile.pontos, 0) < 100 THEN 20 ELSE 0 END
    + CASE WHEN COALESCE(author_profile.pontos, 0) < 50 THEN 30 ELSE 0 END
    + CASE WHEN BOOL_OR(lower(r.reason) IN ('harassment', 'hate_speech', 'violence', 'abuse')) THEN 50 ELSE 0 END
    + CASE WHEN BOOL_OR(lower(r.reason) IN ('false_information', 'fraud', 'scam')) THEN 30 ELSE 0 END
  )::INTEGER AS priority,
  p.created_at,
  MAX(r.created_at) AS latest_report_at,
  jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'type', r.reason,
      'reason', r.reason,
      'description', r.description,
      'status', r.status,
      'created_at', r.created_at,
      'reporter_id', r.reporter_profile_id,
      'reporter_name', COALESCE(reporter_profile.name, 'Anonimo'),
      'reporter_avatar', COALESCE(reporter_profile.avatar_url, ''),
      'reporter', jsonb_build_object(
        'id', reporter_profile.id,
        'name_completo', COALESCE(reporter_profile.name, 'Anonimo'),
        'avatar_url', COALESCE(reporter_profile.avatar_url, '')
      )
    )
    ORDER BY r.created_at DESC
  ) AS reports
FROM public.community_reports r
JOIN public.posts p
  ON r.target_type = 'post'
  AND r.target_id = p.id
LEFT JOIN public.profiles author_profile
  ON author_profile.id = p.author_profile_id
LEFT JOIN public.profiles reporter_profile
  ON reporter_profile.id = r.reporter_profile_id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS count
  FROM public.community_reports pr
  WHERE pr.target_author_profile_id = p.author_profile_id
    AND pr.status IN ('approved', 'removed')
    AND NOT (pr.target_type = 'post' AND pr.target_id = p.id)
) previous_reports ON true
WHERE r.status IN ('pending', 'under_review')
  AND p.is_published = true
  AND COALESCE(private.is_admin_user((SELECT auth.uid())), false)
GROUP BY
  p.id,
  p.content,
  p.type,
  p.images,
  p.author_profile_id,
  p.created_at,
  author_profile.name,
  author_profile.avatar_url,
  author_profile.pontos,
  previous_reports.count;

CREATE OR REPLACE VIEW public.admin_pending_comment_reports
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.content,
  c.author_profile_id,
  COALESCE(author_profile.name, 'Usuario') AS author_name,
  COALESCE(author_profile.avatar_url, '') AS author_avatar,
  COALESCE(author_profile.pontos, 0) AS author_reputation,
  c.post_id,
  COALESCE(p.content, '') AS post_content,
  COUNT(r.id)::INTEGER AS reports_count,
  CASE
    WHEN BOOL_OR(r.status = 'under_review') THEN 'under_review'
    ELSE 'pending'
  END AS status,
  (
    COUNT(r.id)::INTEGER
    + CASE WHEN BOOL_OR(lower(r.reason) IN ('harassment', 'hate_speech', 'violence', 'abuse')) THEN 3 ELSE 0 END
    + CASE WHEN BOOL_OR(lower(r.reason) IN ('false_information', 'fraud', 'scam')) THEN 2 ELSE 0 END
  )::INTEGER AS priority,
  c.created_at,
  MAX(r.created_at) AS latest_report_at,
  jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'type', r.reason,
      'reason', r.reason,
      'description', r.description,
      'status', r.status,
      'created_at', r.created_at,
      'reporter_id', r.reporter_profile_id,
      'reporter_name', COALESCE(reporter_profile.name, 'Anonimo'),
      'reporter_avatar', COALESCE(reporter_profile.avatar_url, ''),
      'reporter', jsonb_build_object(
        'id', reporter_profile.id,
        'name_completo', COALESCE(reporter_profile.name, 'Anonimo'),
        'avatar_url', COALESCE(reporter_profile.avatar_url, '')
      )
    )
    ORDER BY r.created_at DESC
  ) AS reports
FROM public.community_reports r
JOIN public.comments c
  ON r.target_type = 'comment'
  AND r.target_id = c.id
LEFT JOIN public.posts p
  ON p.id = c.post_id
LEFT JOIN public.profiles author_profile
  ON author_profile.id = c.author_profile_id
LEFT JOIN public.profiles reporter_profile
  ON reporter_profile.id = r.reporter_profile_id
WHERE r.status IN ('pending', 'under_review')
  AND COALESCE(private.is_admin_user((SELECT auth.uid())), false)
GROUP BY
  c.id,
  c.content,
  c.author_profile_id,
  c.post_id,
  c.created_at,
  p.content,
  author_profile.name,
  author_profile.avatar_url,
  author_profile.pontos;

REVOKE SELECT ON public.admin_pending_post_reports FROM anon;
REVOKE SELECT ON public.admin_pending_comment_reports FROM anon;
GRANT SELECT ON public.admin_pending_post_reports TO authenticated;
GRANT SELECT ON public.admin_pending_comment_reports TO authenticated;
