-- Bounded, idempotent notification runtime for community social events.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_dedupe_key_format,
  ADD CONSTRAINT notifications_dedupe_key_format CHECK (
    dedupe_key IS NULL
    OR dedupe_key ~ '^[a-z0-9:_-]{1,200}$'
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_dedupe
  ON public.notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_active_created
  ON public.notifications (user_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON public.notifications (user_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL AND read = FALSE;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
  v_actor_user_id UUID := auth.uid();
  v_request_role TEXT := NULLIF(current_setting('request.jwt.claim.role', TRUE), '');
  v_dedupe_key TEXT := NULLIF(trim(COALESCE(p_metadata->>'dedupe_key', '')), '');
BEGIN
  IF COALESCE(v_request_role, '') <> 'service_role' THEN
    IF v_actor_user_id IS NULL THEN
      RAISE EXCEPTION 'notification_authentication_required' USING ERRCODE = '28000';
    END IF;
    IF p_user_id IS DISTINCT FROM v_actor_user_id THEN
      RAISE EXCEPTION 'cross_user_notification_denied' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF char_length(trim(COALESCE(p_title, ''))) NOT BETWEEN 1 AND 120
     OR char_length(COALESCE(p_message, '')) > 1000
     OR p_category NOT IN ('transactional', 'social', 'system', 'marketing')
     OR (v_dedupe_key IS NOT NULL AND v_dedupe_key !~ '^[a-z0-9:_-]{1,200}$') THEN
    RAISE EXCEPTION 'invalid_notification_payload' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  IF NOT v_preferences.inapp_enabled
     OR (p_category = 'social' AND NOT v_preferences.social_enabled)
     OR (p_category = 'system' AND NOT v_preferences.system_enabled)
     OR (p_category = 'marketing' AND NOT v_preferences.marketing_enabled)
     OR (p_category = 'transactional' AND NOT v_preferences.transactional_enabled) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    action_label,
    metadata,
    dedupe_key
  )
  VALUES (
    p_user_id,
    p_type,
    p_category,
    trim(p_title),
    p_message,
    p_action_url,
    p_action_label,
    p_metadata - 'dedupe_key',
    v_dedupe_key
  )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_notification_id;

  IF v_notification_id IS NULL AND v_dedupe_key IS NOT NULL THEN
    SELECT n.id INTO v_notification_id
    FROM public.notifications n
    WHERE n.user_id = p_user_id
      AND n.dedupe_key = v_dedupe_key;
  END IF;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mark_current_user_notifications_as_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'notification_authentication_required' USING ERRCODE = '28000';
  END IF;

  UPDATE public.notifications
  SET read = TRUE,
      is_read = TRUE,
      read_at = now()
  WHERE user_id = auth.uid()
    AND read = FALSE
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_current_user_notifications_as_read()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_current_user_notifications_as_read()
  TO authenticated;

COMMENT ON COLUMN public.notifications.dedupe_key IS
  'Server event idempotency key; unique per recipient and omitted from UI metadata.';
COMMENT ON FUNCTION public.mark_current_user_notifications_as_read() IS
  'RLS-preserving bulk read-state update scoped exclusively to auth.uid().';
