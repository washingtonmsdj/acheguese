-- Canonical community moderation reports for posts, comments and profiles.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS removed_reason TEXT,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS removed_reason TEXT,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_moderation_visible
  ON public.posts (created_at DESC)
  WHERE is_published = true AND is_hidden = false AND is_removed = false;

CREATE INDEX IF NOT EXISTS idx_comments_moderation_visible
  ON public.comments (post_id, created_at DESC)
  WHERE is_hidden = false AND is_removed = false;

CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'profile')),
  target_id UUID NOT NULL,
  target_author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 3),
  description TEXT,
  evidence_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'removed', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_reports_unique_reporter UNIQUE (target_type, target_id, reporter_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_community_reports_target
  ON public.community_reports (target_type, target_id, status);

CREATE INDEX IF NOT EXISTS idx_community_reports_queue
  ON public.community_reports (status, created_at DESC)
  WHERE status IN ('pending', 'under_review');

CREATE INDEX IF NOT EXISTS idx_community_reports_target_author
  ON public.community_reports (target_author_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_reports_reporter
  ON public.community_reports (reporter_profile_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_community_report_target_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_author UUID;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT author_profile_id INTO resolved_author
    FROM public.posts
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    SELECT author_profile_id INTO resolved_author
    FROM public.comments
    WHERE id = NEW.target_id;
  ELSE
    SELECT id INTO resolved_author
    FROM public.profiles
    WHERE id = NEW.target_id;
  END IF;

  IF resolved_author IS NULL THEN
    RAISE EXCEPTION 'Community report target not found';
  END IF;

  IF resolved_author = NEW.reporter_profile_id THEN
    RAISE EXCEPTION 'Self reporting is not allowed';
  END IF;

  NEW.target_author_profile_id := resolved_author;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_community_report_target_author ON public.community_reports;
CREATE TRIGGER trg_set_community_report_target_author
  BEFORE INSERT OR UPDATE OF target_type, target_id, reporter_profile_id
  ON public.community_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_community_report_target_author();

DROP TRIGGER IF EXISTS trg_community_reports_updated_at ON public.community_reports;
CREATE TRIGGER trg_community_reports_updated_at
  BEFORE UPDATE ON public.community_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_reports_insert_own ON public.community_reports;
CREATE POLICY community_reports_insert_own
  ON public.community_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS community_reports_select_own_or_admin ON public.community_reports;
CREATE POLICY community_reports_select_own_or_admin
  ON public.community_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR public.is_admin_user(auth.uid())
  );

DROP POLICY IF EXISTS community_reports_admin_update ON public.community_reports;
CREATE POLICY community_reports_admin_update
  ON public.community_reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS community_reports_admin_delete ON public.community_reports;
CREATE POLICY community_reports_admin_delete
  ON public.community_reports
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE OR REPLACE VIEW public.admin_pending_post_reports AS
SELECT
  p.id,
  COALESCE(p.content, '') AS content,
  p.type::TEXT AS type,
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

CREATE OR REPLACE VIEW public.admin_pending_comment_reports AS
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

ALTER VIEW public.admin_pending_post_reports SET (security_invoker = true);
ALTER VIEW public.admin_pending_comment_reports SET (security_invoker = true);

GRANT SELECT ON public.admin_pending_post_reports TO authenticated;
GRANT SELECT ON public.admin_pending_comment_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_reports TO authenticated;
