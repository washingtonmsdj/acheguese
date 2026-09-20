BEGIN;

-- G73: terminal ride history is a dedicated redacted read model.
-- Drivers keep full operational access only while a ride still requires their
-- participation. Once the lifecycle is terminal, exact addresses, recipient
-- data, requester-controlled free text and internal participant/source ids are
-- no longer readable from ride_requests by the driver.
ALTER POLICY "Ride participants view"
ON public.ride_requests
USING (
  passenger_profile_id IN (
    SELECT profile.id
    FROM public.profiles AS profile
    WHERE profile.user_id = (SELECT auth.uid())
  )
  OR (
    driver_profile_id IN (
      SELECT profile.id
      FROM public.profiles AS profile
      WHERE profile.user_id = (SELECT auth.uid())
    )
    AND status IN (
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'pickup_confirmed',
      'in_delivery',
      'failed_delivery'
    )
  )
);

-- Browser callers never choose the internal driver Profile UUID for terminal
-- history. mobility-rpc authenticates the bearer token and supplies only the
-- authenticated user id to this service-role-only function.
CREATE OR REPLACE FUNCTION public.mobility_get_driver_ride_history(
  p_actor_user_id uuid,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
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
  v_rides jsonb;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actor_user_required' USING ERRCODE = '22023';
  END IF;

  IF p_limit NOT BETWEEN 1 AND 200 OR p_offset < 0 OR p_offset > 10000 THEN
    RAISE EXCEPTION 'invalid_history_page' USING ERRCODE = '22023';
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

  WITH history_rows AS (
    SELECT
      ride.id,
      ride.status,
      ride.ride_mode,
      ride.created_at,
      ride.updated_at,
      ride.completed_at,
      ride.delivered_at,
      ride.departure_time,
      ride.final_price,
      ride.actual_fare,
      ride.suggested_price,
      ride.payment_method,
      COALESCE(
        NULLIF(pg_catalog.btrim(pickup_location.name), ''),
        'Região de origem'
      ) AS origin_region,
      COALESCE(
        NULLIF(pg_catalog.btrim(dropoff_location.name), ''),
        'Região de destino'
      ) AS destination_region,
      CASE
        WHEN ride.status IN ('completed', 'delivered')
             AND ride.ride_mode = 'motoboy'
             AND ride.source_type = 'gastronomy'
             AND ride.source_id IS NOT NULL
          THEN pg_catalog.jsonb_build_array('customer', 'merchant')
        WHEN ride.status IN ('completed', 'delivered')
          THEN pg_catalog.jsonb_build_array('customer')
        ELSE '[]'::jsonb
      END AS feedback_roles
    FROM public.ride_requests ride
    LEFT JOIN public.locations pickup_location
      ON pickup_location.id = ride.pickup_location_id
    LEFT JOIN public.locations dropoff_location
      ON dropoff_location.id = ride.dropoff_location_id
    WHERE ride.driver_profile_id = v_driver_profile_id
      AND ride.status IN (
        'delivered',
        'completed',
        'cancelled_by_passenger',
        'cancelled_by_driver',
        'expired',
        'failed',
        'cancelled'
      )
    ORDER BY COALESCE(ride.completed_at, ride.delivered_at, ride.updated_at, ride.created_at) DESC,
             ride.id DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_strip_nulls(
        pg_catalog.jsonb_build_object(
          'id', row.id,
          'status', row.status,
          'ride_mode', row.ride_mode,
          'created_at', row.created_at,
          'updated_at', row.updated_at,
          'completed_at', row.completed_at,
          'delivered_at', row.delivered_at,
          'departure_time', row.departure_time,
          'final_price', row.final_price,
          'actual_fare', row.actual_fare,
          'suggested_price', row.suggested_price,
          'payment_method', row.payment_method,
          'origin', row.origin_region,
          'destination', row.destination_region,
          'location_precision', 'region_label',
          'feedback_roles', row.feedback_roles
        )
      )
    ),
    '[]'::jsonb
  )
  INTO v_rides
  FROM history_rows row;

  RETURN pg_catalog.jsonb_build_object('rides', v_rides);
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_get_driver_ride_history(uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_get_driver_ride_history(uuid, integer, integer)
  TO service_role;

COMMENT ON FUNCTION public.mobility_get_driver_ride_history(uuid, integer, integer) IS
  'G73 service-role-only terminal driver history read model. mobility-rpc supplies the authenticated user id; browser callers cannot select an internal driver profile. Returns only lifecycle, finance and coarse-region fields.';

-- Ride feedback no longer accepts an internal subject Profile UUID from the
-- browser. The caller selects a semantic role or generic counterparty; the
-- database derives the concrete Profile from the final ride and actor.
DROP FUNCTION IF EXISTS public.submit_ride_trust_feedback(
  uuid, uuid, integer, text, text
);

CREATE FUNCTION public.submit_ride_trust_feedback(
  p_ride_id uuid,
  p_subject_role text,
  p_rating integer,
  p_reason_code text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_ride public.ride_requests;
  v_merchant_profile_id uuid;
  v_subject_profile_id uuid;
  v_actor_role public.trust_actor_role;
  v_subject_role public.trust_actor_role;
  v_expected_driver_role text;
  v_severity public.delivery_occurrence_severity;
  v_event public.trust_events;
  v_description text := NULLIF(pg_catalog.btrim(COALESCE(p_description, '')), '');
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_subject_role NOT IN (
    'counterparty', 'customer', 'merchant', 'driver', 'courier'
  ) THEN
    RAISE EXCEPTION 'invalid_ride_feedback_subject_role' USING ERRCODE = '22023';
  END IF;

  IF p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'ride_feedback_rating_out_of_range' USING ERRCODE = '22023';
  END IF;

  IF v_description IS NOT NULL AND pg_catalog.char_length(v_description) > 1000 THEN
    RAISE EXCEPTION 'ride_feedback_description_too_long' USING ERRCODE = '22023';
  END IF;

  IF p_reason_code NOT IN (
    'smooth_operation', 'passenger_no_show', 'invalid_address',
    'pickup_delay', 'package_issue', 'abusive_behavior',
    'payment_or_handoff_issue', 'other_operational_issue',
    'driver_delay', 'unsafe_behavior', 'route_or_delivery_issue',
    'package_or_vehicle_issue'
  ) THEN
    RAISE EXCEPTION 'invalid_ride_feedback_reason' USING ERRCODE = '22023';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND OR v_ride.status::text NOT IN (
    'completed', 'delivered', 'failed',
    'cancelled_by_passenger', 'cancelled_by_driver', 'cancelled'
  ) THEN
    RAISE EXCEPTION 'final_ride_required' USING ERRCODE = '42501';
  END IF;

  IF v_ride.source_type = 'gastronomy' AND v_ride.source_id IS NOT NULL THEN
    SELECT order_row.merchant_profile_id
    INTO v_merchant_profile_id
    FROM public.orders order_row
    WHERE order_row.id = v_ride.source_id
    LIMIT 1;
  END IF;

  v_expected_driver_role := CASE
    WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'
    ELSE 'driver'
  END;

  IF v_actor_profile_id = v_ride.passenger_profile_id THEN
    IF p_subject_role NOT IN ('counterparty', v_expected_driver_role)
       OR v_ride.driver_profile_id IS NULL THEN
      RAISE EXCEPTION 'ride_feedback_target_not_authorized' USING ERRCODE = '42501';
    END IF;

    v_subject_profile_id := v_ride.driver_profile_id;
    v_actor_role := 'customer';
    v_subject_role := v_expected_driver_role::public.trust_actor_role;

  ELSIF v_actor_profile_id = v_ride.driver_profile_id THEN
    v_actor_role := CASE
      WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;

    IF p_subject_role IN ('counterparty', 'customer') THEN
      v_subject_profile_id := v_ride.passenger_profile_id;
      v_subject_role := 'customer';
    ELSIF p_subject_role = 'merchant'
          AND v_ride.ride_mode = 'motoboy'
          AND v_merchant_profile_id IS NOT NULL THEN
      v_subject_profile_id := v_merchant_profile_id;
      v_subject_role := 'merchant';
    ELSE
      RAISE EXCEPTION 'ride_feedback_target_not_authorized' USING ERRCODE = '42501';
    END IF;

  ELSE
    RAISE EXCEPTION 'ride_feedback_target_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF v_subject_profile_id IS NULL THEN
    RAISE EXCEPTION 'ride_feedback_target_not_available' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role = 'customer' AND p_reason_code IN (
    'passenger_no_show', 'invalid_address', 'pickup_delay',
    'package_issue', 'payment_or_handoff_issue'
  ) THEN
    RAISE EXCEPTION 'driver_feedback_reason_not_allowed_for_customer'
      USING ERRCODE = '22023';
  END IF;

  IF v_actor_role IN ('driver', 'courier') AND p_reason_code IN (
    'driver_delay', 'unsafe_behavior', 'route_or_delivery_issue',
    'package_or_vehicle_issue'
  ) THEN
    RAISE EXCEPTION 'customer_feedback_reason_not_allowed_for_driver'
      USING ERRCODE = '22023';
  END IF;

  IF p_reason_code IN ('pickup_delay', 'package_issue')
     AND v_subject_role <> 'merchant'
  THEN
    RAISE EXCEPTION 'merchant_feedback_target_required' USING ERRCODE = '22023';
  END IF;

  v_severity := (CASE p_reason_code
    WHEN 'smooth_operation' THEN 'low'
    WHEN 'passenger_no_show' THEN 'medium'
    WHEN 'invalid_address' THEN 'medium'
    WHEN 'pickup_delay' THEN 'medium'
    WHEN 'other_operational_issue' THEN 'medium'
    WHEN 'abusive_behavior' THEN 'critical'
    ELSE 'high'
  END)::public.delivery_occurrence_severity;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'ride_feedback', 40
  );

  v_event := private.upsert_trust_feedback(
    v_actor_profile_id,
    v_actor_role,
    v_subject_profile_id,
    v_subject_role,
    'ride',
    p_ride_id,
    'operational_feedback',
    p_rating,
    p_reason_code,
    v_severity,
    'private',
    v_description,
    pg_catalog.jsonb_build_object(
      'ride_id', p_ride_id,
      'ride_mode', v_ride.ride_mode,
      'source_type', v_ride.source_type
    )
  );

  RETURN pg_catalog.jsonb_build_object(
    'eventId', v_event.id,
    'status', v_event.status
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_ride_trust_feedback(
  uuid, text, integer, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_ride_trust_feedback(
  uuid, text, integer, text, text
) TO authenticated, service_role;

COMMENT ON FUNCTION public.submit_ride_trust_feedback(
  uuid, text, integer, text, text
) IS
  'G73 final-ride trust feedback command. Counterparty Profile ids are derived server-side from the authenticated actor, ride and semantic subject role; browser callers never choose the internal subject Profile id.';

COMMIT;