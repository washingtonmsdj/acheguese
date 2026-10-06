-- Community is paused for the MVP. Keep its Direct Messaging implementation
-- available for a future explicit reactivation, but remove direct browser-role
-- reachability while the Community messaging provider is not active.
--
-- This mirrors the lifecycle boundary used for other paused modules: the
-- functions remain deployed and service_role can still perform controlled
-- operational work. Reopening browser access requires a later versioned
-- migration together with lifecycle/provider reactivation.

BEGIN;

REVOKE ALL ON FUNCTION public.create_community_direct_thread(uuid, uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_direct_thread(uuid, uuid, uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.list_community_direct_messages(uuid, uuid, integer, timestamp with time zone, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_community_direct_messages(uuid, uuid, integer, timestamp with time zone, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.list_community_direct_thread_previews(uuid, integer, timestamp with time zone, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_community_direct_thread_previews(uuid, integer, timestamp with time zone, uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.mark_community_direct_thread_read(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_community_direct_thread_read(uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.moderate_community_direct_report(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_community_direct_report(uuid, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.report_community_direct_thread(uuid, uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_community_direct_thread(uuid, uuid, uuid, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.send_community_direct_message(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_community_direct_message(uuid, uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.set_community_direct_thread_blocked(uuid, uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_community_direct_thread_blocked(uuid, uuid, boolean, text)
  TO service_role;

COMMIT;
