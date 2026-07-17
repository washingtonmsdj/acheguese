BEGIN;

ALTER FUNCTION private.guard_community_report_review() SECURITY DEFINER;
ALTER FUNCTION private.guard_community_report_review()
  SET search_path TO public, private, pg_temp;

REVOKE ALL ON FUNCTION private.guard_community_report_review()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.resolve_community_report_target_author(
  TEXT, UUID
) FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION private.guard_community_report_review() IS
  'Private trigger guard. Runs with its owner only to resolve canonical target authors; caller identity is still derived from auth.uid().';

COMMIT;
