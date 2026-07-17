-- Production hardening for canonical community social writes.
--
-- Security invariants:
--   * browser input never decides actor identity, counters or moderation actor;
--   * local content writes require an active profile and verified residence;
--   * social counters are derived atomically from relation tables;
--   * group roles cannot be self-assigned;
--   * private group data fails closed;
--   * audit records never copy post, comment or message content.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Canonical identity and authorization helpers (not exposed through RPC).
-- --------------------------------------------------------------------------

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
    AND p.is_suspended = FALSE
    AND p.suspended = FALSE
    AND (p.suspended_until IS NULL OR p.suspended_until <= now())
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
        AND p.is_suspended = FALSE
        AND p.suspended = FALSE
        AND (p.suspended_until IS NULL OR p.suspended_until <= now())
    );
$$;

CREATE OR REPLACE FUNCTION private.auth_has_verified_residence(
  p_profile_id UUID,
  p_location_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT private.auth_owns_active_profile(p_profile_id)
    AND p_location_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_residences ur
      JOIN public.profiles p ON p.user_id = ur.user_id
      JOIN public.locations l ON l.id = ur.location_id
      WHERE p.id = p_profile_id
        AND ur.user_id = auth.uid()
        AND ur.location_id = p_location_id
        AND ur.is_verified = TRUE
        AND l.status::TEXT = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION private.auth_is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members_new gm
    JOIN public.profiles p ON p.id = gm.member_profile_id
    WHERE gm.group_id = p_group_id
      AND p.user_id = auth.uid()
      AND p.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION private.auth_is_group_admin(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT COALESCE(private.is_admin_user(auth.uid()), FALSE)
    OR EXISTS (
      SELECT 1
      FROM public.group_members_new gm
      JOIN public.profiles p ON p.id = gm.member_profile_id
      JOIN public.groups g ON g.id = gm.group_id
      WHERE gm.group_id = p_group_id
        AND p.user_id = auth.uid()
        AND p.is_active = TRUE
        AND gm.role::TEXT = 'admin'
        AND private.auth_has_verified_residence(p.id, g.location_id)
    );
$$;

CREATE OR REPLACE FUNCTION private.auth_can_moderate_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT COALESCE(private.is_admin_user(auth.uid()), FALSE)
    OR EXISTS (
      SELECT 1
      FROM public.group_members_new gm
      JOIN public.profiles p ON p.id = gm.member_profile_id
      JOIN public.groups g ON g.id = gm.group_id
      WHERE gm.group_id = p_group_id
        AND p.user_id = auth.uid()
        AND p.is_active = TRUE
        AND gm.role::TEXT IN ('admin', 'moderator')
        AND private.auth_has_verified_residence(p.id, g.location_id)
    );
$$;

CREATE OR REPLACE FUNCTION private.auth_can_view_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = p_group_id
      AND g.status::TEXT = 'active'
      AND (
        g.visibility = 'public'
        OR g.created_by = private.current_active_profile_id()
        OR private.auth_is_group_member(g.id)
        OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
      )
  );
$$;

REVOKE ALL ON FUNCTION private.current_active_profile_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_owns_active_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_has_verified_residence(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_group_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_group_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_can_moderate_group(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_can_view_group(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.current_active_profile_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_owns_active_profile(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_has_verified_residence(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_is_group_member(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_is_group_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_can_moderate_group(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_can_view_group(UUID) TO anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Canonical relation tables and append-oriented audit store.
-- --------------------------------------------------------------------------

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS shares_count INTEGER NOT NULL DEFAULT 0
    CHECK (shares_count >= 0);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  liker_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_likes
  ADD COLUMN IF NOT EXISTS liker_profile_id UUID;

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comment_likes'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE $sql$
      UPDATE public.comment_likes cl
      SET liker_profile_id = COALESCE(
        (SELECT p.id FROM public.profiles p WHERE p.id = cl.user_id LIMIT 1),
        (
          SELECT p.id
          FROM public.profiles p
          WHERE p.user_id = cl.user_id
          ORDER BY p.is_active DESC, p.created_at ASC
          LIMIT 1
        )
      )
      WHERE cl.liker_profile_id IS NULL
    $sql$;

    IF EXISTS (
      SELECT 1 FROM public.comment_likes WHERE liker_profile_id IS NULL
    ) THEN
      RAISE EXCEPTION
        'comment_likes contains rows whose legacy identity cannot be mapped to a profile';
    END IF;

    -- Existing policies may reference the legacy identity column. They are
    -- recreated from the canonical profile-based policy set later below.
    FOR r IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'comment_likes'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.comment_likes', r.policyname);
    END LOOP;

    FOR r IN
      SELECT c.conname
      FROM pg_constraint c
      WHERE c.conrelid = 'public.comment_likes'::regclass
        AND pg_get_constraintdef(c.oid) ILIKE '%user_id%'
    LOOP
      EXECUTE format('ALTER TABLE public.comment_likes DROP CONSTRAINT %I', r.conname);
    END LOOP;

    ALTER TABLE public.comment_likes DROP COLUMN user_id;
  END IF;
END $$;

ALTER TABLE public.comment_likes
  ALTER COLUMN liker_profile_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS comment_likes_liker_profile_id_fkey,
  ADD CONSTRAINT comment_likes_liker_profile_id_fkey
    FOREIGN KEY (liker_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS comment_likes_comment_profile_key,
  ADD CONSTRAINT comment_likes_comment_profile_key
    UNIQUE (comment_id, liker_profile_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_profile
  ON public.comment_likes (liker_profile_id, comment_id);

DROP FUNCTION IF EXISTS public.toggle_comment_like(UUID, UUID);

CREATE TABLE IF NOT EXISTS public.post_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  sharer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT post_share_events_unique_profile UNIQUE (post_id, sharer_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_post_share_events_profile_created
  ON public.post_share_events (sharer_profile_id, created_at DESC);

-- security-authority: internal-table public.community_social_audit_log
CREATE TABLE IF NOT EXISTS public.community_social_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_social_audit_action_check
    CHECK (action IN ('insert', 'update', 'delete')),
  CONSTRAINT community_social_audit_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_community_social_audit_target
  ON public.community_social_audit_log (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_social_audit_actor
  ON public.community_social_audit_log (actor_profile_id, created_at DESC)
  WHERE actor_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_social_audit_location
  ON public.community_social_audit_log (location_id, created_at DESC)
  WHERE location_id IS NOT NULL;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_social_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_social_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.community_social_audit_log TO service_role;

-- --------------------------------------------------------------------------
-- Server-side guards for posts and comments.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.guard_community_post_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_actor_profile_id UUID;
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin')
     OR COALESCE(current_setting('acheguese.internal_social_write', TRUE), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.author_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;

    IF NOT private.auth_has_verified_residence(NEW.author_profile_id, NEW.location_id) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext('community_post_rate'),
      hashtext(NEW.author_profile_id::TEXT)
    );
    SELECT count(*) INTO v_recent_count
    FROM public.posts p
    WHERE p.author_profile_id = NEW.author_profile_id
      AND p.created_at >= now() - interval '24 hours';
    IF v_recent_count >= 5 THEN
      RAISE EXCEPTION 'post_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;

    NEW.likes_count := 0;
    NEW.comments_count := 0;
    NEW.shares_count := 0;
    NEW.confirmations_count := 0;
    NEW.is_verified := FALSE;
    NEW.is_hidden := FALSE;
    NEW.is_removed := FALSE;
    NEW.removed_reason := NULL;
    NEW.removed_at := NULL;
    NEW.removed_by := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.author_profile_id IS DISTINCT FROM OLD.author_profile_id
       OR NEW.location_id IS DISTINCT FROM OLD.location_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.type IS DISTINCT FROM OLD.type
       OR NEW.content_intent IS DISTINCT FROM OLD.content_intent
       OR NEW.display_format IS DISTINCT FROM OLD.display_format
       OR NEW.distribution_channels IS DISTINCT FROM OLD.distribution_channels
       OR NEW.content_payload IS DISTINCT FROM OLD.content_payload
       OR NEW.reach IS DISTINCT FROM OLD.reach THEN
      RAISE EXCEPTION 'post_identity_is_immutable' USING ERRCODE = '42501';
    END IF;

    IF v_is_admin THEN
      IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
         OR NEW.is_removed IS DISTINCT FROM OLD.is_removed
         OR NEW.removed_reason IS DISTINCT FROM OLD.removed_reason
         OR NEW.removed_at IS DISTINCT FROM OLD.removed_at THEN
        v_actor_profile_id := private.current_active_profile_id();
        IF v_actor_profile_id IS NULL THEN
          RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
        END IF;
        NEW.removed_by := CASE
          WHEN NEW.is_hidden OR NEW.is_removed THEN v_actor_profile_id
          ELSE NULL
        END;
        NEW.removed_at := CASE
          WHEN NEW.is_removed THEN COALESCE(NEW.removed_at, now())
          ELSE NULL
        END;
      END IF;
    ELSE
      IF NOT private.auth_owns_active_profile(OLD.author_profile_id)
         OR NOT private.auth_has_verified_residence(OLD.author_profile_id, OLD.location_id) THEN
        RAISE EXCEPTION 'post_update_not_authorized' USING ERRCODE = '42501';
      END IF;

      IF NEW.likes_count IS DISTINCT FROM OLD.likes_count
         OR NEW.comments_count IS DISTINCT FROM OLD.comments_count
         OR NEW.shares_count IS DISTINCT FROM OLD.shares_count
         OR NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count
         OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
         OR NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
         OR NEW.is_removed IS DISTINCT FROM OLD.is_removed
         OR NEW.removed_reason IS DISTINCT FROM OLD.removed_reason
         OR NEW.removed_at IS DISTINCT FROM OLD.removed_at
         OR NEW.removed_by IS DISTINCT FROM OLD.removed_by THEN
        RAISE EXCEPTION 'protected_post_fields_are_server_owned' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF char_length(trim(COALESCE(NEW.content, ''))) < 10
     OR char_length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'invalid_post_content_length' USING ERRCODE = '22023';
  END IF;

  IF NEW.images IS NOT NULL AND (
    jsonb_typeof(NEW.images) <> 'array'
    OR jsonb_array_length(NEW.images) > 4
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(NEW.images) image(value)
      WHERE jsonb_typeof(image.value) <> 'string'
        OR trim(BOTH '"' FROM image.value::TEXT) !~* '^https://'
        OR char_length(trim(BOTH '"' FROM image.value::TEXT)) > 2048
    )
  ) THEN
    RAISE EXCEPTION 'invalid_post_images' USING ERRCODE = '22023';
  END IF;

  IF (NEW.image_url IS NOT NULL AND (
        NEW.image_url !~* '^https://' OR char_length(NEW.image_url) > 2048
      ))
     OR (NEW.video_url IS NOT NULL AND (
        NEW.video_url !~* '^https://' OR char_length(NEW.video_url) > 2048
      )) THEN
    RAISE EXCEPTION 'invalid_post_media_url' USING ERRCODE = '22023';
  END IF;

  IF NEW.tags IS NOT NULL AND (
    jsonb_typeof(NEW.tags) <> 'array'
    OR jsonb_array_length(NEW.tags) > 5
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(NEW.tags) tag(value)
      WHERE jsonb_typeof(tag.value) <> 'string'
        OR char_length(trim(BOTH '"' FROM tag.value::TEXT)) > 30
    )
  ) THEN
    RAISE EXCEPTION 'invalid_post_tags' USING ERRCODE = '22023';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_community_comment_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_actor_profile_id UUID;
  v_location_id UUID;
  v_parent_id UUID;
  v_parent_post_id UUID;
  v_depth INTEGER := 0;
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin')
     OR COALESCE(current_setting('acheguese.internal_social_write', TRUE), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.author_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;

    SELECT p.location_id INTO v_location_id
    FROM public.posts p
    WHERE p.id = NEW.post_id
      AND p.is_published = TRUE
      AND p.is_hidden = FALSE
      AND p.is_removed = FALSE;
    IF v_location_id IS NULL THEN
      RAISE EXCEPTION 'visible_post_required' USING ERRCODE = '42501';
    END IF;

    IF NOT private.auth_has_verified_residence(NEW.author_profile_id, v_location_id) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;

    v_parent_id := NEW.parent_id;
    WHILE v_parent_id IS NOT NULL LOOP
      SELECT c.parent_id, c.post_id
      INTO v_parent_id, v_parent_post_id
      FROM public.comments c
      WHERE c.id = v_parent_id
        AND c.is_removed = FALSE
        AND c.is_hidden = FALSE;

      IF NOT FOUND OR v_parent_post_id IS DISTINCT FROM NEW.post_id THEN
        RAISE EXCEPTION 'invalid_comment_parent' USING ERRCODE = '23514';
      END IF;

      v_depth := v_depth + 1;
      IF v_depth > 5 THEN
        RAISE EXCEPTION 'comment_tree_depth_exceeded' USING ERRCODE = '23514';
      END IF;
    END LOOP;

    PERFORM pg_advisory_xact_lock(
      hashtext('community_comment_rate'),
      hashtext(NEW.author_profile_id::TEXT)
    );
    SELECT count(*) INTO v_recent_count
    FROM public.comments c
    WHERE c.author_profile_id = NEW.author_profile_id
      AND c.created_at >= now() - interval '1 hour';
    IF v_recent_count >= 10 THEN
      RAISE EXCEPTION 'comment_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;

    NEW.likes_count := 0;
    NEW.replies_count := 0;
    NEW.is_hidden := FALSE;
    NEW.is_removed := FALSE;
    NEW.removed_reason := NULL;
    NEW.removed_at := NULL;
    NEW.removed_by := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.post_id IS DISTINCT FROM OLD.post_id
       OR NEW.author_profile_id IS DISTINCT FROM OLD.author_profile_id
       OR NEW.parent_id IS DISTINCT FROM OLD.parent_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.professional_id IS DISTINCT FROM OLD.professional_id THEN
      RAISE EXCEPTION 'comment_identity_is_immutable' USING ERRCODE = '42501';
    END IF;

    IF v_is_admin THEN
      IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
         OR NEW.is_removed IS DISTINCT FROM OLD.is_removed
         OR NEW.removed_reason IS DISTINCT FROM OLD.removed_reason
         OR NEW.removed_at IS DISTINCT FROM OLD.removed_at THEN
        v_actor_profile_id := private.current_active_profile_id();
        IF v_actor_profile_id IS NULL THEN
          RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
        END IF;
        NEW.removed_by := CASE
          WHEN NEW.is_hidden OR NEW.is_removed THEN v_actor_profile_id
          ELSE NULL
        END;
        NEW.removed_at := CASE
          WHEN NEW.is_removed THEN COALESCE(NEW.removed_at, now())
          ELSE NULL
        END;
      END IF;
    ELSE
      SELECT p.location_id INTO v_location_id
      FROM public.posts p WHERE p.id = OLD.post_id;
      IF NOT private.auth_owns_active_profile(OLD.author_profile_id)
         OR NOT private.auth_has_verified_residence(OLD.author_profile_id, v_location_id) THEN
        RAISE EXCEPTION 'comment_update_not_authorized' USING ERRCODE = '42501';
      END IF;

      IF NEW.likes_count IS DISTINCT FROM OLD.likes_count
         OR NEW.replies_count IS DISTINCT FROM OLD.replies_count
         OR NEW.is_best_answer IS DISTINCT FROM OLD.is_best_answer
         OR NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
         OR NEW.is_removed IS DISTINCT FROM OLD.is_removed
         OR NEW.removed_reason IS DISTINCT FROM OLD.removed_reason
         OR NEW.removed_at IS DISTINCT FROM OLD.removed_at
         OR NEW.removed_by IS DISTINCT FROM OLD.removed_by THEN
        RAISE EXCEPTION 'protected_comment_fields_are_server_owned' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF char_length(trim(COALESCE(NEW.content, ''))) < 1
     OR char_length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'invalid_comment_content_length' USING ERRCODE = '22023';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_community_post_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_community_comment_write() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_community_post_write ON public.posts;
CREATE TRIGGER trg_guard_community_post_write
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION private.guard_community_post_write();

DROP TRIGGER IF EXISTS trg_guard_community_comment_write ON public.comments;
CREATE TRIGGER trg_guard_community_comment_write
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION private.guard_community_comment_write();

-- --------------------------------------------------------------------------
-- Atomic derived counters.
-- --------------------------------------------------------------------------

DO $$
DECLARE
  trigger_row RECORD;
BEGIN
  FOR trigger_row IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'public.comment_likes'::regclass
      AND NOT t.tgisinternal
      AND p.proname = 'sync_comment_likes_count'
  LOOP
    EXECUTE format('DROP TRIGGER %I ON public.comment_likes', trigger_row.tgname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION private.sync_community_social_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_previous_setting TEXT := COALESCE(
    current_setting('acheguese.internal_social_write', TRUE),
    ''
  );
  v_delta INTEGER;
BEGIN
  PERFORM set_config('acheguese.internal_social_write', 'on', TRUE);

  IF TG_TABLE_NAME = 'post_likes_new' THEN
    v_delta := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END;
    UPDATE public.posts
    SET likes_count = GREATEST(likes_count + v_delta, 0)
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  ELSIF TG_TABLE_NAME = 'post_share_events' THEN
    UPDATE public.posts
    SET shares_count = shares_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_TABLE_NAME = 'comment_likes' THEN
    v_delta := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END;
    UPDATE public.comments
    SET likes_count = GREATEST(likes_count + v_delta, 0)
    WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.is_hidden = FALSE AND NEW.is_removed = FALSE THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
        IF NEW.parent_id IS NOT NULL THEN
          UPDATE public.comments
          SET replies_count = replies_count + 1
          WHERE id = NEW.parent_id;
        END IF;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.is_hidden = FALSE AND OLD.is_removed = FALSE THEN
        UPDATE public.posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.post_id;
        IF OLD.parent_id IS NOT NULL THEN
          UPDATE public.comments
          SET replies_count = GREATEST(replies_count - 1, 0)
          WHERE id = OLD.parent_id;
        END IF;
      END IF;
    ELSIF (OLD.is_hidden OR OLD.is_removed) IS DISTINCT FROM
          (NEW.is_hidden OR NEW.is_removed) THEN
      v_delta := CASE
        WHEN NEW.is_hidden = FALSE AND NEW.is_removed = FALSE THEN 1
        ELSE -1
      END;
      UPDATE public.posts
      SET comments_count = GREATEST(comments_count + v_delta, 0)
      WHERE id = NEW.post_id;
      IF NEW.parent_id IS NOT NULL THEN
        UPDATE public.comments
        SET replies_count = GREATEST(replies_count + v_delta, 0)
        WHERE id = NEW.parent_id;
      END IF;
    END IF;
  END IF;

  PERFORM set_config('acheguese.internal_social_write', v_previous_setting, TRUE);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_community_social_counters() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_sync_post_likes_count ON public.post_likes_new;
CREATE TRIGGER trg_sync_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes_new
  FOR EACH ROW EXECUTE FUNCTION private.sync_community_social_counters();

DROP TRIGGER IF EXISTS trg_sync_post_shares_count ON public.post_share_events;
CREATE TRIGGER trg_sync_post_shares_count
  AFTER INSERT ON public.post_share_events
  FOR EACH ROW EXECUTE FUNCTION private.sync_community_social_counters();

DROP TRIGGER IF EXISTS trg_sync_comment_likes_count_v2 ON public.comment_likes;
CREATE TRIGGER trg_sync_comment_likes_count_v2
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION private.sync_community_social_counters();

DROP TRIGGER IF EXISTS trg_sync_post_comments_count ON public.comments;
CREATE TRIGGER trg_sync_post_comments_count
  AFTER INSERT OR UPDATE OF is_hidden, is_removed OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION private.sync_community_social_counters();

CREATE OR REPLACE FUNCTION private.guard_social_interaction_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_target_type TEXT;
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'post_likes_new' THEN
    v_profile_id := COALESCE(NEW.liker_profile_id, OLD.liker_profile_id);
    v_target_type := 'post_like';
  ELSIF TG_TABLE_NAME = 'comment_likes' THEN
    v_profile_id := COALESCE(NEW.liker_profile_id, OLD.liker_profile_id);
    v_target_type := 'comment_like';
  ELSIF TG_TABLE_NAME = 'saved_posts_new' THEN
    v_profile_id := COALESCE(NEW.saver_profile_id, OLD.saver_profile_id);
    v_target_type := 'post_save';
  ELSE
    v_profile_id := NEW.sharer_profile_id;
    v_target_type := 'post_share';
  END IF;

  IF NOT private.auth_owns_active_profile(v_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('community_social_interaction_rate'),
    hashtext(v_profile_id::TEXT)
  );
  SELECT count(*) INTO v_recent_count
  FROM public.community_social_audit_log audit
  WHERE audit.actor_profile_id = v_profile_id
    AND audit.target_type IN ('post_like', 'comment_like', 'post_save', 'post_share')
    AND audit.created_at >= now() - interval '1 minute';

  IF v_recent_count >= 60 THEN
    RAISE EXCEPTION 'social_interaction_rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_social_interaction_rate() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_post_like_rate ON public.post_likes_new;
CREATE TRIGGER trg_guard_post_like_rate
  BEFORE INSERT OR DELETE ON public.post_likes_new
  FOR EACH ROW EXECUTE FUNCTION private.guard_social_interaction_rate();

DROP TRIGGER IF EXISTS trg_guard_comment_like_rate ON public.comment_likes;
CREATE TRIGGER trg_guard_comment_like_rate
  BEFORE INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION private.guard_social_interaction_rate();

DROP TRIGGER IF EXISTS trg_guard_saved_post_rate ON public.saved_posts_new;
CREATE TRIGGER trg_guard_saved_post_rate
  BEFORE INSERT OR DELETE ON public.saved_posts_new
  FOR EACH ROW EXECUTE FUNCTION private.guard_social_interaction_rate();

DROP TRIGGER IF EXISTS trg_guard_post_share_rate ON public.post_share_events;
CREATE TRIGGER trg_guard_post_share_rate
  BEFORE INSERT ON public.post_share_events
  FOR EACH ROW EXECUTE FUNCTION private.guard_social_interaction_rate();

-- --------------------------------------------------------------------------
-- Group, membership, message and report guards.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.guard_community_group_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.created_by) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;
    IF NEW.location_id IS NULL
       OR NOT private.auth_has_verified_residence(NEW.created_by, NEW.location_id) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;
    IF NEW.status::TEXT <> 'active' OR NEW.visibility = 'hidden' THEN
      RAISE EXCEPTION 'group_initial_state_not_allowed' USING ERRCODE = '42501';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext('community_group_rate'),
      hashtext(NEW.created_by::TEXT)
    );
    SELECT count(*) INTO v_recent_count
    FROM public.groups g
    WHERE g.created_by = NEW.created_by
      AND g.created_at >= now() - interval '24 hours';
    IF v_recent_count >= 3 THEN
      RAISE EXCEPTION 'group_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.created_by IS DISTINCT FROM OLD.created_by
       OR NEW.location_id IS DISTINCT FROM OLD.location_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'group_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT private.auth_is_group_admin(OLD.id) THEN
      RAISE EXCEPTION 'group_update_not_authorized' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF char_length(trim(COALESCE(NEW.name, ''))) < 3
     OR char_length(NEW.name) > 80
     OR char_length(COALESCE(NEW.description, '')) > 1000
     OR char_length(COALESCE(NEW.rules, '')) > 5000 THEN
    RAISE EXCEPTION 'invalid_group_content_length' USING ERRCODE = '22023';
  END IF;

  IF NEW.is_private THEN
    IF NEW.visibility = 'public' THEN NEW.visibility := 'private'; END IF;
  ELSIF NEW.visibility = 'private' THEN
    NEW.is_private := TRUE;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.bootstrap_group_creator_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.group_members_new (group_id, member_profile_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin'::public.group_member_role)
    ON CONFLICT (group_id, member_profile_id)
    DO UPDATE SET role = 'admin'::public.group_member_role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_group_membership_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_group public.groups%ROWTYPE;
  v_admin_count INTEGER;
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.member_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;
    IF NEW.role::TEXT <> 'member' THEN
      RAISE EXCEPTION 'group_role_cannot_be_self_assigned' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_group FROM public.groups WHERE id = NEW.group_id;
    IF NOT FOUND OR v_group.status::TEXT <> 'active' OR v_group.join_policy <> 'open' THEN
      RAISE EXCEPTION 'group_is_not_open_for_direct_join' USING ERRCODE = '42501';
    END IF;
    IF NOT private.auth_has_verified_residence(
      NEW.member_profile_id,
      v_group.location_id
    ) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext('community_group_join_rate'),
      hashtext(NEW.member_profile_id::TEXT)
    );
    SELECT count(*) INTO v_recent_count
    FROM public.group_members_new gm
    WHERE gm.member_profile_id = NEW.member_profile_id
      AND gm.joined_at >= now() - interval '24 hours';
    IF v_recent_count >= 20 THEN
      RAISE EXCEPTION 'group_join_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.group_id IS DISTINCT FROM OLD.group_id
       OR NEW.member_profile_id IS DISTINCT FROM OLD.member_profile_id
       OR NEW.joined_at IS DISTINCT FROM OLD.joined_at THEN
      RAISE EXCEPTION 'group_membership_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT private.auth_is_group_admin(OLD.group_id) THEN
      RAISE EXCEPTION 'only_group_admin_can_change_roles' USING ERRCODE = '42501';
    END IF;
    IF OLD.role::TEXT = 'admin' AND NEW.role::TEXT <> 'admin' THEN
      SELECT count(*) INTO v_admin_count
      FROM public.group_members_new gm
      WHERE gm.group_id = OLD.group_id AND gm.role::TEXT = 'admin';
      IF v_admin_count <= 1 THEN
        RAISE EXCEPTION 'group_must_keep_an_admin' USING ERRCODE = '23514';
      END IF;
    END IF;
  ELSE
    IF NOT private.auth_owns_active_profile(OLD.member_profile_id)
       AND NOT private.auth_is_group_admin(OLD.group_id) THEN
      RAISE EXCEPTION 'group_leave_not_authorized' USING ERRCODE = '42501';
    END IF;
    IF OLD.role::TEXT = 'admin' THEN
      SELECT count(*) INTO v_admin_count
      FROM public.group_members_new gm
      WHERE gm.group_id = OLD.group_id AND gm.role::TEXT = 'admin';
      IF v_admin_count <= 1 THEN
        RAISE EXCEPTION 'group_must_keep_an_admin' USING ERRCODE = '23514';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_group_message_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_group public.groups%ROWTYPE;
  v_role TEXT;
  v_recent_count INTEGER;
  v_reply_message_id UUID;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.sender_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_group FROM public.groups WHERE id = NEW.group_id;
    IF NOT FOUND OR v_group.status::TEXT <> 'active' THEN
      RAISE EXCEPTION 'active_group_required' USING ERRCODE = '42501';
    END IF;
    SELECT gm.role::TEXT INTO v_role
    FROM public.group_members_new gm
    WHERE gm.group_id = NEW.group_id
      AND gm.member_profile_id = NEW.sender_profile_id;
    IF v_role IS NULL THEN
      RAISE EXCEPTION 'group_membership_required' USING ERRCODE = '42501';
    END IF;
    IF (v_group.posting_policy = 'admins' AND v_role <> 'admin')
       OR (v_group.posting_policy = 'moderators'
           AND v_role NOT IN ('admin', 'moderator')) THEN
      RAISE EXCEPTION 'group_posting_policy_denied' USING ERRCODE = '42501';
    END IF;
    IF NOT private.auth_has_verified_residence(
      NEW.sender_profile_id,
      v_group.location_id
    ) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;
    IF NEW.message_type = 'system' THEN
      RAISE EXCEPTION 'system_messages_are_server_only' USING ERRCODE = '42501';
    END IF;
    IF v_group.media_policy = 'text_only' AND NEW.message_type <> 'text' THEN
      RAISE EXCEPTION 'group_media_policy_denied' USING ERRCODE = '42501';
    END IF;
    IF NEW.message_type = 'image' AND (
      NEW.media_url IS NULL
      OR NEW.media_url !~* '^https://'
      OR COALESCE(NEW.media_mime_type, '') !~* '^image/(jpeg|png|webp)$'
    ) THEN
      RAISE EXCEPTION 'invalid_group_image' USING ERRCODE = '22023';
    END IF;
    IF NEW.message_type = 'audio' AND (
      NEW.media_url IS NULL
      OR NEW.media_url !~* '^https://'
      OR COALESCE(NEW.media_mime_type, '') !~* '^audio/(mpeg|ogg|webm|mp4)$'
      OR NEW.audio_duration_seconds IS NULL
      OR NEW.audio_duration_seconds NOT BETWEEN 1 AND 600
    ) THEN
      RAISE EXCEPTION 'invalid_group_audio' USING ERRCODE = '22023';
    END IF;

    IF NEW.metadata ? 'reply_to_message_id' THEN
      BEGIN
        v_reply_message_id := (NEW.metadata->>'reply_to_message_id')::UUID;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'invalid_reply_message_id' USING ERRCODE = '22023';
      END;
      IF NOT EXISTS (
        SELECT 1
        FROM public.group_messages_new reply
        WHERE reply.id = v_reply_message_id
          AND reply.group_id = NEW.group_id
      ) THEN
        RAISE EXCEPTION 'invalid_reply_message_id' USING ERRCODE = '23514';
      END IF;
      NEW.metadata := (NEW.metadata - 'reply_preview' - 'reply_author_name')
        || jsonb_build_object('reply_to_message_id', v_reply_message_id);
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext('community_group_message_rate'),
      hashtext(NEW.sender_profile_id::TEXT)
    );
    SELECT count(*) INTO v_recent_count
    FROM public.group_messages_new gm
    WHERE gm.sender_profile_id = NEW.sender_profile_id
      AND gm.created_at >= now() - interval '1 minute';
    IF v_recent_count >= 30 THEN
      RAISE EXCEPTION 'group_message_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.group_id IS DISTINCT FROM OLD.group_id
       OR NEW.sender_profile_id IS DISTINCT FROM OLD.sender_profile_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.message_type IS DISTINCT FROM OLD.message_type
       OR NEW.media_url IS DISTINCT FROM OLD.media_url
       OR NEW.media_mime_type IS DISTINCT FROM OLD.media_mime_type
       OR NEW.audio_duration_seconds IS DISTINCT FROM OLD.audio_duration_seconds THEN
      RAISE EXCEPTION 'group_message_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT private.auth_owns_active_profile(OLD.sender_profile_id) THEN
      RAISE EXCEPTION 'only_message_author_can_edit' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF char_length(trim(COALESCE(NEW.content, ''))) < 1
     OR char_length(NEW.content) > 4000
     OR jsonb_typeof(NEW.metadata) <> 'object'
     OR pg_column_size(NEW.metadata) > 8192 THEN
    RAISE EXCEPTION 'invalid_group_message_payload' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_group_message_report_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_group_id UUID;
  v_sender_profile_id UUID;
  v_reviewer_profile_id UUID;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.reporter_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;
    SELECT m.group_id, m.sender_profile_id
    INTO v_group_id, v_sender_profile_id
    FROM public.group_messages_new m WHERE m.id = NEW.message_id;
    IF v_group_id IS NULL OR NOT private.auth_is_group_member(v_group_id) THEN
      RAISE EXCEPTION 'reportable_group_message_required' USING ERRCODE = '42501';
    END IF;
    IF v_sender_profile_id = NEW.reporter_profile_id THEN
      RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
    END IF;
    NEW.group_id := v_group_id;
    NEW.status := 'pending';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.moderation_history := '[]'::jsonb;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.group_id IS DISTINCT FROM OLD.group_id
       OR NEW.message_id IS DISTINCT FROM OLD.message_id
       OR NEW.reporter_profile_id IS DISTINCT FROM OLD.reporter_profile_id
       OR NEW.reason IS DISTINCT FROM OLD.reason
       OR NEW.details IS DISTINCT FROM OLD.details
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'group_report_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT private.auth_can_moderate_group(OLD.group_id) THEN
      RAISE EXCEPTION 'group_report_review_not_authorized' USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_reviewer_profile_id := private.current_active_profile_id();
      IF v_reviewer_profile_id IS NULL THEN
        RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
      END IF;
      NEW.reviewed_by := v_reviewer_profile_id;
      NEW.reviewed_at := now();
      NEW.moderation_history := COALESCE(OLD.moderation_history, '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object(
          'at', now(),
          'status', NEW.status,
          'moderator_profile_id', v_reviewer_profile_id
        ));
    ELSE
      NEW.reviewed_by := OLD.reviewed_by;
      NEW.reviewed_at := OLD.reviewed_at;
      NEW.moderation_history := OLD.moderation_history;
    END IF;
  END IF;

  IF char_length(trim(COALESCE(NEW.reason, ''))) < 3
     OR char_length(NEW.reason) > 120
     OR char_length(COALESCE(NEW.details, '')) > 2000 THEN
    RAISE EXCEPTION 'invalid_group_report_payload' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_community_report_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reviewer_profile_id UUID;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.reporter_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;
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
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_reviewer_profile_id := private.current_active_profile_id();
      IF v_reviewer_profile_id IS NULL THEN
        RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
      END IF;
      NEW.reviewed_by := v_reviewer_profile_id;
      NEW.reviewed_at := now();
    ELSE
      NEW.reviewed_by := OLD.reviewed_by;
      NEW.reviewed_at := OLD.reviewed_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_community_group_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.bootstrap_group_creator_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_group_membership_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_group_message_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_group_message_report_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_community_report_review() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_community_group_write ON public.groups;
CREATE TRIGGER trg_guard_community_group_write
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION private.guard_community_group_write();

DROP TRIGGER IF EXISTS trg_bootstrap_group_creator_membership ON public.groups;
CREATE TRIGGER trg_bootstrap_group_creator_membership
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION private.bootstrap_group_creator_membership();

DROP TRIGGER IF EXISTS trg_guard_group_membership_write ON public.group_members_new;
CREATE TRIGGER trg_guard_group_membership_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.group_members_new
  FOR EACH ROW EXECUTE FUNCTION private.guard_group_membership_write();

DROP TRIGGER IF EXISTS trg_guard_group_message_write ON public.group_messages_new;
CREATE TRIGGER trg_guard_group_message_write
  BEFORE INSERT OR UPDATE ON public.group_messages_new
  FOR EACH ROW EXECUTE FUNCTION private.guard_group_message_write();

DROP TRIGGER IF EXISTS trg_guard_group_message_report_write ON public.group_message_reports;
CREATE TRIGGER trg_guard_group_message_report_write
  BEFORE INSERT OR UPDATE ON public.group_message_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_group_message_report_write();

DROP TRIGGER IF EXISTS trg_guard_community_report_review ON public.community_reports;
CREATE TRIGGER trg_guard_community_report_review
  BEFORE INSERT OR UPDATE ON public.community_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_community_report_review();

-- Existing creators become the initial canonical admins before strict RLS is
-- installed. This is deterministic and idempotent.
INSERT INTO public.group_members_new (group_id, member_profile_id, role)
SELECT g.id, g.created_by, 'admin'::public.group_member_role
FROM public.groups g
WHERE g.created_by IS NOT NULL
ON CONFLICT (group_id, member_profile_id)
DO UPDATE SET role = 'admin'::public.group_member_role;

-- --------------------------------------------------------------------------
-- Definitive least-privilege RLS policies.
-- --------------------------------------------------------------------------

DO $$
DECLARE
  policy_row RECORD;
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'posts',
    'comments',
    'post_likes_new',
    'saved_posts_new',
    'comment_likes',
    'post_share_events',
    'groups',
    'group_members_new',
    'group_messages_new',
    'group_message_reports'
  ] LOOP
    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format(
        'DROP POLICY %I ON public.%I',
        policy_row.policyname,
        table_name
      );
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_posts_public_read
  ON public.posts FOR SELECT TO anon, authenticated
  USING (is_published = TRUE AND is_hidden = FALSE AND is_removed = FALSE);
CREATE POLICY community_posts_owner_or_admin_read
  ON public.posts FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
CREATE POLICY community_posts_verified_insert
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_has_verified_residence(author_profile_id, location_id)
  );
CREATE POLICY community_posts_owner_or_admin_update
  ON public.posts FOR UPDATE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  )
  WITH CHECK (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
CREATE POLICY community_posts_owner_or_admin_delete
  ON public.posts FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

CREATE POLICY community_comments_visible_parent_read
  ON public.comments FOR SELECT TO anon, authenticated
  USING (
    is_hidden = FALSE
    AND is_removed = FALSE
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND p.is_published = TRUE
        AND p.is_hidden = FALSE
        AND p.is_removed = FALSE
    )
  );
CREATE POLICY community_comments_owner_or_admin_read
  ON public.comments FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
CREATE POLICY community_comments_verified_insert
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(author_profile_id)
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND private.auth_has_verified_residence(author_profile_id, p.location_id)
    )
  );
CREATE POLICY community_comments_owner_or_admin_update
  ON public.comments FOR UPDATE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  )
  WITH CHECK (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
CREATE POLICY community_comments_owner_or_admin_delete
  ON public.comments FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

CREATE POLICY post_likes_select_own
  ON public.post_likes_new FOR SELECT TO authenticated
  USING (private.auth_owns_active_profile(liker_profile_id));
CREATE POLICY post_likes_insert_own_visible
  ON public.post_likes_new FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(liker_profile_id)
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_likes_new.post_id
        AND p.is_published = TRUE AND p.is_hidden = FALSE AND p.is_removed = FALSE
    )
  );
CREATE POLICY post_likes_delete_own
  ON public.post_likes_new FOR DELETE TO authenticated
  USING (private.auth_owns_active_profile(liker_profile_id));

CREATE POLICY saved_posts_select_own
  ON public.saved_posts_new FOR SELECT TO authenticated
  USING (private.auth_owns_active_profile(saver_profile_id));
CREATE POLICY saved_posts_insert_own_visible
  ON public.saved_posts_new FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(saver_profile_id)
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = saved_posts_new.post_id
        AND p.is_published = TRUE AND p.is_hidden = FALSE AND p.is_removed = FALSE
    )
  );
CREATE POLICY saved_posts_delete_own
  ON public.saved_posts_new FOR DELETE TO authenticated
  USING (private.auth_owns_active_profile(saver_profile_id));

CREATE POLICY comment_likes_select_own
  ON public.comment_likes FOR SELECT TO authenticated
  USING (private.auth_owns_active_profile(liker_profile_id));
CREATE POLICY comment_likes_insert_own_visible
  ON public.comment_likes FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(liker_profile_id)
    AND EXISTS (
      SELECT 1
      FROM public.comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = comment_likes.comment_id
        AND c.is_hidden = FALSE AND c.is_removed = FALSE
        AND p.is_published = TRUE AND p.is_hidden = FALSE AND p.is_removed = FALSE
    )
  );
CREATE POLICY comment_likes_delete_own
  ON public.comment_likes FOR DELETE TO authenticated
  USING (private.auth_owns_active_profile(liker_profile_id));

CREATE POLICY post_share_events_select_own
  ON public.post_share_events FOR SELECT TO authenticated
  USING (private.auth_owns_active_profile(sharer_profile_id));
CREATE POLICY post_share_events_insert_own_visible
  ON public.post_share_events FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(sharer_profile_id)
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_share_events.post_id
        AND p.is_published = TRUE AND p.is_hidden = FALSE AND p.is_removed = FALSE
    )
  );

CREATE POLICY groups_public_read
  ON public.groups FOR SELECT TO anon, authenticated
  USING (status::TEXT = 'active' AND visibility = 'public');
CREATE POLICY groups_member_or_admin_read
  ON public.groups FOR SELECT TO authenticated
  USING (private.auth_can_view_group(id));
CREATE POLICY groups_verified_insert
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (
    created_by IS NOT NULL
    AND location_id IS NOT NULL
    AND private.auth_has_verified_residence(created_by, location_id)
  );
CREATE POLICY groups_admin_update
  ON public.groups FOR UPDATE TO authenticated
  USING (private.auth_is_group_admin(id))
  WITH CHECK (private.auth_is_group_admin(id));
CREATE POLICY groups_admin_delete
  ON public.groups FOR DELETE TO authenticated
  USING (private.auth_is_group_admin(id));

CREATE POLICY group_members_select_allowed
  ON public.group_members_new FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(member_profile_id)
    OR private.auth_can_moderate_group(group_id)
    OR (
      private.auth_is_group_member(group_id)
      AND EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members_new.group_id
          AND g.member_visibility IN ('public', 'members')
      )
    )
  );
CREATE POLICY group_members_insert_self
  ON public.group_members_new FOR INSERT TO authenticated
  WITH CHECK (
    role::TEXT = 'member'
    AND private.auth_owns_active_profile(member_profile_id)
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members_new.group_id
        AND g.status::TEXT = 'active'
        AND g.join_policy = 'open'
        AND private.auth_has_verified_residence(member_profile_id, g.location_id)
    )
  );
CREATE POLICY group_members_admin_update
  ON public.group_members_new FOR UPDATE TO authenticated
  USING (private.auth_is_group_admin(group_id))
  WITH CHECK (private.auth_is_group_admin(group_id));
CREATE POLICY group_members_self_or_admin_delete
  ON public.group_members_new FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(member_profile_id)
    OR private.auth_is_group_admin(group_id)
  );

CREATE POLICY group_messages_member_read
  ON public.group_messages_new FOR SELECT TO authenticated
  USING (private.auth_is_group_member(group_id));
CREATE POLICY group_messages_member_insert
  ON public.group_messages_new FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(sender_profile_id)
    AND private.auth_is_group_member(group_id)
  );
CREATE POLICY group_messages_author_update
  ON public.group_messages_new FOR UPDATE TO authenticated
  USING (private.auth_owns_active_profile(sender_profile_id))
  WITH CHECK (private.auth_owns_active_profile(sender_profile_id));
CREATE POLICY group_messages_author_or_moderator_delete
  ON public.group_messages_new FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(sender_profile_id)
    OR private.auth_can_moderate_group(group_id)
  );

CREATE POLICY group_message_reports_insert_own_member
  ON public.group_message_reports FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(reporter_profile_id)
    AND private.auth_is_group_member(group_id)
  );
CREATE POLICY group_message_reports_select_own_or_moderator
  ON public.group_message_reports FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(reporter_profile_id)
    OR private.auth_can_moderate_group(group_id)
  );
CREATE POLICY group_message_reports_moderator_update
  ON public.group_message_reports FOR UPDATE TO authenticated
  USING (private.auth_can_moderate_group(group_id))
  WITH CHECK (private.auth_can_moderate_group(group_id));

REVOKE ALL ON TABLE public.posts FROM anon, authenticated;
GRANT SELECT ON TABLE public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.posts TO authenticated;

REVOKE ALL ON TABLE public.comments FROM anon, authenticated;
GRANT SELECT ON TABLE public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO authenticated;

REVOKE ALL ON TABLE public.post_likes_new FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.post_likes_new TO authenticated;
REVOKE ALL ON TABLE public.saved_posts_new FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.saved_posts_new TO authenticated;
REVOKE ALL ON TABLE public.comment_likes FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.comment_likes TO authenticated;
REVOKE ALL ON TABLE public.post_share_events FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.post_share_events TO authenticated;

REVOKE ALL ON TABLE public.groups FROM anon, authenticated;
GRANT SELECT ON TABLE public.groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.groups TO authenticated;
REVOKE ALL ON TABLE public.group_members_new FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_members_new TO authenticated;
REVOKE ALL ON TABLE public.group_messages_new FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_messages_new TO authenticated;
REVOKE ALL ON TABLE public.group_message_reports FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.group_message_reports TO authenticated;

-- --------------------------------------------------------------------------
-- Reconcile derived counters before enabling the generic audit triggers.
-- --------------------------------------------------------------------------

DO $$
DECLARE
  v_previous_setting TEXT := COALESCE(
    current_setting('acheguese.internal_social_write', TRUE),
    ''
  );
BEGIN
  PERFORM set_config('acheguese.internal_social_write', 'on', TRUE);

  UPDATE public.posts p
  SET likes_count = (
        SELECT count(*)::INTEGER FROM public.post_likes_new l WHERE l.post_id = p.id
      ),
      comments_count = (
        SELECT count(*)::INTEGER
        FROM public.comments c
        WHERE c.post_id = p.id AND c.is_hidden = FALSE AND c.is_removed = FALSE
      ),
      shares_count = (
        SELECT count(*)::INTEGER FROM public.post_share_events s WHERE s.post_id = p.id
      );

  UPDATE public.comments c
  SET likes_count = (
        SELECT count(*)::INTEGER FROM public.comment_likes l WHERE l.comment_id = c.id
      ),
      replies_count = (
        SELECT count(*)::INTEGER
        FROM public.comments r
        WHERE r.parent_id = c.id AND r.is_hidden = FALSE AND r.is_removed = FALSE
      );

  PERFORM set_config('acheguese.internal_social_write', v_previous_setting, TRUE);
END $$;

-- --------------------------------------------------------------------------
-- Generic append-oriented audit. Payload intentionally excludes content/media.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.audit_community_social_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_new JSONB := CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  v_old JSONB := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  v_target_id UUID;
  v_location_id UUID;
  v_actor_profile_id UUID;
  v_group_id UUID;
BEGIN
  IF COALESCE(current_setting('acheguese.internal_social_write', TRUE), '') = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  v_target_id := COALESCE(v_new->>'id', v_old->>'id')::UUID;
  v_actor_profile_id := private.current_active_profile_id();

  IF TG_ARGV[0] = 'post' THEN
    v_location_id := COALESCE(v_new->>'location_id', v_old->>'location_id')::UUID;
  ELSIF TG_ARGV[0] IN ('comment', 'post_like', 'comment_like', 'post_save', 'post_share') THEN
    IF TG_ARGV[0] = 'comment' THEN
      SELECT p.location_id INTO v_location_id
      FROM public.posts p
      WHERE p.id = COALESCE(v_new->>'post_id', v_old->>'post_id')::UUID;
    ELSIF TG_ARGV[0] = 'comment_like' THEN
      SELECT p.location_id INTO v_location_id
      FROM public.comments c JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = COALESCE(v_new->>'comment_id', v_old->>'comment_id')::UUID;
    ELSE
      SELECT p.location_id INTO v_location_id
      FROM public.posts p
      WHERE p.id = COALESCE(v_new->>'post_id', v_old->>'post_id')::UUID;
    END IF;
  ELSIF TG_ARGV[0] = 'group' THEN
    v_location_id := COALESCE(v_new->>'location_id', v_old->>'location_id')::UUID;
  ELSE
    v_group_id := COALESCE(v_new->>'group_id', v_old->>'group_id')::UUID;
    SELECT g.location_id INTO v_location_id FROM public.groups g WHERE g.id = v_group_id;
  END IF;

  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    location_id,
    metadata
  ) VALUES (
    auth.uid(),
    v_actor_profile_id,
    lower(TG_OP),
    TG_ARGV[0],
    v_target_id,
    v_location_id,
    jsonb_strip_nulls(jsonb_build_object(
      'role', v_new->>'role',
      'previous_role', v_old->>'role',
      'status', v_new->>'status',
      'previous_status', v_old->>'status',
      'is_hidden', v_new->>'is_hidden',
      'is_removed', v_new->>'is_removed',
      'group_id', COALESCE(v_new->>'group_id', v_old->>'group_id'),
      'post_id', COALESCE(v_new->>'post_id', v_old->>'post_id'),
      'comment_id', COALESCE(v_new->>'comment_id', v_old->>'comment_id'),
      'message_id', COALESCE(v_new->>'message_id', v_old->>'message_id')
    ))
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.audit_community_social_change() FROM PUBLIC;

DO $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('posts', 'post'),
      ('comments', 'comment'),
      ('post_likes_new', 'post_like'),
      ('comment_likes', 'comment_like'),
      ('saved_posts_new', 'post_save'),
      ('post_share_events', 'post_share'),
      ('groups', 'group'),
      ('group_members_new', 'group_membership'),
      ('group_messages_new', 'group_message'),
      ('group_message_reports', 'group_message_report'),
      ('community_reports', 'community_report')
    ) AS configured(table_name, target_type)
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_audit_community_social_change ON public.%I',
      item.table_name
    );
    EXECUTE format(
      'CREATE TRIGGER trg_audit_community_social_change '
      'AFTER INSERT OR UPDATE OR DELETE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION private.audit_community_social_change(%L)',
      item.table_name,
      item.target_type
    );
  END LOOP;
END $$;

COMMENT ON TABLE public.post_share_events IS
  'Append-only unique authenticated share events; posts.shares_count is derived by trigger.';
COMMENT ON TABLE public.community_social_audit_log IS
  'Internal append-oriented audit for community social mutations; content and media are excluded.';
COMMENT ON FUNCTION private.auth_has_verified_residence(UUID, UUID) IS
  'Private RLS helper requiring exact verified canonical residence for an owned active profile.';
COMMENT ON FUNCTION private.guard_group_membership_write() IS
  'Prevents browser-controlled role escalation and removal of the last group admin.';
