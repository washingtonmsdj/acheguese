-- delivery_requests is a retained legacy/frota-propria table. The canonical
-- platform motoboy flow uses ride_requests. Keep this legacy storage available
-- only to trusted server-side callers until/unless a brokered fleet flow is
-- intentionally reintroduced.

ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS delivery_requests_business_insert
ON public.delivery_requests;
DROP POLICY IF EXISTS delivery_requests_business_select
ON public.delivery_requests;
DROP POLICY IF EXISTS delivery_requests_business_update
ON public.delivery_requests;
DROP POLICY IF EXISTS delivery_requests_driver_accept
ON public.delivery_requests;
DROP POLICY IF EXISTS delivery_requests_driver_select
ON public.delivery_requests;
DROP POLICY IF EXISTS delivery_requests_driver_update
ON public.delivery_requests;

REVOKE ALL PRIVILEGES ON TABLE public.delivery_requests
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.delivery_requests TO service_role;

DO $verify$
DECLARE
  v_browser_grants integer;
  v_client_policies integer;
BEGIN
  SELECT count(*)
  INTO v_browser_grants
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  WHERE has_table_privilege(role_name.role_name, 'public.delivery_requests', 'SELECT')
     OR has_table_privilege(role_name.role_name, 'public.delivery_requests', 'INSERT')
     OR has_table_privilege(role_name.role_name, 'public.delivery_requests', 'UPDATE')
     OR has_table_privilege(role_name.role_name, 'public.delivery_requests', 'DELETE')
     OR has_table_privilege(role_name.role_name, 'public.delivery_requests', 'TRUNCATE');

  IF v_browser_grants <> 0 THEN
    RAISE EXCEPTION 'browser grants remain on legacy delivery_requests';
  END IF;

  SELECT count(*)
  INTO v_client_policies
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'delivery_requests'
    AND p.roles && ARRAY['public', 'anon', 'authenticated']::name[];

  IF v_client_policies <> 0 THEN
    RAISE EXCEPTION 'client-facing policies remain on legacy delivery_requests';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.delivery_requests', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.delivery_requests', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.delivery_requests', 'UPDATE') THEN
    RAISE EXCEPTION 'service_role access missing on legacy delivery_requests';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
