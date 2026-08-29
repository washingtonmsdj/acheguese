ALTER FUNCTION public.create_notification(uuid, text, text, text, text, text, text, text, jsonb)
  SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, text, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, text, jsonb)
  TO authenticated, service_role;

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;

REVOKE INSERT ON public.notifications FROM authenticated, anon;
REVOKE INSERT (user_id, type, category, title, message, action_url, action_label, metadata)
  ON public.notifications FROM authenticated, anon;
REVOKE DELETE ON public.notifications FROM authenticated, anon;
