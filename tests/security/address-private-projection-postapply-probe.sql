-- PROBE NEGATIVO DE PRIVACIDADE: somente executar APÓS aplicar a migration
-- 20261008220000_enforce_address_private_read_projection.sql em ambiente
-- autorizado. Não altera registros, não lê detalhes de endereços individuais.
-- Deve ser executado por um operador DB autorizado a SET ROLE anon.
-- Smoke adicional necessário: proprietário autenticado e terceiro autenticado
-- com JWTs reais (não usar claims falsas como prova de autorização).
BEGIN TRANSACTION READ ONLY;
SET LOCAL ROLE anon;

DO $address_anon_probe$
DECLARE
  v_visible bigint;
  v_projection_columns integer;
BEGIN
  SELECT count(*) INTO v_visible FROM public.addresses;
  IF v_visible <> 0 THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROBE_FAILED: anonymous private rows visible';
  END IF;

  -- A view de leitura pública deve permanecer consultável sem a tabela base.
  PERFORM count(*) FROM public.addresses_public;
  SELECT count(*) INTO v_projection_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'addresses_public';
  IF EXISTS (
    SELECT 1 FROM public.addresses_public
    WHERE is_verified IS DISTINCT FROM TRUE
       OR verification_status IS DISTINCT FROM
          'verified'::public.address_verification_status
  ) THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROBE_FAILED: contradictory verification exposed';
  END IF;

  IF v_projection_columns <> 9 OR EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'addresses_public'
      AND column_name IN (
        'street', 'number', 'complement', 'postal_code',
        'owner_user_id', 'metadata'
      )
  ) THEN
    RAISE EXCEPTION 'ADDRESS_PRIVATE_PROBE_FAILED: public view column contract drift';
  END IF;

  -- O catálogo Business mantém o FK embedding: RLS oculta a linha
  -- detalhada, mas a role anon ainda pode compor o JOIN sem erro 42501.
  PERFORM business.id
  FROM public.public_business_search AS business
  LEFT JOIN public.addresses AS related_address
    ON related_address.id = business.address_id
  LIMIT 1;

  -- Força referência à coluna projetada e ao relacionamento da view pausada.
  PERFORM latitude FROM public.public_professional_search LIMIT 1;
END
$address_anon_probe$;

ROLLBACK;


-- Segunda prova, no operador DB após reverter o SET ROLE anon.
-- Verifica o predicado de vínculo público sem carregar dados pessoais.
-- É impossível verificar a associação profissional na role anon, pois
-- professional_data mantém ACL privada; nunca ampliá-la só para o probe.
BEGIN TRANSACTION READ ONLY;
DO $address_public_listing_probe$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.addresses_public AS published_address
    WHERE NOT EXISTS (
      SELECT 1 FROM public.public_business_search AS published_business
      WHERE published_business.address_id = published_address.id
        AND published_business.status = 'active'
        AND (
          published_address.owner_user_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.profiles AS owner_profile
            WHERE owner_profile.id = published_business.profile_id
              AND owner_profile.user_id = published_address.owner_user_id
          )
        )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.professional_data AS published_professional
      WHERE published_professional.address_id = published_address.id
        AND published_professional.is_accepting_clients IS TRUE
        AND published_professional.visibility =
          'public_listed'::public.professional_profile_visibility
        AND published_professional.slug IS NOT NULL
        AND NULLIF(btrim(published_professional.slug), '') IS NOT NULL
        AND (
          published_address.owner_user_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.profiles AS owner_profile
            WHERE owner_profile.id = published_professional.profile_id
              AND owner_profile.user_id = published_address.owner_user_id
          )
        )
    )
  ) THEN
    RAISE EXCEPTION
      'ADDRESS_PRIVATE_PROBE_FAILED: verified address without public listing exposed';
  END IF;
END
$address_public_listing_probe$;
ROLLBACK;
