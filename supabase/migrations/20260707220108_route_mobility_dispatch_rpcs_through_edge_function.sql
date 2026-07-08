CREATE OR REPLACE FUNCTION public.log_ride_dispatch_attempt(
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_attempt_number integer,
  p_offered_at timestamptz,
  p_timeout_at timestamptz,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_service_role boolean := COALESCE(auth.role(), '') = 'service_role';
BEGIN
  IF NOT v_is_service_role AND (
    auth.uid() IS NULL
    OR NOT public.can_write_ride_dispatch_audit(p_ride_id, p_driver_profile_id)
  ) THEN
    RAISE EXCEPTION 'not authorized to write dispatch audit'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.ride_dispatch_audit (
    ride_id,
    driver_profile_id,
    attempt_number,
    offered_at,
    timeout_at,
    status,
    created_at
  )
  VALUES (
    p_ride_id,
    p_driver_profile_id,
    p_attempt_number,
    p_offered_at,
    p_timeout_at,
    p_status,
    now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_latest_ride_dispatch_attempt(
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_status text DEFAULT NULL,
  p_responded_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempt_id uuid;
  v_is_service_role boolean := COALESCE(auth.role(), '') = 'service_role';
BEGIN
  IF NOT v_is_service_role AND (
    auth.uid() IS NULL
    OR NOT public.can_write_ride_dispatch_audit(p_ride_id, p_driver_profile_id)
  ) THEN
    RAISE EXCEPTION 'not authorized to update dispatch audit'
      USING ERRCODE = '42501';
  END IF;

  SELECT rda.id
  INTO v_attempt_id
  FROM public.ride_dispatch_audit rda
  WHERE rda.ride_id = p_ride_id
    AND rda.driver_profile_id = p_driver_profile_id
  ORDER BY rda.created_at DESC
  LIMIT 1;

  IF v_attempt_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.ride_dispatch_audit
  SET
    status = COALESCE(p_status, status),
    responded_at = COALESCE(p_responded_at, responded_at),
    updated_at = now()
  WHERE id = v_attempt_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz)
  TO service_role;

REVOKE ALL ON FUNCTION public.cancel_pending_ride_offers(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_pending_ride_offers(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.release_driver_availability_for_ride(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_driver_availability_for_ride(uuid, uuid)
  TO service_role;

COMMENT ON FUNCTION public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text)
  IS 'Legacy dispatch audit helper. Browser access is routed through mobility-rpc and scoped to ride participants or admins.';

COMMENT ON FUNCTION public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz)
  IS 'Legacy dispatch audit update helper. Browser access is routed through mobility-rpc and scoped to ride participants or admins.';

COMMENT ON FUNCTION public.cancel_pending_ride_offers(uuid)
  IS 'Legacy ride offer cancellation helper. Browser access is routed through mobility-rpc and scoped to cancelled ride participants or admins.';

COMMENT ON FUNCTION public.release_driver_availability_for_ride(uuid, uuid)
  IS 'Legacy driver availability release helper. Browser access is routed through mobility-rpc and scoped to ride participants or admins.';
