BEGIN;

-- These views are read models for the authenticated Admin moderation UI.
-- Keep the browser surface read-only and eliminate inherited/default DML grants.
REVOKE ALL ON TABLE public.admin_pending_post_reports FROM anon;
REVOKE ALL ON TABLE public.admin_pending_comment_reports FROM anon;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.admin_pending_post_reports
  FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.admin_pending_comment_reports
  FROM authenticated;

GRANT SELECT ON TABLE public.admin_pending_post_reports TO authenticated;
GRANT SELECT ON TABLE public.admin_pending_comment_reports TO authenticated;

COMMIT;
