-- G154: support bounded business map reads on the canonical public read model.
-- The map no longer needs to materialize a territorial page and filter the
-- viewport in the browser. Separate range indexes allow PostgreSQL to use
-- bitmap index scans/intersections for rectangular latitude/longitude bounds.

CREATE INDEX IF NOT EXISTS public_business_search_latitude_idx
  ON public.public_business_search (latitude)
  WHERE latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS public_business_search_longitude_idx
  ON public.public_business_search (longitude)
  WHERE longitude IS NOT NULL;

DO $verify$
BEGIN
  IF to_regclass('public.public_business_search_latitude_idx') IS NULL THEN
    RAISE EXCEPTION 'public_business_search_latitude_idx was not created';
  END IF;

  IF to_regclass('public.public_business_search_longitude_idx') IS NULL THEN
    RAISE EXCEPTION 'public_business_search_longitude_idx was not created';
  END IF;
END
$verify$;
