-- driver_data contains sensitive driver verification, licensing, vehicle and
-- background-check fields. Raw rows must not be readable by every authenticated
-- account.
--
-- Preserve raw-table self access through the existing owner policies, add
-- canonical admin read access, and provide dispatch with a deliberately narrow
-- SECURITY DEFINER RPC that returns only the non-sensitive capability summary
-- needed to rank currently available drivers.

DROP POLICY IF EXISTS "Driver data viewable"
ON public.driver_data;

DROP POLICY IF EXISTS "driver_data_admin_read"
ON public.driver_data;

CREATE POLICY "driver_data_admin_read"
ON public.driver_data
FOR SELECT
TO authenticated
USING (
  COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false)
);

CREATE OR REPLACE FUNCTION public.get_driver_dispatch_summaries(
  p_profile_ids uuid[]
)
RETURNS TABLE (
  profile_id uuid,
  rating numeric,
  can_do_delivery boolean,
  can_do_rides boolean,
  is_verified boolean,
  subscription_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(array_length(p_profile_ids, 1), 0) > 100 THEN
    RAISE EXCEPTION 'too many driver profiles requested' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    dd.profile_id,
    dd.rating,
    dd.can_do_delivery,
    dd.can_do_rides,
    dd.is_verified,
    dd.subscription_active
  FROM public.driver_data AS dd
  JOIN public.driver_availability AS da
    ON da.profile_id = dd.profile_id
  WHERE dd.profile_id = ANY(COALESCE(p_profile_ids, ARRAY[]::uuid[]))
    AND da.is_online = true
    AND da.is_available = true
    AND da.active_ride_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_driver_dispatch_summaries(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_driver_dispatch_summaries(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_driver_dispatch_summaries(uuid[]) TO authenticated;
