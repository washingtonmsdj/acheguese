-- Harden the remaining always-true RLS findings that have clear runtime
-- boundaries.
--
-- Analytics keeps public telemetry insertion, but only for structurally valid
-- rows and without user spoofing. Dispatch audit writes move behind explicit
-- RPCs with authorization checks, so authenticated clients no longer need
-- broad direct INSERT/UPDATE policies on ride_dispatch_audit.

DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    DROP POLICY IF EXISTS analytics_events_public_insert ON public.analytics_events;

    CREATE POLICY analytics_events_public_insert
      ON public.analytics_events
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        entity_type <> ''
        AND entity_id IS NOT NULL
        AND (user_id IS NULL OR user_id = auth.uid())
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.can_write_ride_dispatch_audit(
  p_ride_id uuid,
  p_driver_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.ride_requests rr
      JOIN public.profiles passenger_profile
        ON passenger_profile.id = rr.passenger_profile_id
      WHERE rr.id = p_ride_id
        AND passenger_profile.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles driver_profile
      WHERE driver_profile.id = p_driver_profile_id
        AND driver_profile.user_id = auth.uid()
    ),
    false
  );
$$;

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
BEGIN
  IF auth.uid() IS NULL
    OR NOT public.can_write_ride_dispatch_audit(p_ride_id, p_driver_profile_id)
  THEN
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
BEGIN
  IF auth.uid() IS NULL
    OR NOT public.can_write_ride_dispatch_audit(p_ride_id, p_driver_profile_id)
  THEN
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

REVOKE ALL ON FUNCTION public.can_write_ride_dispatch_audit(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_write_ride_dispatch_audit(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz) TO authenticated;

DROP POLICY IF EXISTS "System can insert dispatch audit" ON public.ride_dispatch_audit;
DROP POLICY IF EXISTS "System can update dispatch audit" ON public.ride_dispatch_audit;
