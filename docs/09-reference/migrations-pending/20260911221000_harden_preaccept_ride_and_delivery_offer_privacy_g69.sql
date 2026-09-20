BEGIN;

-- A dispatch assignment is not yet an accepted participant relationship.
-- Before explicit driver acceptance the only driver-visible surface is the
-- redacted offer read model. Direct SELECT on ride_requests would otherwise
-- bypass that boundary and expose exact addresses, recipient data and free-text
-- delivery metadata from the base row.
--
-- G73 already established the stricter terminal-history boundary in main. This
-- integration is intentionally monotonic and preserves that final policy:
-- drivers retain full ride rows only while their participation is operational.
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

-- G60 already coarse-grained exact route data. G69 additionally removes
-- identifiers and requester-controlled free text that are not required to
-- decide whether to accept an offer. package_size remains available as the
-- operational load signal; full package/recipient details are available only
-- after acceptance through the participant-authorized ride path.
CREATE OR REPLACE FUNCTION public.mobility_list_driver_offers(
  p_actor_user_id uuid,
  p_driver_profile_id uuid,
  p_strategy text,
  p_limit integer DEFAULT 10,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_package_sizes text[] DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_ascending boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_base jsonb;
  v_offers jsonb;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required'
      USING ERRCODE = '42501';
  END IF;

  v_base := private.mobility_list_driver_offers_base_g60(
    p_actor_user_id,
    p_driver_profile_id,
    p_strategy,
    p_limit,
    p_min_price,
    p_max_price,
    p_package_sizes,
    p_sort_by,
    p_ascending
  );

  WITH raw_offers AS (
    SELECT offer.value, offer.ordinality
    FROM pg_catalog.jsonb_array_elements(
      COALESCE(v_base->'offers', '[]'::jsonb)
    ) WITH ORDINALITY AS offer(value, ordinality)
  ),
  redacted AS (
    SELECT
      (
        raw.value - ARRAY[
          'origin',
          'destination',
          'origin_lat',
          'origin_lng',
          'destination_lat',
          'destination_lng',
          'passenger_profile_id',
          'source_id',
          'package_description'
        ]::text[]
      ) || pg_catalog.jsonb_build_object(
        'origin', COALESCE(
          NULLIF(pg_catalog.btrim(pickup_location.name), ''),
          'Região de origem'
        ),
        'destination', COALESCE(
          NULLIF(pg_catalog.btrim(dropoff_location.name), ''),
          'Região de destino'
        ),
        'origin_lat', CASE
          WHEN pg_catalog.jsonb_typeof(raw.value->'origin_lat') = 'number'
            THEN pg_catalog.round((raw.value->>'origin_lat')::numeric, 2)
          ELSE NULL
        END,
        'origin_lng', CASE
          WHEN pg_catalog.jsonb_typeof(raw.value->'origin_lng') = 'number'
            THEN pg_catalog.round((raw.value->>'origin_lng')::numeric, 2)
          ELSE NULL
        END,
        'destination_lat', CASE
          WHEN pg_catalog.jsonb_typeof(raw.value->'destination_lat') = 'number'
            THEN pg_catalog.round((raw.value->>'destination_lat')::numeric, 2)
          ELSE NULL
        END,
        'destination_lng', CASE
          WHEN pg_catalog.jsonb_typeof(raw.value->'destination_lng') = 'number'
            THEN pg_catalog.round((raw.value->>'destination_lng')::numeric, 2)
          ELSE NULL
        END,
        'location_precision', 'coarse_2dp'
      ) AS value,
      raw.ordinality
    FROM raw_offers AS raw
    LEFT JOIN public.ride_requests AS ride
      ON ride.id = NULLIF(raw.value->>'id', '')::uuid
    LEFT JOIN public.locations AS pickup_location
      ON pickup_location.id = ride.pickup_location_id
    LEFT JOIN public.locations AS dropoff_location
      ON dropoff_location.id = ride.dropoff_location_id
  )
  SELECT COALESCE(
    pg_catalog.jsonb_agg(redacted.value ORDER BY redacted.ordinality),
    '[]'::jsonb
  )
  INTO v_offers
  FROM redacted;

  RETURN pg_catalog.jsonb_build_object('offers', v_offers);
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_list_driver_offers(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_list_driver_offers(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) TO service_role;

COMMENT ON FUNCTION public.mobility_list_driver_offers(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) IS
  'G69 pre-acceptance offer privacy boundary. Exposes only coarse route/load/economic metadata; internal participant/source ids and free-text package description remain hidden until acceptance.';

COMMIT;
