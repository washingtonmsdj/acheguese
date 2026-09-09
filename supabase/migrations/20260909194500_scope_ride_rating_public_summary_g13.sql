-- G13: privacy-bound public ride-rating aggregate.
--
-- ride_ratings and Trust tables are already server-owned for mutation. This
-- gate preserves the intentionally public aggregate, but stops arbitrary UUIDs
-- from revealing rating history for private profiles.

CREATE OR REPLACE FUNCTION public.get_ride_rating_summary(
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_can_view boolean := false;
  v_average_rating numeric := 0;
  v_total_ratings integer := 0;
BEGIN
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles target
    WHERE target.id = p_profile_id
      AND target.is_active = true
      AND (
        target.is_public = true
        OR (
          v_actor_user_id IS NOT NULL
          AND target.user_id = v_actor_user_id
        )
        OR (
          v_actor_user_id IS NOT NULL
          AND COALESCE(private.is_admin_user(v_actor_user_id), false)
        )
        OR (
          v_actor_user_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.ride_requests ride
            JOIN public.profiles actor_profile
              ON actor_profile.user_id = v_actor_user_id
             AND actor_profile.is_active = true
            WHERE ride.status IN ('completed', 'delivered')
              AND (
                (
                  ride.passenger_profile_id = p_profile_id
                  AND ride.driver_profile_id = actor_profile.id
                )
                OR (
                  ride.driver_profile_id = p_profile_id
                  AND ride.passenger_profile_id = actor_profile.id
                )
              )
          )
        )
      )
  )
  INTO v_can_view;

  IF v_can_view IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'profile_id', p_profile_id,
      'average_rating', 0,
      'total_ratings', 0
    );
  END IF;

  SELECT
    COALESCE(round(avg(rating)::numeric, 2), 0),
    count(*)::integer
  INTO
    v_average_rating,
    v_total_ratings
  FROM public.ride_ratings
  WHERE rated_id = p_profile_id;

  RETURN jsonb_build_object(
    'profile_id', p_profile_id,
    'average_rating', v_average_rating,
    'total_ratings', v_total_ratings
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ride_rating_summary(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ride_rating_summary(uuid)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_ride_rating_summary(uuid) IS
  'Public aggregate for active public profiles; private profiles are visible only to their owner, admins, or a completed-ride counterparty. Unauthorized callers receive a neutral zero summary.';
