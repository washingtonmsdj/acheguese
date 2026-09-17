BEGIN;

-- Commercial mobility price is a server-owned fact. Browser-computed amounts
-- may be shown as provisional UX, but they are never authority for ride creation.
CREATE TABLE public.mobility_price_quotes (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  passenger_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL,
  pricing_rule_id uuid NOT NULL REFERENCES public.pricing_rules(id) ON DELETE RESTRICT,
  pricing_rule_updated_at timestamptz NOT NULL,
  pickup_address_id uuid NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
  dropoff_address_id uuid NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
  pickup_location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  dropoff_location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  origin_lat double precision NOT NULL,
  origin_lng double precision NOT NULL,
  destination_lat double precision NOT NULL,
  destination_lng double precision NOT NULL,
  distance_meters integer NOT NULL,
  duration_seconds integer NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  routing_provider text NOT NULL,
  routing_profile text NOT NULL,
  quote_engine_version text NOT NULL DEFAULT 'v1_core_only',
  issued_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by_ride_id uuid REFERENCES public.ride_requests(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT mobility_price_quotes_mode_contract CHECK (mode IN ('ride', 'motoboy')),
  CONSTRAINT mobility_price_quotes_coordinates_contract CHECK (
    origin_lat BETWEEN -90 AND 90
    AND destination_lat BETWEEN -90 AND 90
    AND origin_lng BETWEEN -180 AND 180
    AND destination_lng BETWEEN -180 AND 180
  ),
  CONSTRAINT mobility_price_quotes_route_metrics_contract CHECK (
    distance_meters > 0 AND distance_meters <= 2000000
    AND duration_seconds > 0 AND duration_seconds <= 172800
  ),
  CONSTRAINT mobility_price_quotes_amount_contract CHECK (amount > 0),
  CONSTRAINT mobility_price_quotes_currency_contract CHECK (currency = 'BRL'),
  CONSTRAINT mobility_price_quotes_lifecycle_contract CHECK (
    expires_at > issued_at
    AND (
      (consumed_at IS NULL AND consumed_by_ride_id IS NULL)
      OR
      (consumed_at IS NOT NULL AND consumed_by_ride_id IS NOT NULL)
    )
  ),
  CONSTRAINT mobility_price_quotes_metadata_contract CHECK (
    pg_catalog.jsonb_typeof(metadata) = 'object'
  )
);

ALTER TABLE public.mobility_price_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mobility_price_quotes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mobility_price_quotes TO service_role;

CREATE INDEX idx_mobility_price_quotes_profile_expiry
  ON public.mobility_price_quotes (passenger_profile_id, expires_at DESC);
CREATE INDEX idx_mobility_price_quotes_rule
  ON public.mobility_price_quotes (pricing_rule_id, issued_at DESC);
CREATE UNIQUE INDEX idx_mobility_price_quotes_consumed_ride
  ON public.mobility_price_quotes (consumed_by_ride_id)
  WHERE consumed_by_ride_id IS NOT NULL;

ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS pricing_quote_id uuid
    REFERENCES public.mobility_price_quotes(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ride_requests_pricing_quote_unique
  ON public.ride_requests (pricing_quote_id)
  WHERE pricing_quote_id IS NOT NULL;

-- Quote engine v1 deliberately supports only the core persisted formula.
-- If an approved rule has peak windows or additional fees, issuance fails closed
-- until those policy components have their own fully specified server contract.
CREATE OR REPLACE FUNCTION public.mobility_issue_price_quote(
  p_passenger_profile_id uuid,
  p_mode text,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_destination_lat double precision,
  p_destination_lng double precision,
  p_distance_meters integer,
  p_duration_seconds integer,
  p_routing_provider text,
  p_routing_profile text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_rule public.pricing_rules%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_quote_ttl_seconds integer;
  v_quote_ttl_text text;
  v_expected_routing_profile text;
  v_amount numeric;
  v_quote public.mobility_price_quotes%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_passenger_profile_id IS NULL
     OR p_pickup_address_id IS NULL
     OR p_dropoff_address_id IS NULL
     OR p_pickup_location_id IS NULL
     OR p_dropoff_location_id IS NULL
     OR p_mode NOT IN ('ride', 'motoboy')
     OR p_origin_lat NOT BETWEEN -90 AND 90
     OR p_destination_lat NOT BETWEEN -90 AND 90
     OR p_origin_lng NOT BETWEEN -180 AND 180
     OR p_destination_lng NOT BETWEEN -180 AND 180
     OR p_distance_meters IS NULL OR p_distance_meters <= 0 OR p_distance_meters > 2000000
     OR p_duration_seconds IS NULL OR p_duration_seconds <= 0 OR p_duration_seconds > 172800
     OR NULLIF(pg_catalog.btrim(COALESCE(p_routing_provider, '')), '') IS NULL
     OR NULLIF(pg_catalog.btrim(COALESCE(p_routing_profile, '')), '') IS NULL THEN
    RAISE EXCEPTION 'invalid mobility quote request' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles profile WHERE profile.id = p_passenger_profile_id
  ) THEN
    RAISE EXCEPTION 'passenger profile not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT rule.*
  INTO v_rule
  FROM public.pricing_rules rule
  WHERE rule.mode = p_mode
    AND rule.is_active = true
    AND COALESCE(rule.metadata ->> 'commercial_status', '') = 'approved'
    AND (rule.valid_from IS NULL OR rule.valid_from <= v_now)
    AND (rule.valid_until IS NULL OR rule.valid_until >= v_now)
  ORDER BY rule.updated_at DESC, rule.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'commercial pricing is not approved for mode %', p_mode
      USING ERRCODE = '55000';
  END IF;

  v_quote_ttl_text := v_rule.metadata ->> 'quote_ttl_seconds';
  IF v_quote_ttl_text IS NULL OR v_quote_ttl_text !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'approved pricing rule is missing quote_ttl_seconds'
      USING ERRCODE = '55000';
  END IF;
  v_quote_ttl_seconds := v_quote_ttl_text::integer;
  IF v_quote_ttl_seconds < 30 OR v_quote_ttl_seconds > 1800 THEN
    RAISE EXCEPTION 'approved pricing rule has invalid quote_ttl_seconds'
      USING ERRCODE = '55000';
  END IF;

  v_expected_routing_profile := NULLIF(pg_catalog.btrim(COALESCE(v_rule.metadata ->> 'routing_profile', '')), '');
  IF v_expected_routing_profile IS NULL OR v_expected_routing_profile IS DISTINCT FROM p_routing_profile THEN
    RAISE EXCEPTION 'approved pricing rule routing profile is unavailable or mismatched'
      USING ERRCODE = '55000';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.pricing_peak_hour_multipliers peak
    WHERE peak.rule_id = v_rule.id AND peak.is_active = true
  ) OR EXISTS (
    SELECT 1
    FROM public.pricing_additional_fees fee
    WHERE fee.rule_id = v_rule.id AND fee.is_active = true
  ) THEN
    RAISE EXCEPTION 'approved pricing rule uses components unsupported by quote engine v1'
      USING ERRCODE = '55000';
  END IF;

  v_amount :=
    v_rule.base_fare
    + (p_distance_meters::numeric / 1000.0) * v_rule.price_per_km
    + (p_duration_seconds::numeric / 60.0) * v_rule.price_per_minute;

  v_amount := GREATEST(v_amount, v_rule.minimum_fare);
  IF v_rule.maximum_fare IS NOT NULL THEN
    v_amount := LEAST(v_amount, v_rule.maximum_fare);
  END IF;
  v_amount := pg_catalog.round(v_amount, 2);

  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'approved pricing rule produced invalid quote amount'
      USING ERRCODE = '55000';
  END IF;

  INSERT INTO public.mobility_price_quotes (
    passenger_profile_id,
    mode,
    pricing_rule_id,
    pricing_rule_updated_at,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    distance_meters,
    duration_seconds,
    amount,
    currency,
    routing_provider,
    routing_profile,
    quote_engine_version,
    issued_at,
    expires_at,
    metadata
  ) VALUES (
    p_passenger_profile_id,
    p_mode,
    v_rule.id,
    v_rule.updated_at,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    p_origin_lat,
    p_origin_lng,
    p_destination_lat,
    p_destination_lng,
    p_distance_meters,
    p_duration_seconds,
    v_amount,
    'BRL',
    pg_catalog.left(pg_catalog.btrim(p_routing_provider), 64),
    pg_catalog.left(pg_catalog.btrim(p_routing_profile), 32),
    'v1_core_only',
    v_now,
    v_now + pg_catalog.make_interval(secs => v_quote_ttl_seconds),
    pg_catalog.jsonb_build_object('pricing_rule_name', v_rule.name)
  )
  RETURNING * INTO v_quote;

  RETURN pg_catalog.jsonb_build_object(
    'quote_id', v_quote.id,
    'mode', v_quote.mode,
    'amount', v_quote.amount,
    'currency', v_quote.currency,
    'distance_meters', v_quote.distance_meters,
    'duration_seconds', v_quote.duration_seconds,
    'expires_at', v_quote.expires_at,
    'pricing_rule_id', v_quote.pricing_rule_id,
    'quote_engine_version', v_quote.quote_engine_version
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_issue_price_quote(
  uuid,text,uuid,uuid,uuid,uuid,double precision,double precision,double precision,double precision,integer,integer,text,text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_issue_price_quote(
  uuid,text,uuid,uuid,uuid,uuid,double precision,double precision,double precision,double precision,integer,integer,text,text
) TO service_role;

CREATE OR REPLACE FUNCTION private.require_mobility_price_quote(
  p_quote_id uuid,
  p_passenger_profile_id uuid,
  p_mode text,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_destination_lat double precision,
  p_destination_lng double precision
)
RETURNS public.mobility_price_quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_quote public.mobility_price_quotes%ROWTYPE;
  v_rule public.pricing_rules%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_coordinate_tolerance constant double precision := 0.000001;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  SELECT quote.*
  INTO v_quote
  FROM public.mobility_price_quotes quote
  WHERE quote.id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mobility price quote not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_quote.consumed_at IS NOT NULL OR v_quote.consumed_by_ride_id IS NOT NULL THEN
    RAISE EXCEPTION 'mobility price quote already consumed' USING ERRCODE = '23505';
  END IF;
  IF v_quote.expires_at <= v_now THEN
    RAISE EXCEPTION 'mobility price quote expired' USING ERRCODE = '22023';
  END IF;
  IF v_quote.passenger_profile_id IS DISTINCT FROM p_passenger_profile_id
     OR v_quote.mode IS DISTINCT FROM p_mode
     OR v_quote.pickup_address_id IS DISTINCT FROM p_pickup_address_id
     OR v_quote.dropoff_address_id IS DISTINCT FROM p_dropoff_address_id
     OR v_quote.pickup_location_id IS DISTINCT FROM p_pickup_location_id
     OR v_quote.dropoff_location_id IS DISTINCT FROM p_dropoff_location_id
     OR pg_catalog.abs(v_quote.origin_lat - p_origin_lat) > v_coordinate_tolerance
     OR pg_catalog.abs(v_quote.origin_lng - p_origin_lng) > v_coordinate_tolerance
     OR pg_catalog.abs(v_quote.destination_lat - p_destination_lat) > v_coordinate_tolerance
     OR pg_catalog.abs(v_quote.destination_lng - p_destination_lng) > v_coordinate_tolerance THEN
    RAISE EXCEPTION 'mobility price quote does not match ride request'
      USING ERRCODE = '42501';
  END IF;

  SELECT rule.*
  INTO v_rule
  FROM public.pricing_rules rule
  WHERE rule.id = v_quote.pricing_rule_id
    AND rule.is_active = true
    AND COALESCE(rule.metadata ->> 'commercial_status', '') = 'approved'
  FOR SHARE;

  IF NOT FOUND
     OR v_rule.updated_at IS DISTINCT FROM v_quote.pricing_rule_updated_at
     OR (v_rule.valid_from IS NOT NULL AND v_rule.valid_from > v_now)
     OR (v_rule.valid_until IS NOT NULL AND v_rule.valid_until < v_now) THEN
    RAISE EXCEPTION 'mobility price quote pricing rule is no longer valid'
      USING ERRCODE = '22023';
  END IF;

  RETURN v_quote;
END;
$function$;

REVOKE ALL ON FUNCTION private.require_mobility_price_quote(
  uuid,uuid,text,uuid,uuid,uuid,uuid,double precision,double precision,double precision,double precision
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mobility_create_ride_from_quote_atomic(
  p_quote_id uuid,
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
  v_quote public.mobility_price_quotes%ROWTYPE;
  v_result jsonb;
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  v_quote := private.require_mobility_price_quote(
    p_quote_id,
    p_passenger_profile_id,
    'ride',
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    p_origin_lat::double precision,
    p_origin_lng::double precision,
    p_destination_lat::double precision,
    p_destination_lng::double precision
  );

  v_result := public.mobility_create_ride_atomic(
    p_passenger_profile_id,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    p_origin,
    p_destination,
    p_origin_lat,
    p_origin_lng,
    p_destination_lat,
    p_destination_lng,
    v_quote.amount,
    p_available_seats,
    p_observation,
    p_payment_method,
    p_departure_time
  );

  IF COALESCE((v_result ->> 'success')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'atomic ride creation did not succeed' USING ERRCODE = '40001';
  END IF;

  v_ride_id := (v_result ->> 'ride_id')::uuid;
  UPDATE public.ride_requests SET pricing_quote_id = p_quote_id WHERE id = v_ride_id;
  UPDATE public.mobility_price_quotes
  SET consumed_at = v_now, consumed_by_ride_id = v_ride_id
  WHERE id = p_quote_id AND consumed_at IS NULL;

  RETURN v_result || pg_catalog.jsonb_build_object('quote_id', p_quote_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_create_ride_from_quote_atomic(
  uuid,uuid,uuid,uuid,uuid,uuid,text,text,numeric,numeric,numeric,numeric,integer,text,text,timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_ride_from_quote_atomic(
  uuid,uuid,uuid,uuid,uuid,uuid,text,text,numeric,numeric,numeric,numeric,integer,text,text,timestamptz
) TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_create_delivery_from_quote_atomic(
  p_quote_id uuid,
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
  v_quote public.mobility_price_quotes%ROWTYPE;
  v_result jsonb;
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  v_quote := private.require_mobility_price_quote(
    p_quote_id,
    p_passenger_profile_id,
    'motoboy',
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    p_origin_lat::double precision,
    p_origin_lng::double precision,
    p_destination_lat::double precision,
    p_destination_lng::double precision
  );

  v_result := public.mobility_create_delivery_atomic(
    p_passenger_profile_id,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    p_source_type,
    p_source_id,
    p_recipient_name,
    p_recipient_phone,
    p_delivery_notes,
    p_package_description,
    p_package_size,
    p_origin,
    p_destination,
    p_origin_lat,
    p_origin_lng,
    p_destination_lat,
    p_destination_lng,
    v_quote.amount,
    p_observation,
    p_payment_method,
    p_departure_time
  );

  IF COALESCE((v_result ->> 'success')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'atomic delivery creation did not succeed' USING ERRCODE = '40001';
  END IF;

  v_ride_id := (v_result ->> 'ride_id')::uuid;
  UPDATE public.ride_requests SET pricing_quote_id = p_quote_id WHERE id = v_ride_id;
  UPDATE public.mobility_price_quotes
  SET consumed_at = v_now, consumed_by_ride_id = v_ride_id
  WHERE id = p_quote_id AND consumed_at IS NULL;

  RETURN v_result || pg_catalog.jsonb_build_object('quote_id', p_quote_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_create_delivery_from_quote_atomic(
  uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,numeric,text,text,timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_delivery_from_quote_atomic(
  uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,numeric,text,text,timestamptz
) TO service_role;

COMMENT ON TABLE public.mobility_price_quotes IS
  'Server-owned, single-use mobility quote bound to requester, route, approved pricing rule version and authoritative routing metrics.';
COMMENT ON FUNCTION public.mobility_issue_price_quote(
  uuid,text,uuid,uuid,uuid,uuid,double precision,double precision,double precision,double precision,integer,integer,text,text
) IS
  'Service-only quote issuer. Refuses provisional pricing and unsupported policy components; computes amount from authoritative persisted rule plus server-provided route metrics.';
COMMENT ON FUNCTION private.require_mobility_price_quote(
  uuid,uuid,text,uuid,uuid,uuid,uuid,double precision,double precision,double precision,double precision
) IS
  'Internal single-use quote validator. Locks quote and verifies requester, mode, route, expiry and unchanged approved pricing rule.';

NOTIFY pgrst, 'reload schema';

COMMIT;
