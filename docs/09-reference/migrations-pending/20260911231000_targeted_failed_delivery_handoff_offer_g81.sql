BEGIN;

-- G81 targeted handoff offer read model.
-- The receiver is not a ride participant before acceptance, so the handoff is
-- surfaced only through the authenticated offer broker. Unlike the historical
-- G48 shape, this version preserves G69: no passenger/source ids, no package
-- free text and no exact route/custodian coordinates leave the database.

ALTER FUNCTION public.mobility_list_driver_offers(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) RENAME TO mobility_list_driver_offers_base_g81;
ALTER FUNCTION public.mobility_list_driver_offers_base_g81(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.mobility_list_driver_offers_base_g81(
  uuid, uuid, text, integer, numeric, numeric, text[], text, boolean
) FROM PUBLIC, anon, authenticated, service_role;

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
  v_base_offers jsonb;
  v_result jsonb;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  -- The G69/G60 base remains authoritative for actor ownership, capability,
  -- availability, ordinary dispatch and all input validation.
  v_base := private.mobility_list_driver_offers_base_g81(
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

  IF p_strategy IS DISTINCT FROM 'open_board' THEN
    RETURN v_base;
  END IF;

  v_base_offers := COALESCE(v_base->'offers', '[]'::jsonb);

  WITH targeted AS (
    SELECT
      ride.id,
      COALESCE(
        NULLIF(pg_catalog.btrim(dropoff_location.name), ''),
        'Região de destino'
      ) AS destination,
      pg_catalog.round(custodian.current_lat::numeric, 2) AS origin_lat,
      pg_catalog.round(custodian.current_lng::numeric, 2) AS origin_lng,
      pg_catalog.round(ride.destination_lat::numeric, 2) AS destination_lat,
      pg_catalog.round(ride.destination_lng::numeric, 2) AS destination_lng,
      COALESCE(ride.suggested_price, 0) AS suggested_price,
      COALESCE(ride.payment_method, '') AS payment_method,
      ride.package_size,
      NULLIF(pg_catalog.btrim(ride.failed_delivery_metadata->>'handoff_requested_at'), '')::timestamptz AS requested_at,
      NULLIF(pg_catalog.btrim(ride.failed_delivery_metadata->>'handoff_request_expires_at'), '')::timestamptz AS expires_at
    FROM public.ride_requests ride
    JOIN public.driver_availability custodian
      ON custodian.profile_id = ride.driver_profile_id
    LEFT JOIN public.locations dropoff_location
      ON dropoff_location.id = ride.dropoff_location_id
    WHERE ride.ride_mode = 'motoboy'
      AND ride.status = 'failed_delivery'
      AND ride.failed_delivery_metadata IS NOT NULL
      AND ride.failed_delivery_metadata->>'item_current_holder' = 'driver'
      AND ride.failed_delivery_metadata->>'resolution_status' = 'in_progress'
      AND ride.failed_delivery_metadata->>'resolution_plan' = 'handoff_to_another_driver'
      AND ride.failed_delivery_metadata->>'handoff_requested_driver_profile_id' = p_driver_profile_id::text
      AND NULLIF(pg_catalog.btrim(ride.failed_delivery_metadata->>'handoff_request_expires_at'), '')::timestamptz > v_now
      AND custodian.active_ride_id = ride.id
      AND custodian.current_lat IS NOT NULL
      AND custodian.current_lng IS NOT NULL
      AND custodian.last_location_update >= v_now - interval '5 minutes'
      AND ride.destination_lat IS NOT NULL
      AND ride.destination_lng IS NOT NULL
  ), handoff_offers AS (
    SELECT
      pg_catalog.jsonb_build_object(
        'id', targeted.id,
        'origin', 'Ponto de transferência aproximado',
        'destination', targeted.destination,
        'origin_lat', targeted.origin_lat,
        'origin_lng', targeted.origin_lng,
        'destination_lat', targeted.destination_lat,
        'destination_lng', targeted.destination_lng,
        'location_precision', 'coarse_2dp',
        'suggested_price', targeted.suggested_price,
        'payment_method', targeted.payment_method,
        'created_at', targeted.requested_at,
        'driver_assigned_at', NULL,
        'scheduled_for', NULL,
        'ride_mode', 'motoboy',
        'driver_profile_id', NULL,
        'package_size', targeted.package_size,
        'source_type', NULL,
        'status', 'failed_delivery',
        'risk_level', NULL,
        'dispatch_policy', NULL,
        'offer_kind', 'failed_delivery_handoff',
        'handoff_request_expires_at', targeted.expires_at
      ) AS offer,
      targeted.expires_at,
      targeted.id
    FROM targeted
  ), ordinary AS (
    SELECT offer.value AS offer, offer.ordinality
    FROM pg_catalog.jsonb_array_elements(v_base_offers)
      WITH ORDINALITY AS offer(value, ordinality)
  ), combined AS (
    SELECT offer, 0 AS priority, expires_at AS deadline, 0::bigint AS ordinary_position, id::text AS stable_id
    FROM handoff_offers
    UNION ALL
    SELECT offer, 1 AS priority, NULL::timestamptz, ordinality,
           COALESCE(offer->>'id', ordinality::text)
    FROM ordinary
  ), limited AS (
    SELECT offer
    FROM combined
    ORDER BY priority, deadline ASC NULLS LAST, ordinary_position, stable_id
    LIMIT p_limit
  )
  SELECT COALESCE(pg_catalog.jsonb_agg(offer), '[]'::jsonb)
  INTO v_result
  FROM limited;

  RETURN pg_catalog.jsonb_build_object('offers', v_result);
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
  'G81 privacy-safe driver offer read model. Preserves G69 ordinary offers and prepends only non-expired targeted handoff requests for the selected receiver, with coarse route coordinates and without passenger/source/free-text identifiers.';

COMMIT;
