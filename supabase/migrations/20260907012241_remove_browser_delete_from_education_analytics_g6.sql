-- G6 Education: analytics history is not browser-deletable.
--
-- The original DELETE policy explicitly existed for test cleanup. There are no
-- runtime product callers for direct DELETE, and trusted cleanup remains
-- service-role owned.

DROP POLICY IF EXISTS "allow_owner_delete_analytics"
  ON public.education_analytics_events;

REVOKE DELETE ON TABLE public.education_analytics_events
  FROM authenticated;

COMMENT ON TABLE public.education_analytics_events IS
  'Education domain analytics event store. Browser roles may not hard-delete analytics history; trusted server-side lifecycle remains service-role owned.';
