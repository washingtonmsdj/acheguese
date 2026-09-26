-- Make future project-owned objects in public fail closed for browser roles.
--
-- Existing relations are intentionally unchanged: their runtime access remains
-- governed by explicit grants + RLS. This migration only changes defaults for
-- objects created later by the project migration owner (`postgres`).
--
-- `service_role` is intentionally left unchanged here for server compatibility;
-- browser roles must opt in explicitly per object.

BEGIN;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES
  FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT, UPDATE ON SEQUENCES
  FROM anon, authenticated;

-- Reassert the function boundary established previously so future RPCs do not
-- become browser-callable unless a migration explicitly grants EXECUTE.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS
  FROM PUBLIC, anon, authenticated;

COMMIT;
