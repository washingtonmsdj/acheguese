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

  -- Força referência à coluna projetada e ao relacionamento da view pausada.
  PERFORM latitude FROM public.public_professional_search LIMIT 1;
END
$address_anon_probe$;

ROLLBACK;
