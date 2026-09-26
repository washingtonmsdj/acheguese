-- Security/performance hardening: remove unreachable PUBLIC admin-write policies
-- from territorial history tables.
--
-- Production preflight (2026-09-26):
-- - RLS is enabled on all three relations;
-- - anon/authenticated have no direct table privileges;
-- - service_role has CRUD and BYPASSRLS;
-- - the *_write_admin policies are FOR ALL TO PUBLIC and therefore add policy
--   evaluation surface without authorizing a required runtime path.
--
-- Keep the existing read policies unchanged. Explicit REVOKE statements make the
-- browser deny-by-default contract durable: a future browser write capability must
-- be introduced deliberately together with a scoped RLS policy.

BEGIN;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.location_versions
  FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.postal_code_history
  FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.territory_change_events
  FROM anon, authenticated;

DROP POLICY IF EXISTS "location_versions_write_admin"
  ON public.location_versions;
DROP POLICY IF EXISTS "postal_code_history_write_admin"
  ON public.postal_code_history;
DROP POLICY IF EXISTS "territory_change_events_write_admin"
  ON public.territory_change_events;

COMMIT;
