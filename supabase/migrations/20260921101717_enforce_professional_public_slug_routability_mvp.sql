-- MVP R4: every public professional must have a routable canonical slug.
-- Private drafts may remain without a slug.

UPDATE public.professional_data
SET slug = 'antonio-costa'
WHERE id = '9299019a-0af0-4892-8226-7d1e3d9f0c36'::uuid
  AND slug IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.professional_data AS conflict
    WHERE conflict.slug = 'antonio-costa'
      AND conflict.id <> '9299019a-0af0-4892-8226-7d1e3d9f0c36'::uuid
  );

DO $verify_backfill$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    WHERE id = '9299019a-0af0-4892-8226-7d1e3d9f0c36'::uuid
      AND slug IS NULL
  ) THEN
    RAISE EXCEPTION 'professional_public_slug_backfill_failed';
  END IF;
END
$verify_backfill$;

ALTER TABLE public.professional_data
  DROP CONSTRAINT IF EXISTS professional_public_visibility_requires_slug;

ALTER TABLE public.professional_data
  ADD CONSTRAINT professional_public_visibility_requires_slug
  CHECK (
    visibility = 'private'::public.professional_profile_visibility
    OR (
      slug IS NOT NULL
      AND NULLIF(btrim(slug), '') IS NOT NULL
    )
  ) NOT VALID;

ALTER TABLE public.professional_data
  VALIDATE CONSTRAINT professional_public_visibility_requires_slug;

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
  COALESCE(
    (professional.metadata ->> 'latitude')::numeric,
    address.latitude
  ) AS latitude,
  COALESCE(
    (professional.metadata ->> 'longitude')::numeric,
    address.longitude
  ) AS longitude,
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

REVOKE ALL ON TABLE public.public_professional_search FROM PUBLIC;
GRANT SELECT ON TABLE public.public_professional_search
  TO anon, authenticated, service_role;

DO $verify_public_routability$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    WHERE visibility <> 'private'::public.professional_profile_visibility
      AND (slug IS NULL OR NULLIF(btrim(slug), '') IS NULL)
  ) THEN
    RAISE EXCEPTION 'public_professional_without_slug_remains';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.public_professional_search
    WHERE slug IS NULL OR NULLIF(btrim(slug), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'public_professional_search_exposes_unroutable_row';
  END IF;
END
$verify_public_routability$;

NOTIFY pgrst, 'reload schema';
