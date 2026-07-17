-- Community social notifications are internal projections of persisted facts.
-- They are derived in the same transaction as the social write, never from a
-- subsequent browser request.

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower_active
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION private.create_community_social_notification(
  p_recipient_profile_id UUID,
  p_actor_profile_id UUID,
  p_event_type TEXT,
  p_dedupe_key TEXT,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_recipient_user_id UUID;
  v_actor_name TEXT;
  v_preferences RECORD;
  v_notification_id UUID;
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF p_recipient_profile_id IS NULL
     OR p_actor_profile_id IS NULL
     OR p_recipient_profile_id = p_actor_profile_id
     OR p_event_type NOT IN (
       'post_like', 'post_comment', 'comment_reply', 'post_mention', 'comment_mention'
     )
     OR p_dedupe_key !~ '^[a-z0-9:_-]{1,200}$' THEN
    RETURN NULL;
  END IF;

  SELECT recipient.user_id
  INTO v_recipient_user_id
  FROM public.profiles recipient
  WHERE recipient.id = p_recipient_profile_id;

  IF v_recipient_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    NULLIF(btrim(actor.display_name), ''),
    NULLIF(btrim(actor.name), ''),
    NULLIF(btrim(actor.username), ''),
    'Alguem'
  )
  INTO v_actor_name
  FROM public.profiles actor
  WHERE actor.id = p_actor_profile_id;

  IF v_actor_name IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (v_recipient_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT *
  INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = v_recipient_user_id;

  IF v_preferences.user_id IS NULL
     OR NOT v_preferences.inapp_enabled
     OR NOT v_preferences.social_enabled THEN
    RETURN NULL;
  END IF;

  CASE p_event_type
    WHEN 'post_like' THEN
      v_title := 'Novo like no seu post';
      v_message := v_actor_name || ' curtiu seu post';
    WHEN 'post_comment' THEN
      v_title := 'Novo comentario';
      v_message := v_actor_name || ' comentou no seu post';
    WHEN 'comment_reply' THEN
      v_title := 'Nova resposta no comentario';
      v_message := v_actor_name || ' respondeu seu comentario';
    WHEN 'post_mention' THEN
      v_title := 'Voce foi mencionado';
      v_message := v_actor_name || ' mencionou voce em uma publicacao';
    WHEN 'comment_mention' THEN
      v_title := 'Voce foi mencionado';
      v_message := v_actor_name || ' mencionou voce em um comentario';
  END CASE;

  INSERT INTO public.notifications (
    user_id, type, category, priority, title, message, metadata, dedupe_key
  ) VALUES (
    v_recipient_user_id,
    'community_' || p_event_type,
    'social',
    'medium',
    v_title,
    v_message,
    jsonb_strip_nulls(jsonb_build_object(
      'domain', 'community',
      'event', p_event_type,
      'post_id', p_post_id,
      'comment_id', p_comment_id,
      'actor_profile_id', p_actor_profile_id
    )),
    p_dedupe_key
  )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_notification_id;

  IF v_notification_id IS NULL THEN
    SELECT notification.id
    INTO v_notification_id
    FROM public.notifications notification
    WHERE notification.user_id = v_recipient_user_id
      AND notification.dedupe_key = p_dedupe_key;
  END IF;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION private.create_community_social_notification(
  UUID, UUID, TEXT, TEXT, UUID, UUID
) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.dispatch_community_post_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_recipient_profile_id UUID;
BEGIN
  IF NEW.is_published IS DISTINCT FROM TRUE
     OR NEW.is_hidden IS TRUE
     OR NEW.is_removed IS TRUE THEN
    RETURN NEW;
  END IF;

  FOR v_recipient_profile_id IN
    SELECT profile.id
    FROM public.profiles profile
    WHERE lower(profile.username) IN (
      SELECT DISTINCT lower(match[1])
      FROM regexp_matches(COALESCE(NEW.content, ''), '@([a-zA-Z0-9_]{3,30})', 'g') AS match
      LIMIT 20
    )
  LOOP
    PERFORM private.create_community_social_notification(
      v_recipient_profile_id,
      NEW.author_profile_id,
      'post_mention',
      'community:post_mention:' || NEW.id::TEXT || ':' || v_recipient_profile_id::TEXT,
      NEW.id,
      NULL
    );
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.dispatch_community_post_notifications() FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.dispatch_community_comment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_post_author_profile_id UUID;
  v_parent_author_profile_id UUID;
  v_recipient_profile_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT post.author_profile_id
    INTO v_post_author_profile_id
    FROM public.posts post
    WHERE post.id = NEW.post_id
      AND post.is_published = TRUE
      AND post.is_hidden = FALSE
      AND post.is_removed = FALSE;

    IF NEW.parent_id IS NULL THEN
      PERFORM private.create_community_social_notification(
        v_post_author_profile_id,
        NEW.author_profile_id,
        'post_comment',
        'community:post_comment:' || NEW.id::TEXT,
        NEW.post_id,
        NEW.id
      );
    ELSE
      SELECT parent.author_profile_id
      INTO v_parent_author_profile_id
      FROM public.comments parent
      WHERE parent.id = NEW.parent_id
        AND parent.post_id = NEW.post_id
        AND parent.is_hidden = FALSE
        AND parent.is_removed = FALSE;

      PERFORM private.create_community_social_notification(
        v_parent_author_profile_id,
        NEW.author_profile_id,
        'comment_reply',
        'community:comment_reply:' || NEW.id::TEXT,
        NEW.post_id,
        NEW.id
      );
    END IF;
  END IF;

  IF NEW.is_hidden IS TRUE OR NEW.is_removed IS TRUE THEN
    RETURN NEW;
  END IF;

  FOR v_recipient_profile_id IN
    SELECT profile.id
    FROM public.profiles profile
    WHERE lower(profile.username) IN (
      SELECT DISTINCT lower(match[1])
      FROM regexp_matches(COALESCE(NEW.content, ''), '@([a-zA-Z0-9_]{3,30})', 'g') AS match
      LIMIT 20
    )
  LOOP
    PERFORM private.create_community_social_notification(
      v_recipient_profile_id,
      NEW.author_profile_id,
      'comment_mention',
      'community:comment_mention:' || NEW.id::TEXT || ':' || v_recipient_profile_id::TEXT,
      NEW.post_id,
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.dispatch_community_comment_notifications() FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.dispatch_community_post_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_recipient_profile_id UUID;
BEGIN
  SELECT post.author_profile_id
  INTO v_recipient_profile_id
  FROM public.posts post
  WHERE post.id = NEW.post_id
    AND post.is_published = TRUE
    AND post.is_hidden = FALSE
    AND post.is_removed = FALSE;

  PERFORM private.create_community_social_notification(
    v_recipient_profile_id,
    NEW.liker_profile_id,
    'post_like',
    'community:post_like:' || NEW.id::TEXT,
    NEW.post_id,
    NULL
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.dispatch_community_post_like_notification() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_dispatch_community_post_notifications ON public.posts;
CREATE TRIGGER trg_dispatch_community_post_notifications
  AFTER INSERT OR UPDATE OF content, is_published, is_hidden, is_removed ON public.posts
  FOR EACH ROW EXECUTE FUNCTION private.dispatch_community_post_notifications();

DROP TRIGGER IF EXISTS trg_dispatch_community_comment_notifications ON public.comments;
CREATE TRIGGER trg_dispatch_community_comment_notifications
  AFTER INSERT OR UPDATE OF content, is_hidden, is_removed ON public.comments
  FOR EACH ROW EXECUTE FUNCTION private.dispatch_community_comment_notifications();

DROP TRIGGER IF EXISTS trg_dispatch_community_post_like_notification ON public.post_likes_new;
CREATE TRIGGER trg_dispatch_community_post_like_notification
  AFTER INSERT ON public.post_likes_new
  FOR EACH ROW EXECUTE FUNCTION private.dispatch_community_post_like_notification();

COMMENT ON FUNCTION private.create_community_social_notification(
  UUID, UUID, TEXT, TEXT, UUID, UUID
) IS 'Internal transactional projection of a persisted community social event into an in-app notification.';
