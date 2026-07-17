-- Canonical, server-authorized moderation actions for the community runtime.
-- Browser input selects only the target, action and reason. Actor identity,
-- target auth identity, suspension state and audit metadata are server-owned.

CREATE OR REPLACE FUNCTION private.current_active_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
    AND p.is_active = TRUE
    AND NOT (
      (p.is_suspended = TRUE OR p.suspended = TRUE)
      AND (p.suspended_until IS NULL OR p.suspended_until > now())
    )
  ORDER BY p.created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.auth_owns_active_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = p_profile_id
        AND p.user_id = auth.uid()
        AND p.is_active = TRUE
        AND NOT (
          (p.is_suspended = TRUE OR p.suspended = TRUE)
          AND (p.suspended_until IS NULL OR p.suspended_until > now())
        )
    );
$$;

CREATE OR REPLACE FUNCTION private.auth_is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members_new gm
    WHERE gm.group_id = p_group_id
      AND private.auth_owns_active_profile(gm.member_profile_id)
  );
$$;

REVOKE ALL ON FUNCTION private.current_active_profile_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_owns_active_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_group_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_active_profile_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_owns_active_profile(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_is_group_member(UUID) TO authenticated, service_role;

CREATE TABLE public.community_user_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (
    action IN (
      'warning_low',
      'warning_medium',
      'warning_high',
      'suspend_7d',
      'suspend_permanent',
      'ban_permanent'
    )
  ),
  reason TEXT NOT NULL CHECK (
    char_length(trim(reason)) BETWEEN 3 AND 1000
  ),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_user_moderation_target
  ON public.community_user_moderation_actions (target_profile_id, created_at DESC);
CREATE INDEX idx_community_user_moderation_actor
  ON public.community_user_moderation_actions (actor_profile_id, created_at DESC);
CREATE INDEX idx_community_user_moderation_action
  ON public.community_user_moderation_actions (action, created_at DESC);

ALTER TABLE public.community_user_moderation_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.community_user_moderation_actions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.community_user_moderation_actions TO authenticated;
GRANT ALL ON TABLE public.community_user_moderation_actions TO service_role;

CREATE POLICY community_user_moderation_admin_read
  ON public.community_user_moderation_actions
  FOR SELECT
  TO authenticated
  USING (COALESCE(private.is_admin_user(auth.uid()), FALSE));

CREATE POLICY community_social_audit_admin_read
  ON public.community_social_audit_log
  FOR SELECT
  TO authenticated
  USING (COALESCE(private.is_admin_user(auth.uid()), FALSE));

GRANT SELECT ON TABLE public.community_social_audit_log TO authenticated;

-- Existing ban state is readable only by the affected account or an admin.
-- All mutations are routed through the canonical moderation RPC below.
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'banned_users'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.banned_users', policy_row.policyname);
  END LOOP;
END $$;

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.banned_users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.banned_users TO authenticated;

CREATE POLICY banned_users_read_own_or_admin
  ON public.banned_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

CREATE OR REPLACE FUNCTION public.apply_community_user_moderation_action(
  p_target_profile_id UUID,
  p_action TEXT,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_user_id UUID := auth.uid();
  v_actor_profile_id UUID;
  v_target_user_id UUID;
  v_action_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_reason TEXT := trim(COALESCE(p_reason, ''));
BEGIN
  IF v_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_user(v_actor_user_id), FALSE) THEN
    RAISE EXCEPTION 'community_moderation_not_authorized' USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_action NOT IN (
    'warning_low',
    'warning_medium',
    'warning_high',
    'suspend_7d',
    'suspend_permanent',
    'ban_permanent'
  ) THEN
    RAISE EXCEPTION 'invalid_community_moderation_action' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_reason) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION 'invalid_community_moderation_reason' USING ERRCODE = '22023';
  END IF;

  SELECT p.user_id
  INTO v_target_user_id
  FROM public.profiles p
  WHERE p.id = p_target_profile_id
  FOR UPDATE;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'moderation_target_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_target_user_id = v_actor_user_id THEN
    RAISE EXCEPTION 'self_moderation_is_not_allowed' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(private.is_admin_user(v_target_user_id), FALSE) THEN
    RAISE EXCEPTION 'admin_target_requires_higher_authority' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_target_profile_id::TEXT, 0));

  IF p_action = 'suspend_7d' THEN
    v_expires_at := now() + interval '7 days';
  END IF;

  INSERT INTO public.community_user_moderation_actions (
    target_profile_id,
    actor_profile_id,
    action,
    reason,
    expires_at
  )
  VALUES (
    p_target_profile_id,
    v_actor_profile_id,
    p_action,
    v_reason,
    v_expires_at
  )
  RETURNING id INTO v_action_id;

  IF p_action = 'suspend_7d' THEN
    UPDATE public.profiles
    SET is_suspended = TRUE,
        suspended = TRUE,
        suspended_at = now(),
        suspended_until = v_expires_at,
        suspension_reason = v_reason
    WHERE user_id = v_target_user_id;
  ELSIF p_action IN ('suspend_permanent', 'ban_permanent') THEN
    UPDATE public.profiles
    SET is_suspended = TRUE,
        suspended = TRUE,
        suspended_at = now(),
        suspended_until = NULL,
        suspension_reason = v_reason
    WHERE user_id = v_target_user_id;
  END IF;

  IF p_action = 'ban_permanent' THEN
    UPDATE public.banned_users
    SET is_active = FALSE
    WHERE user_id = v_target_user_id
      AND is_active = TRUE;

    INSERT INTO public.banned_users (
      user_id,
      banned_by,
      reason,
      is_active,
      banned_at,
      expires_at
    )
    VALUES (
      v_target_user_id,
      v_actor_user_id,
      v_reason,
      TRUE,
      now(),
      NULL
    );
  END IF;

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
    'moderation.' || p_action,
    'profile',
    p_target_profile_id,
    jsonb_build_object(
      'moderation_action_id', v_action_id,
      'expires_at', v_expires_at
    )
  );

  RETURN v_action_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_community_user_moderation_action(UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_community_user_moderation_action(UUID, TEXT, TEXT)
  TO authenticated;

-- Reporting identity and target ownership are derived in the database. The
-- trigger intentionally runs as the caller so target reads continue to obey
-- the target table's RLS policies.
ALTER TABLE public.community_reports
  ALTER COLUMN reporter_profile_id SET DEFAULT private.current_active_profile_id();

DROP TRIGGER IF EXISTS trg_set_community_report_target_author ON public.community_reports;
DROP FUNCTION IF EXISTS public.set_community_report_target_author();

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
        FROM public.community_reports r
        WHERE r.reporter_profile_id = v_actor_profile_id
          AND r.created_at >= now() - interval '24 hours'
      ) >= 20 THEN
        RAISE EXCEPTION 'community_report_daily_limit_reached' USING ERRCODE = 'P0001';
      END IF;
    ELSIF NEW.reporter_profile_id IS NULL THEN
      RAISE EXCEPTION 'reporter_profile_required' USING ERRCODE = '22023';
    END IF;

    IF NEW.target_type = 'post' THEN
      SELECT p.author_profile_id INTO v_target_author_profile_id
      FROM public.posts p
      WHERE p.id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      SELECT c.author_profile_id INTO v_target_author_profile_id
      FROM public.comments c
      WHERE c.id = NEW.target_id;
    ELSIF NEW.target_type = 'profile' THEN
      SELECT p.id INTO v_target_author_profile_id
      FROM public.profiles p
      WHERE p.id = NEW.target_id;
    ELSE
      RAISE EXCEPTION 'invalid_community_report_target' USING ERRCODE = '22023';
    END IF;

    IF v_target_author_profile_id IS NULL THEN
      RAISE EXCEPTION 'community_report_target_not_found' USING ERRCODE = 'P0002';
    END IF;
    IF v_target_author_profile_id = NEW.reporter_profile_id THEN
      RAISE EXCEPTION 'self_reporting_is_not_allowed' USING ERRCODE = '42501';
    END IF;

    IF char_length(trim(COALESCE(NEW.reason, ''))) NOT BETWEEN 3 AND 120
       OR char_length(COALESCE(NEW.description, '')) > 2000
       OR COALESCE(array_length(NEW.evidence_urls, 1), 0) > 5
       OR EXISTS (
         SELECT 1
         FROM unnest(COALESCE(NEW.evidence_urls, ARRAY[]::TEXT[])) AS evidence_url
         WHERE evidence_url !~* '^https://[^[:space:]]+$'
       ) THEN
      RAISE EXCEPTION 'invalid_community_report_payload' USING ERRCODE = '22023';
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
      RAISE EXCEPTION 'community_report_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
      RAISE EXCEPTION 'community_report_review_not_authorized' USING ERRCODE = '42501';
    END IF;
    IF char_length(COALESCE(NEW.admin_notes, '')) > 2000 THEN
      RAISE EXCEPTION 'community_report_admin_notes_too_long' USING ERRCODE = '22023';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_actor_profile_id := private.current_active_profile_id();
      IF v_actor_profile_id IS NULL THEN
        RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
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

REVOKE ALL ON FUNCTION private.guard_community_report_review() FROM PUBLIC;

COMMENT ON TABLE public.community_user_moderation_actions IS
  'Append-only SSOT for community warnings, suspensions and bans.';
COMMENT ON FUNCTION public.apply_community_user_moderation_action(UUID, TEXT, TEXT) IS
  'Admin-only atomic moderation action; actor and target auth identity are derived server-side.';
