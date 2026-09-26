-- Project Business spatial coordinates from the canonical Address aggregate.
--
-- business_data.latitude/longitude are legacy compatibility columns. Runtime
-- Business reads physical coordinates from addresses, so the public spatial
-- read model must derive from addresses as well. This avoids dual-write drift
-- between Business, Map and Nearby.

CREATE OR REPLACE FUNCTION private.sync_public_business_search_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_public_metadata jsonb;
  v_latitude numeric;
  v_longitude numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_business_search WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.status <> 'active' THEN
    DELETE FROM public.public_business_search WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.address_id IS NOT NULL THEN
    SELECT a.latitude, a.longitude
      INTO v_latitude, v_longitude
    FROM public.addresses AS a
    WHERE a.id = NEW.address_id;
  END IF;

  v_public_metadata := jsonb_strip_nulls(jsonb_build_object(
    'logo_url', NEW.metadata->'logo_url',
    'banner_url', NEW.metadata->'banner_url',
    'modos_atendimento', NEW.metadata->'modos_atendimento',
    'tem_delivery', NEW.metadata->'tem_delivery',
    'aceita_cartao', NEW.metadata->'aceita_cartao',
    'aceita_pix', NEW.metadata->'aceita_pix',
    'neighborhood', NEW.metadata->'neighborhood',
    'cep', NEW.metadata->'cep',
    'city', NEW.metadata->'city',
    'state', NEW.metadata->'state'
  ));

  INSERT INTO public.public_business_search (
    id,
    profile_id,
    business_name,
    slug,
    category,
    subcategory,
    description,
    website,
    instagram,
    facebook,
    opening_hours,
    location_id,
    address_id,
    latitude,
    longitude,
    status,
    is_premium,
    is_verified,
    rating,
    total_reviews,
    recommendations_count,
    business_role,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.profile_id,
    NEW.business_name,
    NEW.slug,
    NEW.category,
    NEW.subcategory,
    NEW.description,
    NEW.website,
    NEW.instagram,
    NEW.facebook,
    NEW.opening_hours,
    NEW.location_id,
    NEW.address_id,
    v_latitude,
    v_longitude,
    NEW.status,
    COALESCE(NEW.is_premium, false),
    COALESCE(NEW.is_verified, false),
    COALESCE(NEW.rating, 0),
    COALESCE(NEW.total_reviews, 0),
    COALESCE(NEW.recommendations_count, 0),
    NEW.business_role,
    v_public_metadata,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    business_name = EXCLUDED.business_name,
    slug = EXCLUDED.slug,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    instagram = EXCLUDED.instagram,
    facebook = EXCLUDED.facebook,
    opening_hours = EXCLUDED.opening_hours,
    location_id = EXCLUDED.location_id,
    address_id = EXCLUDED.address_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    status = EXCLUDED.status,
    is_premium = EXCLUDED.is_premium,
    is_verified = EXCLUDED.is_verified,
    rating = EXCLUDED.rating,
    total_reviews = EXCLUDED.total_reviews,
    recommendations_count = EXCLUDED.recommendations_count,
    business_role = EXCLUDED.business_role,
    metadata = EXCLUDED.metadata,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.sync_public_business_search_row()
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.sync_public_business_search_address_coordinates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.public_business_search
    SET
      latitude = NULL,
      longitude = NULL,
      updated_at = now()
    WHERE address_id = OLD.id;

    RETURN OLD;
  END IF;

  UPDATE public.public_business_search
  SET
    latitude = NEW.latitude,
    longitude = NEW.longitude,
    updated_at = GREATEST(public_business_search.updated_at, NEW.updated_at)
  WHERE address_id = NEW.id;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.sync_public_business_search_address_coordinates()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_public_business_search_address_coordinates
ON public.addresses;

CREATE TRIGGER trg_sync_public_business_search_address_coordinates
AFTER INSERT OR UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION private.sync_public_business_search_address_coordinates();

DROP TRIGGER IF EXISTS trg_clear_public_business_search_address_coordinates
ON public.addresses;

CREATE TRIGGER trg_clear_public_business_search_address_coordinates
BEFORE DELETE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION private.sync_public_business_search_address_coordinates();

UPDATE public.public_business_search AS pbs
SET
  latitude = a.latitude,
  longitude = a.longitude
FROM public.addresses AS a
WHERE pbs.address_id = a.id
  AND (
    pbs.latitude IS DISTINCT FROM a.latitude
    OR pbs.longitude IS DISTINCT FROM a.longitude
  );

UPDATE public.public_business_search AS pbs
SET
  latitude = NULL,
  longitude = NULL
WHERE pbs.address_id IS NULL
  AND (pbs.latitude IS NOT NULL OR pbs.longitude IS NOT NULL);

DO $assert$
DECLARE
  v_mismatches bigint;
BEGIN
  SELECT count(*)
    INTO v_mismatches
  FROM public.public_business_search AS pbs
  JOIN public.addresses AS a
    ON a.id = pbs.address_id
  WHERE pbs.latitude IS DISTINCT FROM a.latitude
     OR pbs.longitude IS DISTINCT FROM a.longitude;

  IF v_mismatches <> 0 THEN
    RAISE EXCEPTION
      'public_business_search coordinate projection drift remains: % rows',
      v_mismatches;
  END IF;
END;
$assert$;
