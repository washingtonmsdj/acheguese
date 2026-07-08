-- Notification read-state operations are now performed directly against
-- public.notifications with RLS (`user_id = auth.uid()`), so browser clients
-- no longer need privileged read-state RPCs that accept arbitrary user ids.

REVOKE ALL ON FUNCTION public.mark_notification_as_read(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.mark_all_notifications_as_read(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_as_read(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.get_unread_notifications_count(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count(uuid)
  TO service_role;

COMMENT ON FUNCTION public.mark_notification_as_read(uuid)
  IS 'Legacy notification read-state helper. Browser clients must update public.notifications through RLS; service_role only.';
COMMENT ON FUNCTION public.mark_all_notifications_as_read(uuid)
  IS 'Legacy notification bulk read-state helper. Browser clients must update public.notifications through RLS; service_role only.';
COMMENT ON FUNCTION public.get_unread_notifications_count(uuid)
  IS 'Legacy unread count helper. Browser clients must count public.notifications through RLS; service_role only.';
