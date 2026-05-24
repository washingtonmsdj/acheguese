-- Centralizes ride offer cancellation behind an authorized RPC.
-- The function can be called by the passenger or assigned driver after a ride is cancelled.

CREATE OR REPLACE FUNCTION public.cancel_pending_ride_offers(p_ride_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1
    FROM public.ride_requests r
    LEFT JOIN public.profiles passenger_profile ON passenger_profile.id = r.passenger_profile_id
    LEFT JOIN public.profiles driver_profile ON driver_profile.id = r.driver_profile_id
    WHERE r.id = p_ride_id
      AND r.status IN ('cancelled_by_passenger', 'cancelled_by_driver')
      AND (
        passenger_profile.user_id = auth.uid()
        OR driver_profile.user_id = auth.uid()
      )
  ) THEN
    RAISE EXCEPTION 'Not authorized to cancel ride offers for this ride'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.ride_offers
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE ride_id = p_ride_id
    AND status IN ('pending', 'sent');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_pending_ride_offers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_pending_ride_offers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_pending_ride_offers(uuid) TO service_role;
