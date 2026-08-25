-- Shared ride links are bearer-token access to safety data, including exact driver
-- coordinates. They must stop disclosing ride/location data as soon as a ride is
-- terminal, even if the share row has not yet expired or been manually revoked.

CREATE OR REPLACE FUNCTION public.get_shared_ride_safety_data(p_share_token text)
RETURNS TABLE(
  ride_id uuid,
  ride_status text,
  origin text,
  destination text,
  driver_name text,
  vehicle_model text,
  vehicle_plate text,
  current_lat double precision,
  current_lng double precision,
  location_updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
  SELECT
    ride.id,
    ride.status,
    COALESCE(ride.origin, ''),
    COALESCE(ride.destination, ''),
    driver_profile.name,
    driver.vehicle_model,
    driver.vehicle_plate,
    latest_location.lat::double precision,
    latest_location.lng::double precision,
    latest_location.updated_at
  FROM public.ride_shares share
  JOIN public.ride_requests ride
    ON ride.id = share.ride_id
  LEFT JOIN public.profiles driver_profile
    ON driver_profile.id = ride.driver_profile_id
  LEFT JOIN public.driver_data driver
    ON driver.profile_id = ride.driver_profile_id
  LEFT JOIN LATERAL (
    SELECT location.lat, location.lng, location.updated_at
    FROM public.driver_locations location
    WHERE location.driver_profile_id = ride.driver_profile_id
    ORDER BY location.updated_at DESC
    LIMIT 1
  ) latest_location ON TRUE
  WHERE p_share_token ~ '^[A-Za-z0-9]{32}$'
    AND share.share_token = p_share_token
    AND share.status = 'active'
    AND share.expires_at > now()
    AND ride.status = ANY (ARRAY[
      'pending',
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'pickup_confirmed',
      'in_delivery',
      'accepted'
    ]::text[])
  LIMIT 1;
$function$;

COMMENT ON FUNCTION public.get_shared_ride_safety_data(text) IS
  'Public bearer-token safety projection. Returns data only while the share is active/unexpired and the ride itself is non-terminal.';

CREATE OR REPLACE FUNCTION private.revoke_terminal_ride_shares()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status = ANY (ARRAY[
    'delivered',
    'failed_delivery',
    'completed',
    'cancelled_by_passenger',
    'cancelled_by_driver',
    'expired',
    'failed',
    'cancelled'
  ]::text[]) THEN
    UPDATE public.ride_shares
    SET status = 'revoked',
        revoked_at = COALESCE(revoked_at, now())
    WHERE ride_id = NEW.id
      AND status = 'active';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.revoke_terminal_ride_shares() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_revoke_terminal_ride_shares ON public.ride_requests;
CREATE TRIGGER trg_revoke_terminal_ride_shares
AFTER UPDATE OF status ON public.ride_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION private.revoke_terminal_ride_shares();

-- Backfill defensively in case an environment already has active shares attached
-- to terminal rides. This is a privacy-state correction only; no share rows are deleted.
UPDATE public.ride_shares share
SET status = 'revoked',
    revoked_at = COALESCE(share.revoked_at, now())
FROM public.ride_requests ride
WHERE ride.id = share.ride_id
  AND share.status = 'active'
  AND ride.status = ANY (ARRAY[
    'delivered',
    'failed_delivery',
    'completed',
    'cancelled_by_passenger',
    'cancelled_by_driver',
    'expired',
    'failed',
    'cancelled'
  ]::text[]);
