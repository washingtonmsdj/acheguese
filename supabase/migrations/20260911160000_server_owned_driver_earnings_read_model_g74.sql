BEGIN;

-- G74: driver earnings are derived server-side from terminal rides without
-- exposing completed ride rows or failed-delivery custody metadata. The browser
-- never supplies an internal driver Profile UUID: mobility-rpc authenticates the
-- request and forwards only the authenticated user id to this service-role RPC.
CREATE OR REPLACE FUNCTION public.mobility_get_driver_earnings_history(
  p_actor_user_id uuid,
  p_since timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 500
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_driver_profile_ids uuid[];
  v_driver_profile_id uuid;
  v_rows jsonb;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actor_user_required' USING ERRCODE = '22023';
  END IF;

  IF p_limit NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'invalid_earnings_page' USING ERRCODE = '22023';
  END IF;

  SELECT pg_catalog.array_agg(profile.id ORDER BY profile.created_at, profile.id)
  INTO v_driver_profile_ids
  FROM public.profiles profile
  JOIN public.driver_data driver
    ON driver.profile_id = profile.id
  WHERE profile.user_id = p_actor_user_id;

  IF COALESCE(pg_catalog.array_length(v_driver_profile_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'driver_profile_not_found' USING ERRCODE = '42501';
  END IF;

  IF pg_catalog.array_length(v_driver_profile_ids, 1) <> 1 THEN
    RAISE EXCEPTION 'driver_profile_ambiguous' USING ERRCODE = '42501';
  END IF;

  v_driver_profile_id := v_driver_profile_ids[1];

  WITH eligible AS (
    SELECT
      ride.created_at,
      ride.completed_at,
      ride.updated_at,
      ride.final_price,
      ride.actual_fare
    FROM public.ride_requests ride
    WHERE ride.driver_profile_id = v_driver_profile_id
      AND ride.status = 'completed'
      AND (p_since IS NULL OR ride.created_at >= p_since)
      AND COALESCE(ride.failed_delivery_metadata->>'resolution_action', '')
            <> 'handoff_to_another_driver'
      AND COALESCE(
        ride.failed_delivery_metadata->>'courier_settlement_allocation_required',
        'false'
      ) <> 'true'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(
          CASE
            WHEN pg_catalog.jsonb_typeof(
              ride.failed_delivery_metadata->'custody_handoff_history'
            ) = 'array'
              THEN ride.failed_delivery_metadata->'custody_handoff_history'
            ELSE '[]'::jsonb
          END
        ) AS history(entry)
        WHERE history.entry->>'source' = 'failed_delivery_handoff'
      )
    ORDER BY COALESCE(ride.completed_at, ride.updated_at, ride.created_at) DESC,
             ride.id DESC
    LIMIT p_limit
  )
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_strip_nulls(
        pg_catalog.jsonb_build_object(
          'created_at', row.created_at,
          'completed_at', row.completed_at,
          'updated_at', row.updated_at,
          'final_price', row.final_price,
          'actual_fare', row.actual_fare
        )
      )
    ),
    '[]'::jsonb
  )
  INTO v_rows
  FROM eligible row;

  RETURN pg_catalog.jsonb_build_object('earnings', v_rows);
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_get_driver_earnings_history(
  uuid, timestamptz, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_get_driver_earnings_history(
  uuid, timestamptz, integer
) TO service_role;

COMMENT ON FUNCTION public.mobility_get_driver_earnings_history(
  uuid, timestamptz, integer
) IS
  'G74 service-role-only driver earnings read model. mobility-rpc supplies the authenticated user id and custody attribution remains server-side; terminal ride PII and failed-delivery metadata are never returned.';

COMMIT;