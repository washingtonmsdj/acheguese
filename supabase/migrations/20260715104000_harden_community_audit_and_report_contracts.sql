BEGIN;

DROP POLICY IF EXISTS community_social_audit_admin_read
  ON public.community_social_audit_log;
REVOKE SELECT ON TABLE public.community_social_audit_log FROM authenticated;

ALTER TABLE public.community_social_audit_log
  DROP CONSTRAINT IF EXISTS community_social_audit_action_check;
ALTER TABLE public.community_social_audit_log
  ADD CONSTRAINT community_social_audit_action_check
  CHECK (
    char_length(action) BETWEEN 1 AND 80
    AND action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){0,2}$'
  ) NOT VALID;
ALTER TABLE public.community_social_audit_log
  VALIDATE CONSTRAINT community_social_audit_action_check;

ALTER TABLE public.community_reports
  ADD CONSTRAINT community_reports_reason_code_check
  CHECK (
    reason IN (
      'spam',
      'harassment',
      'hate',
      'violence',
      'misinformation',
      'malicious_link',
      'other'
    )
  ) NOT VALID;
ALTER TABLE public.community_reports
  VALIDATE CONSTRAINT community_reports_reason_code_check;

COMMENT ON CONSTRAINT community_social_audit_action_check
  ON public.community_social_audit_log IS
  'Allows canonical CRUD actions and namespaced server-owned domain actions.';
COMMENT ON CONSTRAINT community_reports_reason_code_check
  ON public.community_reports IS
  'Canonical Community report reason codes shared with the application protocol.';

COMMIT;
