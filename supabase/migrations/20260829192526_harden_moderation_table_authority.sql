BEGIN;

-- Community reports are created by the authenticated reporter, but review and
-- corrective decisions are owned by the server-side moderation command.
-- Remove the legacy direct admin DML surface so review cannot bypass
-- review_community_content_reports/private.review_community_content_reports.
REVOKE UPDATE, DELETE ON TABLE public.community_reports FROM authenticated;
DROP POLICY IF EXISTS community_reports_admin_update ON public.community_reports;
DROP POLICY IF EXISTS community_reports_admin_delete ON public.community_reports;

-- Community moderation actions are append-only server-owned records. There is
-- no runtime browser reader; future reads must use a bounded read model/RPC.
REVOKE SELECT ON TABLE public.community_user_moderation_actions FROM authenticated;
DROP POLICY IF EXISTS community_user_moderation_admin_read
  ON public.community_user_moderation_actions;

COMMIT;
