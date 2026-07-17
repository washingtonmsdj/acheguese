-- Replace the obsolete physical media enum with the semantic Community post
-- type contract used by every writer and reader.

BEGIN;

DROP VIEW IF EXISTS public.admin_pending_post_reports;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_type_check;

ALTER TABLE public.posts
  ALTER COLUMN type DROP DEFAULT;

ALTER TABLE public.posts
  ALTER COLUMN type TYPE TEXT
  USING (
    CASE type::TEXT
      WHEN 'text' THEN 'post'
      WHEN 'image' THEN 'post'
      WHEN 'video' THEN 'post'
      WHEN 'link' THEN 'post'
      WHEN 'poll' THEN 'enquete'
      ELSE type::TEXT
    END
  );

ALTER TABLE public.posts
  ALTER COLUMN type SET DEFAULT 'post',
  ADD CONSTRAINT posts_type_check CHECK (
    type IN (
      'post',
      'discussao',
      'pergunta',
      'recomendacao',
      'enquete',
      'alerta',
      'achados',
      'favor',
      'evento',
      'desapego',
      'civic_report',
      'classificado',
      'ride_share'
    )
  );

DROP TYPE IF EXISTS public.post_type;

COMMENT ON COLUMN public.posts.type IS
  'Canonical semantic Community post type; media format is represented by images and display_format.';

CREATE VIEW public.admin_pending_post_reports
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

GRANT SELECT ON public.admin_pending_post_reports TO authenticated;

COMMIT;
