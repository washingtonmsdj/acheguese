-- G154: support bounded/radius Business map reads on the canonical public read model.
-- Rectangular viewport filters use latitude/longitude range indexes. Radius and
-- hybrid PostGIS searches use the functional geography GiST index below.

CREATE INDEX IF NOT EXISTS public_business_search_latitude_idx
  ON public.public_business_search (latitude)
  WHERE latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS public_business_search_longitude_idx
  ON public.public_business_search (longitude)
  WHERE longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS public_business_search_geography_idx
  ON public.public_business_search
  USING gist (
    (
      ST_SetSRID(
        ST_MakePoint(longitude::double precision, latitude::double precision),
        4326
      )::geography
    )
  )
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL;

DO $verify$
BEGIN
  IF to_regclass('public.public_business_search_latitude_idx') IS NULL THEN
    RAISE EXCEPTION 'public_business_search_latitude_idx was not created';
  END IF;

  IF to_regclass('public.public_business_search_longitude_idx') IS NULL THEN
    RAISE EXCEPTION 'public_business_search_longitude_idx was not created';
  END IF;

  IF to_regclass('public.public_business_search_geography_idx') IS NULL THEN
    RAISE EXCEPTION 'public_business_search_geography_idx was not created';
  END IF;
END
$verify$;
