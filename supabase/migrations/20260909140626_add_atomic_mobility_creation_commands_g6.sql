
CREATE OR REPLACE FUNCTION public.mobility_create_ride_atomic(
  p_passenger_profile_id uuid,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_origin text DEFAULT NULL,
  p_destination text DEFAULT NULL,
  p_origin_lat numeric DEFAULT NULL,
  p_origin_lng numeric DEFAULT NULL,
  p_destination_lat numeric DEFAULT NULL,
  p_destination_lng numeric DEFAULT NULL,
  p_suggested_price numeric DEFAULT NULL,
  p_available_seats integer DEFAULT 1,
  p_observation text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_departure_time timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_suggested_price IS NOT NULL AND p_suggested_price < 5 THEN
    RAISE EXCEPTION 'suggested price below minimum' USING ERRCODE = '22023';
  END IF;

  IF p_available_seats IS NULL OR p_available_seats < 1 OR p_available_seats > 8 THEN
    RAISE EXCEPTION 'invalid available seats' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    ride_mode,
    origin,
    destination,
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    suggested_price,
    available_seats,
    observation,
    payment_method,
    departure_time,
    created_at,
    updated_at
  )
  VALUES (
    p_passenger_profile_id,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    'requested',
    'ride',
    NULLIF(pg_catalog.left(COALESCE(p_origin, ''), 500), ''),
    NULLIF(pg_catalog.left(COALESCE(p_destination, ''), 500), ''),
    p_origin_lat,
    p_origin_lng,
    p_destination_lat,
    p_destination_lng,
    p_suggested_price,
    p_available_seats,
    NULLIF(pg_catalog.left(COALESCE(p_observation, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_payment_method, ''), 80), ''),
    COALESCE(p_departure_time, v_now),
    v_now,
    v_now
  )
  RETURNING id INTO v_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  )
  VALUES (
    v_ride_id,
    NULL,
    'requested',
    p_passenger_profile_id::text,
    'Ride created',
    pg_catalog.jsonb_build_object('event', 'ride_created', 'ride_mode', 'ride'),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'ride_id', v_ride_id,
    'status', 'requested'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_create_ride_atomic(
  uuid, uuid, uuid, uuid, uuid, text, text, numeric, numeric, numeric, numeric,
  numeric, integer, text, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_ride_atomic(
  uuid, uuid, uuid, uuid, uuid, text, text, numeric, numeric, numeric, numeric,
  numeric, integer, text, text, timestamptz
) TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_create_delivery_atomic(
  p_passenger_profile_id uuid,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_recipient_name text,
  p_recipient_phone text DEFAULT NULL,
  p_delivery_notes text DEFAULT NULL,
  p_package_description text DEFAULT NULL,
  p_package_size text DEFAULT 'small',
  p_origin text DEFAULT NULL,
  p_destination text DEFAULT NULL,
  p_origin_lat numeric DEFAULT NULL,
  p_origin_lng numeric DEFAULT NULL,
  p_destination_lat numeric DEFAULT NULL,
  p_destination_lng numeric DEFAULT NULL,
  p_suggested_price numeric DEFAULT NULL,
  p_observation text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_departure_time timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_source_type NOT IN ('passenger','business','gastronomy','service') THEN
    RAISE EXCEPTION 'invalid source type' USING ERRCODE = '22023';
  END IF;

  IF p_source_type <> 'passenger' AND p_source_id IS NULL THEN
    RAISE EXCEPTION 'source id is required' USING ERRCODE = '22023';
  END IF;

  IF btrim(COALESCE(p_recipient_name, '')) = '' THEN
    RAISE EXCEPTION 'recipient name is required' USING ERRCODE = '22023';
  END IF;

  IF p_package_size NOT IN ('small','medium','large') THEN
    RAISE EXCEPTION 'invalid package size' USING ERRCODE = '22023';
  END IF;

  IF p_suggested_price IS NOT NULL AND p_suggested_price < 5 THEN
    RAISE EXCEPTION 'suggested price below minimum' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    ride_mode,
    source_type,
    source_id,
    recipient_name,
    recipient_phone,
    delivery_notes,
    package_description,
    package_size,
    origin,
    destination,
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    suggested_price,
    observation,
    payment_method,
    departure_time,
    created_at,
    updated_at
  )
  VALUES (
    p_passenger_profile_id,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    'requested',
    'motoboy',
    p_source_type,
    p_source_id,
    pg_catalog.left(btrim(p_recipient_name), 200),
    NULLIF(pg_catalog.left(COALESCE(p_recipient_phone, ''), 80), ''),
    NULLIF(pg_catalog.left(COALESCE(p_delivery_notes, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_package_description, ''), 1000), ''),
    p_package_size,
    NULLIF(pg_catalog.left(COALESCE(p_origin, ''), 500), ''),
    NULLIF(pg_catalog.left(COALESCE(p_destination, ''), 500), ''),
    p_origin_lat,
    p_origin_lng,
    p_destination_lat,
    p_destination_lng,
    p_suggested_price,
    NULLIF(pg_catalog.left(COALESCE(p_observation, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_payment_method, ''), 80), ''),
    COALESCE(p_departure_time, v_now),
    v_now,
    v_now
  )
  RETURNING id INTO v_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  )
  VALUES (
    v_ride_id,
    NULL,
    'requested',
    p_passenger_profile_id::text,
    'Delivery created',
    pg_catalog.jsonb_build_object(
      'event', 'delivery_created',
      'ride_mode', 'motoboy',
      'source_type', p_source_type,
      'source_id', p_source_id
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'ride_id', v_ride_id,
    'status', 'requested'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_create_delivery_atomic(
  uuid, uuid, uuid, uuid, uuid, text, uuid, text, text, text, text, text,
  text, text, numeric, numeric, numeric, numeric, numeric, text, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_delivery_atomic(
  uuid, uuid, uuid, uuid, uuid, text, uuid, text, text, text, text, text,
  text, text, numeric, numeric, numeric, numeric, numeric, text, text, timestamptz
) TO service_role;
