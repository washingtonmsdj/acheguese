-- Future postgres-owned functions in private must opt in to callers explicitly.
--
-- The private schema is not exposed through the Data API, but browser roles have
-- schema USAGE because authenticated RLS helpers may be referenced internally.
-- PostgreSQL otherwise grants EXECUTE on newly created functions to PUBLIC by
-- default. Remove that implicit authority for future private functions only.
--
-- Existing functions and their ACLs are intentionally unchanged.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
