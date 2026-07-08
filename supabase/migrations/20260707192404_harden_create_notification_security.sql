-- Harden public notification creation so browser clients cannot create
-- notifications for another user through a SECURITY DEFINER bypass.

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_category text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL::text,
  p_action_label text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_notification_id uuid;
  v_preferences record;
  v_actor_user_id uuid := (SELECT auth.uid());
  v_request_role text := NULLIF(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF COALESCE(v_request_role, '') <> 'service_role' THEN
    IF v_actor_user_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required to create notifications'
        USING ERRCODE = '28000';
    END IF;

    IF p_user_id IS DISTINCT FROM v_actor_user_id THEN
      RAISE EXCEPTION 'Cannot create a notification for another user'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT * INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  IF NOT v_preferences.inapp_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'social' AND NOT v_preferences.social_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'system' AND NOT v_preferences.system_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'marketing' AND NOT v_preferences.marketing_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'transactional' AND NOT v_preferences.transactional_enabled THEN
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
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_category,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$function$;

COMMENT ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, jsonb)
  IS 'Creates an in-app notification. Runs as invoker; authenticated clients may only create their own notification, service_role is reserved for trusted server-side brokers.';

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, jsonb)
  TO authenticated, service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sistema pode gerenciar preferências" ON public.notification_preferences;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias preferências" ON public.notification_preferences;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias preferências" ON public.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_service_manage ON public.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_select_own ON public.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_insert_own ON public.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_update_own ON public.notification_preferences;

CREATE POLICY notification_preferences_service_manage
ON public.notification_preferences
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY notification_preferences_select_own
ON public.notification_preferences
AS PERMISSIVE
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY notification_preferences_insert_own
ON public.notification_preferences
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY notification_preferences_update_own
ON public.notification_preferences
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS notifications_service_manage ON public.notifications;
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;

CREATE POLICY notifications_service_manage
ON public.notifications
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY notifications_select_own
ON public.notifications
AS PERMISSIVE
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY notifications_insert_own
ON public.notifications
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY notifications_update_own
ON public.notifications
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY notifications_delete_own
ON public.notifications
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.notification_preferences FROM anon;
REVOKE ALL ON TABLE public.notification_preferences FROM authenticated;
GRANT SELECT ON TABLE public.notification_preferences TO authenticated;
GRANT INSERT (user_id) ON TABLE public.notification_preferences TO authenticated;
GRANT UPDATE (
  email_enabled,
  push_enabled,
  inapp_enabled,
  transactional_enabled,
  social_enabled,
  system_enabled,
  marketing_enabled,
  frequency,
  quiet_hours_start,
  quiet_hours_end,
  quiet_hours_days,
  updated_at
) ON TABLE public.notification_preferences TO authenticated;
GRANT ALL ON TABLE public.notification_preferences TO service_role;

REVOKE ALL ON TABLE public.notifications FROM anon;
REVOKE ALL ON TABLE public.notifications FROM authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT INSERT (
  user_id,
  type,
  category,
  title,
  message,
  action_url,
  action_label,
  metadata
) ON TABLE public.notifications TO authenticated;
GRANT UPDATE (
  read,
  is_read,
  read_at,
  deleted_at,
  updated_at
) ON TABLE public.notifications TO authenticated;
GRANT DELETE ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
