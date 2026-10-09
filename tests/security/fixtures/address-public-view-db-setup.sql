-- Additional isolated PostgreSQL 17 fixture for the exact #657 SQL.
-- Run AFTER the authority migration from #658. No production data.
CREATE TYPE public.professional_profile_visibility AS ENUM ('public_listed', 'private');
CREATE TABLE public.locations (
  id uuid PRIMARY KEY,
  geographic_path text
);
CREATE TABLE public.professional_data (
  id uuid PRIMARY KEY,
  profile_id uuid,
  professional_name text,
  slug text,
  service_category text,
  service_subcategory text,
  description text,
  certifications jsonb,
  experience_years integer,
  education text,
  price_range jsonb,
  service_areas jsonb,
  service_radius_km numeric,
  available_hours jsonb,
  visibility public.professional_profile_visibility DEFAULT 'private',
  is_accepting_clients boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  rating numeric,
  availability_notes text,
  portfolio_items jsonb,
  location_id uuid,
  address_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.public_business_search (
  id uuid PRIMARY KEY,
  address_id uuid REFERENCES public.addresses(id)
);

-- Mimic the current verified-read policy, before #657 removes it.
CREATE POLICY "Addresses public verified read" ON public.addresses
  FOR SELECT TO anon, authenticated
  USING (is_verified = true OR verification_status = 'verified'::public.address_verification_status);
GRANT SELECT ON public.addresses TO anon;

ALTER TABLE public.professional_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_business_search ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public professional sample" ON public.professional_data
  FOR SELECT TO anon, authenticated USING (visibility = 'public_listed');
CREATE POLICY "public location sample" ON public.locations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public business sample" ON public.public_business_search
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.professional_data, public.locations, public.public_business_search TO anon, authenticated;

CREATE VIEW public.addresses_public
WITH (security_invoker=true)
AS SELECT
  id, location_id, address_type, latitude, longitude, precision,
  is_verified, verification_status, created_at
FROM public.addresses
WHERE is_verified = true
   OR verification_status = 'verified'::public.address_verification_status;
GRANT SELECT ON public.addresses_public TO anon, authenticated;

-- The original view shape and join match production, which is checked by
-- #657's preflight before any CREATE OR REPLACE VIEW is allowed.
CREATE VIEW public.public_professional_search
WITH (security_invoker=true)
AS SELECT
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
  address.latitude::numeric AS latitude,
  address.longitude::numeric AS longitude,
  location.geographic_path
FROM public.professional_data AS professional
LEFT JOIN public.addresses AS address ON professional.address_id = address.id
LEFT JOIN public.locations AS location ON professional.location_id = location.id
WHERE professional.is_accepting_clients = true
  AND professional.visibility = 'public_listed'::public.professional_profile_visibility
  AND professional.slug IS NOT NULL
  AND NULLIF(btrim(professional.slug), '') IS NOT NULL;
GRANT SELECT ON public.public_professional_search TO anon, authenticated;

-- Seed a verified public address and two contradictory ones. These values
-- are synthetic; a "verified" address is not evidence of any real residence.
UPDATE public.addresses SET latitude = -12.98, longitude = -38.51
 WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
UPDATE public.addresses SET is_verified=true,
  verification_status='verified'::public.address_verification_status,
  verified_at=now()
 WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
-- The previous isolated #658 assertions intentionally revoked this row.
-- Restore server-approved residence only for the HTTP revocation scenario.
UPDATE public.user_residences
SET is_verified = true,
    verification_requested_at = now() - interval '3 days'
WHERE id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
INSERT INTO public.addresses (
  id, owner_user_id, location_id, street, latitude, longitude,
  is_verified, verification_status
) VALUES
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
 '11111111-1111-4111-8111-111111111111',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
 'Estado contraditorio flag',-12.97,-38.51,true,'pending'),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
 '11111111-1111-4111-8111-111111111111',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
 'Estado contraditorio status',-12.96,-38.50,false,'verified');

INSERT INTO public.locations(id,geographic_path)
 VALUES ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','/br/ba/salvador');
INSERT INTO public.professional_data(
 id,profile_id,professional_name,slug,visibility,
 is_accepting_clients,location_id,address_id
) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
 'Fixture profissional valido','fixture-valid',
 'public_listed',true,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
 'Fixture profissional inconsistente','fixture-ambiguous',
 'public_listed',true,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3');
INSERT INTO public.public_business_search(id,address_id)
 VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
