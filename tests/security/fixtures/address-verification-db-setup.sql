-- PostgreSQL 17 isolated CI fixture. NO production data or external credentials.
-- Intentionally mirrors the minimum catalog contracts read by migration
-- 20261008215900. Any production drift remains guarded by SQL preflights.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE
AS $auth_uid$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$auth_uid$;
GRANT USAGE ON SCHEMA auth TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, service_role;

CREATE TYPE public.address_verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  postal_code text,
  street text,
  number text,
  complement text,
  address_type text NOT NULL DEFAULT 'exact',
  latitude numeric,
  longitude numeric,
  geocoded_at timestamptz,
  geocoding_source text,
  geocoding_confidence numeric,
  precision text NOT NULL DEFAULT 'city',
  owner_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_verified boolean DEFAULT false,
  verification_status public.address_verification_status DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid,
  verified_reason text,
  point text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.user_residences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  address_id uuid REFERENCES public.addresses(id),
  location_id uuid NOT NULL,
  country text DEFAULT 'Brasil',
  is_primary boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  verification_requested_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_user_residences_address_id ON public.user_residences(address_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_residences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses
FOR ALL TO authenticated
USING (owner_user_id = (SELECT auth.uid()))
WITH CHECK (owner_user_id = (SELECT auth.uid()));
CREATE POLICY "Users manage own residences" ON public.user_residences
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_residences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_residences TO service_role;
GRANT USAGE ON SCHEMA private TO service_role;

-- Synthetic owner/outsider fixture. Nothing here corresponds to an actual user.
INSERT INTO public.addresses (
  id, owner_user_id, location_id, street, number, is_verified,
  verification_status, verified_at
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '11111111-1111-4111-8111-111111111111',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  'Fixture rua original', '10', true, 'verified', now()
), (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  '22222222-2222-4222-8222-222222222222',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  'Fixture rua terceiro', '20', true, 'verified', now()
);
INSERT INTO public.user_residences (
  id, user_id, address_id, location_id, is_verified,
  verification_requested_at
) VALUES (
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  '11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  true, now() - interval '3 days'
), (
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
  '22222222-2222-4222-8222-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  true, now() - interval '2 days'
);
