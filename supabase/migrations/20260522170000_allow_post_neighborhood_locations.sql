BEGIN;

-- Canonical territorial rule: community posts can be attached to city,
-- district or official municipal neighborhood locations.
CREATE OR REPLACE FUNCTION public.validate_post_location()
RETURNS TRIGGER AS $$
DECLARE
  loc_type TEXT;
  loc_status TEXT;
BEGIN
  IF NEW.location_id IS NOT NULL THEN
    SELECT type, status
      INTO loc_type, loc_status
    FROM public.locations
    WHERE id = NEW.location_id;

    IF loc_type IS NULL THEN
      RAISE EXCEPTION 'location_id inexistente';
    END IF;

    IF loc_type NOT IN ('city', 'district', 'neighborhood') THEN
      RAISE EXCEPTION 'Posts so podem ser criados em cidades ou bairros';
    END IF;

    IF loc_status <> 'active' THEN
      RAISE EXCEPTION 'Localizacao inativa';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
