BEGIN;

ALTER TABLE public.community_reports
  DROP CONSTRAINT IF EXISTS community_reports_target_type_check;
ALTER TABLE public.community_reports
  ADD CONSTRAINT community_reports_target_type_check
  CHECK (
    target_type IN (
      'post',
      'comment',
      'profile',
      'lost_found_post',
      'lost_found_comment',
      'question',
      'answer'
    )
  ) NOT VALID;
ALTER TABLE public.community_reports
  VALIDATE CONSTRAINT community_reports_target_type_check;

CREATE OR REPLACE FUNCTION private.resolve_community_report_target_author(
  p_target_type TEXT,
  p_target_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_author_profile_id UUID;
BEGIN
  CASE p_target_type
    WHEN 'post' THEN
      SELECT p.author_profile_id INTO v_author_profile_id
      FROM public.posts p
      WHERE p.id = p_target_id;
    WHEN 'comment' THEN
      SELECT c.author_profile_id INTO v_author_profile_id
      FROM public.comments c
      WHERE c.id = p_target_id;
    WHEN 'profile' THEN
      SELECT p.id INTO v_author_profile_id
      FROM public.profiles p
      WHERE p.id = p_target_id;
    WHEN 'lost_found_post' THEN
      SELECT p.autor_id INTO v_author_profile_id
      FROM public.lost_found_posts p
      WHERE p.id = p_target_id;
    WHEN 'lost_found_comment' THEN
      SELECT c.autor_id INTO v_author_profile_id
      FROM public.lost_found_comments c
      WHERE c.id = p_target_id;
    WHEN 'question' THEN
      SELECT q.author_profile_id INTO v_author_profile_id
      FROM public.community_questions q
      WHERE q.id = p_target_id;
    WHEN 'answer' THEN
      SELECT a.author_profile_id INTO v_author_profile_id
      FROM public.question_answers a
      WHERE a.id = p_target_id;
    ELSE
      RAISE EXCEPTION 'invalid_community_report_target'
        USING ERRCODE = '22023';
  END CASE;

  RETURN v_author_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION private.resolve_community_report_target_author(
  TEXT, UUID
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.guard_community_report_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_target_author_profile_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(auth.role(), '') <> 'service_role'
       AND current_user NOT IN ('postgres', 'supabase_admin') THEN
      v_actor_profile_id := private.current_active_profile_id();
      IF v_actor_profile_id IS NULL THEN
        RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
      END IF;
      NEW.reporter_profile_id := v_actor_profile_id;

      PERFORM pg_advisory_xact_lock(hashtextextended(v_actor_profile_id::TEXT, 0));
      IF (
        SELECT count(*)
        FROM public.community_reports report
        WHERE report.reporter_profile_id = v_actor_profile_id
          AND report.created_at >= now() - interval '24 hours'
      ) >= 20 THEN
        RAISE EXCEPTION 'community_report_daily_limit_reached'
          USING ERRCODE = 'P0001';
      END IF;
    ELSIF NEW.reporter_profile_id IS NULL THEN
      RAISE EXCEPTION 'reporter_profile_required' USING ERRCODE = '22023';
    END IF;

    v_target_author_profile_id :=
      private.resolve_community_report_target_author(
        NEW.target_type,
        NEW.target_id
      );

    IF v_target_author_profile_id IS NULL THEN
      RAISE EXCEPTION 'community_report_target_not_found'
        USING ERRCODE = 'P0002';
    END IF;
    IF v_target_author_profile_id = NEW.reporter_profile_id THEN
      RAISE EXCEPTION 'self_reporting_is_not_allowed'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.reason NOT IN (
         'spam',
         'harassment',
         'hate',
         'violence',
         'misinformation',
         'malicious_link',
         'other'
       )
       OR char_length(COALESCE(NEW.description, '')) > 2000
       OR COALESCE(array_length(NEW.evidence_urls, 1), 0) > 5
       OR EXISTS (
         SELECT 1
         FROM unnest(COALESCE(NEW.evidence_urls, ARRAY[]::TEXT[])) AS evidence_url
         WHERE evidence_url !~* '^https://[^[:space:]]+$'
       ) THEN
      RAISE EXCEPTION 'invalid_community_report_payload'
        USING ERRCODE = '22023';
    END IF;

    NEW.target_author_profile_id := v_target_author_profile_id;
    NEW.status := 'pending';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.admin_notes := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.target_type IS DISTINCT FROM OLD.target_type
       OR NEW.target_id IS DISTINCT FROM OLD.target_id
       OR NEW.target_author_profile_id IS DISTINCT FROM OLD.target_author_profile_id
       OR NEW.reporter_profile_id IS DISTINCT FROM OLD.reporter_profile_id
       OR NEW.reason IS DISTINCT FROM OLD.reason
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.evidence_urls IS DISTINCT FROM OLD.evidence_urls
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'community_report_identity_is_immutable'
        USING ERRCODE = '42501';
    END IF;
    IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
      RAISE EXCEPTION 'community_report_review_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    IF char_length(COALESCE(NEW.admin_notes, '')) > 2000 THEN
      RAISE EXCEPTION 'community_report_admin_notes_too_long'
        USING ERRCODE = '22023';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_actor_profile_id := private.current_active_profile_id();
      IF v_actor_profile_id IS NULL THEN
        RAISE EXCEPTION 'active_moderator_profile_required'
          USING ERRCODE = '42501';
      END IF;
      NEW.reviewed_by := v_actor_profile_id;
      NEW.reviewed_at := now();
    ELSE
      NEW.reviewed_by := OLD.reviewed_by;
      NEW.reviewed_at := OLD.reviewed_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_community_report_review()
  FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION private.resolve_community_report_target_author(TEXT, UUID)
  IS 'Server-owned resolver for canonical reportable Community entities.';

COMMIT;
