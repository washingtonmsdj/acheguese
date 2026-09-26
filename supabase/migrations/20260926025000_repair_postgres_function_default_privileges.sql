-- Repair future-function default privileges using PostgreSQL's actual semantics.
--
-- Per-schema default privileges are additive. A schema-local REVOKE cannot remove
-- the global EXECUTE privilege that PostgreSQL grants to PUBLIC for new functions.
-- Remove that implicit privilege globally for functions created by postgres, then
-- preserve the extension surface explicitly. Existing functions are unchanged.
--
-- Existing schema-specific defaults remain additive:
-- - public keeps service_role EXECUTE by default;
-- - storage keeps its explicit anon/authenticated/service_role defaults;
-- - private receives no extra EXECUTE grant and therefore fails closed;
-- - extensions retains PUBLIC EXECUTE for extension compatibility.

BEGIN;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA extensions
  GRANT EXECUTE ON FUNCTIONS TO PUBLIC;

COMMIT;
