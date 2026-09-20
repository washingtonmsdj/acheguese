BEGIN;

-- The first quote migration introduced explicit quote-id wrappers for staged
-- cutover. The existing mobility broker still calls mobility_create_*_atomic.
-- Instead of keeping two creation authorities, harden the canonical functions
-- themselves to claim exactly one valid server-owned quote. The temporary
-- wrappers are retired before any production caller adopts them.
DROP FUNCTION IF EXISTS public.mobility_create_ride_from_quote_atomic(
  uuid,uuid,uuid,uuid,uuid,uuid,text,text,numeric,numeric,numeric,numeric,integer,text,text,timestamptz
);
DROP FUNCTION IF EXISTS public.mobility_create_delivery_from_quote_atomic(
  uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,numeric,text,text,timestamptz
);

CREATE OR REPLACE FUNCTION private.claim_matching_mobility_price_quote(
  p_passenger_profile_id uuid,
  p_mode text,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_amount numeric
)
RETURNS public.mobility_price_quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_quote public.mobility_price_quotes%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_passenger_profile_id IS NULL
     OR p_mode NOT IN ('ride', 'motoboy')
     OR p_pickup_address_id IS NULL
     OR p_dropoff_address_id IS NULL
     OR p_amount IS NULL
     OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid mobility quote claim' USING ERRCODE = '22023';
  END IF;

  SELECT quote.*
  INTO v_quote
  FROM public.mobility_price_quotes quote
  WHERE quote.passenger_profile_id = p_passenger_profile_id
    AND quote.mode = p_mode
    AND quote.pickup_address_id = p_pickup_address_id
    AND quote.dropoff_address_id = p_dropoff_address_id
    AND quote.amount = pg_catalog.round(p_amount, 2)
    AND quote.consumed_at IS NULL
    AND quote.consumed_by_ride_id IS NULL
    AND quote.expires_at > pg_catalog.clock_timestamp()
  ORDER BY quote.issued_at DESC, quote.id DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'valid server-owned mobility quote is required'
      USING ERRCODE = '42501';
  END IF;

  -- Reuse the canonical invariant checker so a quote immediately becomes
  -- invalid when its approved pricing rule is changed, disabled or expires.
  v_quote := private.require_mobility_price_quote(
    v_quote.id,
    v_quote.passenger_profile_id,
    v_quote.mode,
    v_quote.pickup_address_id,
    v_quote.dropoff_address_id,
    v_quote.pickup_location_id,
    v_quote.dropoff_location_id,
    v_quote.origin_lat,
    v_quote.origin_lng,
    v_quote.destination_lat,
    v_quote.destination_lng
  );

  RETURN v_quote;
END;
$function$;

REVOKE ALL ON FUNCTION private.claim_matching_mobility_price_quote(
  uuid,text,uuid,uuid,numeric
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mobility_create_ride_atomic(
  p_passenger_profile_id uuid,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_origin text DEFAULT NULL::text,
  p_destination text DEFAULT NULL::text,
  p_origin_lat numeric DEFAULT NULL::numeric,
  p_origin_lng numeric DEFAULT NULL::numeric,
  p_destination_lat numeric DEFAULT NULL::numeric,
  p_destination_lng numeric DEFAULT NULL::numeric,
  p_suggested_price numeric DEFAULT NULL::numeric,
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
  IF p_available_seats IS NULL OR p_available_seats < 1 OR p_available_seats > 8 THEN
    RAISE EXCEPTION 'invalid available seats' USING ERRCODE = '22023';
  END IF;

  v_quote := private.claim_matching_mobility_price_quote(
    p_passenger_profile_id,
    'ride',
    p_pickup_address_id,
    p_dropoff_address_id,
    p_suggested_price
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
    p_passenger_profile_id,
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
    p_passenger_profile_id::text,
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
  WHERE profile.id = p_passenger_profile_id;

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

CREATE OR REPLACE FUNCTION public.mobility_create_delivery_atomic(
  p_passenger_profile_id uuid,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_recipient_name text,
  p_recipient_phone text DEFAULT NULL::text,
  p_delivery_notes text DEFAULT NULL::text,
  p_package_description text DEFAULT NULL::text,
  p_package_size text DEFAULT 'small'::text,
  p_origin text DEFAULT NULL::text,
  p_destination text DEFAULT NULL::text,
  p_origin_lat numeric DEFAULT NULL::numeric,
  p_origin_lng numeric DEFAULT NULL::numeric,
  p_destination_lat numeric DEFAULT NULL::numeric,
  p_destination_lng numeric DEFAULT NULL::numeric,
  p_suggested_price numeric DEFAULT NULL::numeric,
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

  v_quote := private.claim_matching_mobility_price_quote(
    p_passenger_profile_id,
    'motoboy',
    p_pickup_address_id,
    p_dropoff_address_id,
    p_suggested_price
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
    p_passenger_profile_id,
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
    p_passenger_profile_id::text,
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
  WHERE profile.id = p_passenger_profile_id;

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

COMMENT ON FUNCTION private.claim_matching_mobility_price_quote(
  uuid,text,uuid,uuid,numeric
) IS
  'Internal creation gate: claims one unused, unexpired server-owned quote bound to passenger/mode/address/amount and revalidates the approved pricing rule.';
COMMENT ON FUNCTION public.mobility_create_ride_atomic(
  uuid,uuid,uuid,uuid,uuid,text,text,numeric,numeric,numeric,numeric,numeric,integer,text,text,timestamptz
) IS
  'Canonical service-only ride creation. Browser price/coordinates are not authority; creation requires and consumes a matching server-owned quote and persists its canonical route/pricing provenance.';
COMMENT ON FUNCTION public.mobility_create_delivery_atomic(
  uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,text,text,timestamptz
) IS
  'Canonical service-only delivery creation. Browser price/coordinates are not authority; creation requires and consumes a matching motoboy quote and persists its canonical route/pricing provenance.';

NOTIFY pgrst, 'reload schema';

COMMIT;
