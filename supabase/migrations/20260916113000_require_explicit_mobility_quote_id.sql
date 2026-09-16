BEGIN;

-- G81: creation identity is the quote UUID itself. The previous canonical
-- functions accepted a browser-visible amount and then searched for a matching
-- quote. That was server-owned pricing, but it still left amount matching as a
-- compatibility bridge. Retire that bridge: creation now accepts only quote_id
-- as pricing/route authority and derives passenger, addresses, territories,
-- coordinates and amount from the locked quote row.

DROP FUNCTION IF EXISTS public.mobility_create_ride_atomic(
  uuid,uuid,uuid,uuid,uuid,text,text,numeric,numeric,numeric,numeric,numeric,integer,text,text,timestamptz
);

DROP FUNCTION IF EXISTS public.mobility_create_delivery_atomic(
  uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,text,text,timestamptz
);

DROP FUNCTION IF EXISTS private.claim_matching_mobility_price_quote(
  uuid,text,uuid,uuid,numeric
);

CREATE FUNCTION public.mobility_create_ride_atomic(
  p_quote_id uuid,
  p_origin text DEFAULT NULL::text,
  p_destination text DEFAULT NULL::text,
  p_available_seats integer DEFAULT 1,
  p_observation text DEFAULT NULL::text,
  p_payment_method text DEFAULT NULL::text,
  p_departure_time timestamptz DEFAULT NULL::timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '7s'
AS $function$
DECLARE
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_pin_required boolean := false;
  v_quote public.mobility_price_quotes%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;
  IF p_quote_id IS NULL THEN
    RAISE EXCEPTION 'mobility price quote id is required' USING ERRCODE = '22023';
  END IF;
  IF p_available_seats IS NULL OR p_available_seats < 1 OR p_available_seats > 8 THEN
    RAISE EXCEPTION 'invalid available seats' USING ERRCODE = '22023';
  END IF;

  SELECT quote.*
  INTO v_quote
  FROM public.mobility_price_quotes quote
  WHERE quote.id = p_quote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mobility price quote not found' USING ERRCODE = 'P0002';
  END IF;

  v_quote := private.require_mobility_price_quote(
    v_quote.id,
    v_quote.passenger_profile_id,
    'ride',
    v_quote.pickup_address_id,
    v_quote.dropoff_address_id,
    v_quote.pickup_location_id,
    v_quote.dropoff_location_id,
    v_quote.origin_lat,
    v_quote.origin_lng,
    v_quote.destination_lat,
    v_quote.destination_lng
  );

  INSERT INTO public.ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    pricing_quote_id,
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
  ) VALUES (
    v_quote.passenger_profile_id,
    v_quote.pickup_address_id,
    v_quote.dropoff_address_id,
    v_quote.pickup_location_id,
    v_quote.dropoff_location_id,
    v_quote.id,
    'requested',
    'ride',
    NULLIF(pg_catalog.left(COALESCE(p_origin, ''), 500), ''),
    NULLIF(pg_catalog.left(COALESCE(p_destination, ''), 500), ''),
    v_quote.origin_lat,
    v_quote.origin_lng,
    v_quote.destination_lat,
    v_quote.destination_lng,
    v_quote.amount,
    p_available_seats,
    NULLIF(pg_catalog.left(COALESCE(p_observation, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_payment_method, ''), 80), ''),
    COALESCE(p_departure_time, v_now),
    v_now,
    v_now
  ) RETURNING id INTO v_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    v_ride_id,
    'none',
    'requested',
    v_quote.passenger_profile_id::text,
    'Ride created',
    pg_catalog.jsonb_build_object(
      'event', 'ride_created',
      'ride_mode', 'ride',
      'pricing_quote_id', v_quote.id,
      'pricing_rule_id', v_quote.pricing_rule_id,
      'quote_engine_version', v_quote.quote_engine_version
    ),
    v_now
  );

  SELECT COALESCE(profile.requires_pin_for_rides, false)
  INTO v_pin_required
  FROM public.profiles profile
  WHERE profile.id = v_quote.passenger_profile_id;

  IF v_pin_required THEN
    INSERT INTO public.operational_verifications (
      ride_id, verification_type, is_required, required_by, required_at,
      status, verification_attempts, created_at, updated_at
    ) VALUES (
      v_ride_id, 'pin', true, 'passenger', v_now,
      'pending', 0, v_now, v_now
    );
  END IF;

  UPDATE public.mobility_price_quotes quote
  SET consumed_at = v_now,
      consumed_by_ride_id = v_ride_id
  WHERE quote.id = v_quote.id
    AND quote.consumed_at IS NULL
    AND quote.consumed_by_ride_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mobility quote consumption race detected' USING ERRCODE = '40001';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'ride_id', v_ride_id,
    'status', 'requested',
    'pin_required', v_pin_required,
    'quote_id', v_quote.id
  );
END;
$function$;

CREATE FUNCTION public.mobility_create_delivery_atomic(
  p_quote_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_recipient_name text,
  p_recipient_phone text DEFAULT NULL::text,
  p_delivery_notes text DEFAULT NULL::text,
  p_package_description text DEFAULT NULL::text,
  p_package_size text DEFAULT 'small'::text,
  p_origin text DEFAULT NULL::text,
  p_destination text DEFAULT NULL::text,
  p_observation text DEFAULT NULL::text,
  p_payment_method text DEFAULT NULL::text,
  p_departure_time timestamptz DEFAULT NULL::timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '7s'
AS $function$
DECLARE
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_pin_required boolean := false;
  v_quote public.mobility_price_quotes%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;
  IF p_quote_id IS NULL THEN
    RAISE EXCEPTION 'mobility price quote id is required' USING ERRCODE = '22023';
  END IF;
  IF p_source_type NOT IN ('passenger','business','gastronomy','service') THEN
    RAISE EXCEPTION 'invalid source type' USING ERRCODE = '22023';
  END IF;
  IF p_source_type <> 'passenger' AND p_source_id IS NULL THEN
    RAISE EXCEPTION 'source id is required' USING ERRCODE = '22023';
  END IF;
  IF pg_catalog.btrim(COALESCE(p_recipient_name, '')) = '' THEN
    RAISE EXCEPTION 'recipient name is required' USING ERRCODE = '22023';
  END IF;
  IF p_package_size NOT IN ('small','medium','large') THEN
    RAISE EXCEPTION 'invalid package size' USING ERRCODE = '22023';
  END IF;

  SELECT quote.*
  INTO v_quote
  FROM public.mobility_price_quotes quote
  WHERE quote.id = p_quote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mobility price quote not found' USING ERRCODE = 'P0002';
  END IF;

  v_quote := private.require_mobility_price_quote(
    v_quote.id,
    v_quote.passenger_profile_id,
    'motoboy',
    v_quote.pickup_address_id,
    v_quote.dropoff_address_id,
    v_quote.pickup_location_id,
    v_quote.dropoff_location_id,
    v_quote.origin_lat,
    v_quote.origin_lng,
    v_quote.destination_lat,
    v_quote.destination_lng
  );

  INSERT INTO public.ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    pricing_quote_id,
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
  ) VALUES (
    v_quote.passenger_profile_id,
    v_quote.pickup_address_id,
    v_quote.dropoff_address_id,
    v_quote.pickup_location_id,
    v_quote.dropoff_location_id,
    v_quote.id,
    'requested',
    'motoboy',
    p_source_type,
    p_source_id,
    pg_catalog.left(pg_catalog.btrim(p_recipient_name), 200),
    NULLIF(pg_catalog.left(COALESCE(p_recipient_phone, ''), 80), ''),
    NULLIF(pg_catalog.left(COALESCE(p_delivery_notes, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_package_description, ''), 1000), ''),
    p_package_size,
    NULLIF(pg_catalog.left(COALESCE(p_origin, ''), 500), ''),
    NULLIF(pg_catalog.left(COALESCE(p_destination, ''), 500), ''),
    v_quote.origin_lat,
    v_quote.origin_lng,
    v_quote.destination_lat,
    v_quote.destination_lng,
    v_quote.amount,
    NULLIF(pg_catalog.left(COALESCE(p_observation, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_payment_method, ''), 80), ''),
    COALESCE(p_departure_time, v_now),
    v_now,
    v_now
  ) RETURNING id INTO v_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    v_ride_id,
    'none',
    'requested',
    v_quote.passenger_profile_id::text,
    'Delivery created',
    pg_catalog.jsonb_build_object(
      'event', 'delivery_created',
      'ride_mode', 'motoboy',
      'source_type', p_source_type,
      'source_id', p_source_id,
      'pricing_quote_id', v_quote.id,
      'pricing_rule_id', v_quote.pricing_rule_id,
      'quote_engine_version', v_quote.quote_engine_version
    ),
    v_now
  );

  SELECT COALESCE(profile.requires_pin_for_deliveries, false)
  INTO v_pin_required
  FROM public.profiles profile
  WHERE profile.id = v_quote.passenger_profile_id;

  IF v_pin_required THEN
    INSERT INTO public.operational_verifications (
      ride_id, verification_type, is_required, required_by, required_at,
      status, verification_attempts, created_at, updated_at
    ) VALUES (
      v_ride_id, 'pin', true, 'sender', v_now,
      'pending', 0, v_now, v_now
    );
  END IF;

  UPDATE public.mobility_price_quotes quote
  SET consumed_at = v_now,
      consumed_by_ride_id = v_ride_id
  WHERE quote.id = v_quote.id
    AND quote.consumed_at IS NULL
    AND quote.consumed_by_ride_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mobility quote consumption race detected' USING ERRCODE = '40001';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'ride_id', v_ride_id,
    'status', 'requested',
    'pin_required', v_pin_required,
    'quote_id', v_quote.id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_create_ride_atomic(
  uuid,text,text,integer,text,text,timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_ride_atomic(
  uuid,text,text,integer,text,text,timestamptz
) TO service_role;

REVOKE ALL ON FUNCTION public.mobility_create_delivery_atomic(
  uuid,text,uuid,text,text,text,text,text,text,text,text,text,timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_delivery_atomic(
  uuid,text,uuid,text,text,text,text,text,text,text,text,text,timestamptz
) TO service_role;

COMMENT ON FUNCTION public.mobility_create_ride_atomic(
  uuid,text,text,integer,text,text,timestamptz
) IS
  'Canonical service-only ride creation. quote_id is the only pricing/route authority; passenger, addresses, territory, coordinates and amount are loaded from the locked server-owned quote.';

COMMENT ON FUNCTION public.mobility_create_delivery_atomic(
  uuid,text,uuid,text,text,text,text,text,text,text,text,text,timestamptz
) IS
  'Canonical service-only motoboy creation. quote_id is the only pricing/route authority; passenger, addresses, territory, coordinates and amount are loaded from the locked server-owned quote.';

NOTIFY pgrst, 'reload schema';

COMMIT;
