-- Endereços: separar a autoridade privada da projeção pública existente.
-- Apenas change-set versionado, não aplicar via dashboard / dual-write.
-- addresses_public é uma EXCEÇÃO CONTROLADA ao security_invoker: projeção
-- explícita de campos não sensíveis, somente endereços verificados e
-- security_barrier. A tabela física conserva RLS de proprietário.
-- Em caso de drift de owner, policy ou projeção, a transação ABORTA.
BEGIN;

DO $address_public_preflight$
DECLARE
  v_columns text[];
  v_definition text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'addresses_public'
      AND c.relkind = 'v'
      AND pg_get_userbyid(c.relowner) = 'postgres'
      AND 'security_invoker=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[]))
  ) THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: unexpected view owner or invoker mode';
  END IF;

  SELECT array_agg(a.attname::text ORDER BY a.attnum)
    INTO v_columns
  FROM pg_attribute a
  WHERE a.attrelid = 'public.addresses_public'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped;

  IF v_columns IS DISTINCT FROM ARRAY[
    'id', 'location_id', 'address_type', 'latitude', 'longitude',
    'precision', 'is_verified', 'verification_status', 'created_at'
  ]::text[] THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: unexpected public projection columns';
  END IF;

  SELECT pg_get_viewdef('public.addresses_public'::regclass, true)
    INTO v_definition;
  IF position('is_verified' in v_definition) = 0
     OR position('verification_status' in v_definition) = 0
     OR position('WHERE' in v_definition) = 0 THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: verified-only filter missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.addresses'::regclass
      AND polname = 'Users manage own addresses'
      AND polcmd = '*'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.addresses'::regclass
      AND polname = 'Addresses public verified read'
      AND polcmd = 'r'
  ) OR EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.addresses'::regclass
      AND polname NOT IN (
        'Users manage own addresses', 'Addresses public verified read'
      )
  ) THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: unexpected base-table RLS policies';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'public_professional_search'
      AND c.relkind = 'v'
      AND 'security_invoker=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[]))
  ) THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: professional read-model drift';
  END IF;
END
$address_public_preflight$;

-- A tabela original não é um endpoint público. O único RLS de acesso
-- detalhado continuará sendo "Users manage own addresses" (auth.uid()).
REVOKE SELECT ON TABLE public.addresses FROM PUBLIC, anon;
DROP POLICY "Addresses public verified read" ON public.addresses;

-- A view JÁ EXISTENTE é o único read model de endereços verificados.
-- A exceção de privilégios do owner fica confinada à lista explícita
-- de nove colunas existente, com filtro de verificação e security barrier.
CREATE OR REPLACE VIEW public.addresses_public
WITH (security_invoker = false, security_barrier = true)
AS
SELECT
  address.id,
  address.location_id,
  address.address_type,
  address.latitude,
  address.longitude,
  address.precision,
  address.is_verified,
  address.verification_status,
  address.created_at
FROM public.addresses AS address
WHERE address.is_verified = true
   OR address.verification_status = 'verified'::public.address_verification_status;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.addresses_public
  FROM PUBLIC, anon, authenticated;
REVOKE SELECT ON TABLE public.addresses_public FROM PUBLIC;
GRANT SELECT ON TABLE public.addresses_public TO anon, authenticated, service_role;

-- A visão profissional pública (vertical pausada) já consumia coordenadas,
-- mas por join direto na tabela privada. Mantemos EXATAMENTE sua projeção
-- e filtros atuais, trocando somente a origem das coordenadas verificadas.
-- Não introduz uma tabela, outro endereço ou outra autoridade persistente.
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
  address.latitude::numeric AS latitude,
  address.longitude::numeric AS longitude,
  location.geographic_path
FROM public.professional_data AS professional
LEFT JOIN public.addresses_public AS address
  ON professional.address_id = address.id
LEFT JOIN public.locations AS location
  ON professional.location_id = location.id
WHERE professional.is_accepting_clients = true
  AND professional.visibility = 'public_listed'::public.professional_profile_visibility
  AND professional.slug IS NOT NULL
  AND NULLIF(btrim(professional.slug), '') IS NOT NULL;

COMMENT ON VIEW public.addresses_public IS
  'SSOT público de endereço verificado: somente 9 campos seguros, security_barrier=true. Exceção security_invoker=false limitada à view; tabela addresses permanece privada via RLS/ACL.';

DO $address_public_postflight$
BEGIN
  IF has_table_privilege('anon', 'public.addresses', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.addresses', 'SELECT')
    OR NOT has_table_privilege('anon', 'public.addresses_public', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.addresses_public', 'SELECT')
    OR EXISTS (
      SELECT 1 FROM pg_policy
      WHERE polrelid = 'public.addresses'::regclass
        AND polname = 'Addresses public verified read'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_policy
      WHERE polrelid = 'public.addresses'::regclass
        AND polname = 'Users manage own addresses'
    ) THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: table or view grants/RLS incorrect';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.oid = 'public.addresses_public'::regclass
      AND 'security_barrier=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[]))
      AND 'security_invoker=false' = ANY(COALESCE(c.reloptions, ARRAY[]::text[]))
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.oid = 'public.public_professional_search'::regclass
      AND 'security_invoker=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[]))
  ) THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: read-model security options incorrect';
  END IF;

  IF has_table_privilege('anon', 'public.addresses_public', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.addresses_public', 'UPDATE') THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROJECTION_BLOCKED: public view is not read-only';
  END IF;
END
$address_public_postflight$;

NOTIFY pgrst, 'reload schema';
COMMIT;
