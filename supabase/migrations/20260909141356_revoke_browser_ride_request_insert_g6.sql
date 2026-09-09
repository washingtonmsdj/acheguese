
REVOKE INSERT ON TABLE public.ride_requests FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Passengers create rides" ON public.ride_requests;

COMMENT ON TABLE public.ride_requests IS
  'Canonical mobility ride/delivery aggregate. Browser clients may read through RLS but cannot INSERT, UPDATE or DELETE rows directly; creation and operational mutations are server-owned commands.';
