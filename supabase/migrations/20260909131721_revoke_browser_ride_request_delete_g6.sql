REVOKE DELETE ON TABLE public.ride_requests FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.ride_requests IS 'Canonical mobility ride/delivery aggregate. Browser clients may not physically delete ride history; operational termination must use audited state commands.';
