
REVOKE UPDATE ON TABLE public.ride_requests FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Participants update rides" ON public.ride_requests;

COMMENT ON TABLE public.ride_requests IS
  'Canonical mobility ride/delivery aggregate. Browser clients may INSERT through the passenger creation contract and read through RLS, but cannot UPDATE or DELETE rows directly; operational mutations are server-owned commands.';
