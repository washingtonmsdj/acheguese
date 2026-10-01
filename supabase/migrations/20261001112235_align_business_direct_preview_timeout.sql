-- Align the Business direct-message preview RPC with the authenticated
-- Data API timeout budget.
--
-- Production evidence showed the RPC itself normally executes well below 3s,
-- but its function-local 3s timeout was lower than Supabase's authenticated
-- role budget and converted transient database latency into SQLSTATE 57014 /
-- HTTP 500 responses. Keep the query and authorization contract unchanged;
-- only remove that premature function-local cutoff.

ALTER FUNCTION public.list_business_direct_thread_previews(
  uuid,
  integer,
  timestamptz,
  uuid,
  text
)
SET statement_timeout = '8s';
