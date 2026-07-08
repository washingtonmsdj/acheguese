BEGIN;

-- security-authority: public-rpc public.rpc_match_district_by_point
-- Boundary rows are public territorial geometry. This RPC should apply public
-- RLS and convert stored GeoJSON into PostGIS geometry instead of using a
-- privileged execution mode.
CREATE OR REPLACE FUNCTION public.rpc_match_district_by_point(
  p_city_id uuid,
  p_lat double precision,
  p_lng double precision
)
RETURNS TABLE(location_id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT nb.location_id
  FROM public.neighborhood_boundaries nb
  JOIN public.locations l
    ON l.id = nb.location_id
   AND l.type = 'district'
   AND l.parent_id = p_city_id
   AND l.status = 'active'
  WHERE nb.geometry IS NOT NULL
    AND jsonb_typeof(nb.geometry) = 'object'
    AND nb.geometry ? 'type'
    AND ST_Contains(
      ST_SetSRID(ST_GeomFromGeoJSON(nb.geometry::text), 4326),
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
    )
  LIMIT 1;
$$;

REVOKE ALL
ON FUNCTION public.rpc_match_district_by_point(uuid, double precision, double precision)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.rpc_match_district_by_point(uuid, double precision, double precision)
TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_match_district_by_point(uuid, double precision, double precision) IS
  'Returns canonical public district location_id from a point inside a city using invoker permissions and GeoJSON boundaries.';

COMMIT;
