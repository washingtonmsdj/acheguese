REVOKE INSERT ON TABLE public.ride_state_audit
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "participants_insert_ride_audit"
  ON public.ride_state_audit;

COMMENT ON TABLE public.ride_state_audit IS
  'Server-owned mobility state audit. Browser writes are routed through the authenticated mobility-rpc broker or trusted database producers.';
