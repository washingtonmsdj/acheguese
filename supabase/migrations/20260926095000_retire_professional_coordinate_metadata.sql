-- Retire the final professional coordinate residue stored in metadata.
-- Provenance: the only live row comes from the synthetic AI Phase 1 seed
-- `encanador-carlos-ai-seed` (2026-05-04), not from an address or service-area
-- authority. Do not promote that synthetic point into a real-world address.

BEGIN;

DO $$
DECLARE
  v_residue_count integer;
  v_target_count integer;
BEGIN
  SELECT count(*)
  INTO v_residue_count
  FROM public.professional_data
  WHERE metadata ? 'latitude' OR metadata ? 'longitude';

  IF v_residue_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly one professional coordinate metadata residue, found %', v_residue_count;
  END IF;

  SELECT count(*)
  INTO v_target_count
  FROM public.professional_data
  WHERE slug = 'encanador-carlos-ai-seed'
    AND address_id IS NULL
    AND is_accepting_clients = false
    AND (metadata->>'latitude')::double precision = -12.9978
    AND (metadata->>'longitude')::double precision = -38.4503;

  IF v_target_count <> 1 THEN
    RAISE EXCEPTION 'synthetic AI professional coordinate residue changed; review before applying';
  END IF;
END;
$$;

UPDATE public.professional_data
SET metadata = (COALESCE(metadata, '{}'::jsonb) - 'latitude' - 'longitude'),
    updated_at = now()
WHERE slug = 'encanador-carlos-ai-seed'
  AND address_id IS NULL
  AND is_accepting_clients = false
  AND (metadata->>'latitude')::double precision = -12.9978
  AND (metadata->>'longitude')::double precision = -38.4503;

CREATE OR REPLACE VIEW public.public_professional_search
WITH (security_invoker = true)
AS
SELECT
  professional.id,
  professional.profile_id,
  professional.professional_name,
  professional.slug,
  professional.service_category,
  professional.service_subcategory,
  professional.description,
  professional.certifications,
  professional.experience_years,
  professional.education,
  professional.price_range,
  professional.service_areas,
  professional.service_radius_km,
  professional.available_hours,
  professional.visibility,
  professional.is_accepting_clients,
  professional.is_verified,
  professional.verified_at,
  professional.rating,
  professional.availability_notes,
  professional.portfolio_items,
  professional.location_id,
  professional.address_id,
  professional.metadata,
  professional.created_at,
  professional.updated_at,
  address.latitude AS latitude,
  address.longitude AS longitude,
  location.geographic_path
FROM public.professional_data AS professional
LEFT JOIN public.addresses AS address
  ON professional.address_id = address.id
LEFT JOIN public.locations AS location
  ON professional.location_id = location.id
WHERE professional.is_accepting_clients = true
  AND professional.visibility = 'public_listed'::public.professional_profile_visibility
  AND professional.slug IS NOT NULL
  AND NULLIF(btrim(professional.slug), '') IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    WHERE metadata ? 'latitude' OR metadata ? 'longitude'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: professional metadata still contains coordinates';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'public_professional_search'
      AND 'security_invoker=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[]))
  ) THEN
    RAISE EXCEPTION 'postcondition failed: public_professional_search lost security_invoker';
  END IF;
END;
$$;

COMMIT;
