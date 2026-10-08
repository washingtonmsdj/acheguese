-- Só execute APÓS a migração de autoridade no ambiente AUTORIZADO.
-- Teste de permissão read-only sob role autenticado, sem ler PII individual.
-- Este teste NÃO substitui E2E com JWT proprietário e usuário terceiro.
BEGIN TRANSACTION READ ONLY;
SET LOCAL ROLE authenticated;

DO $address_verify_acl_probe$
DECLARE
  v_column text;
BEGIN
  FOREACH v_column IN ARRAY ARRAY[
    'is_verified', 'verification_status', 'verified_at',
    'verified_by', 'verified_reason'
  ]
  LOOP
    IF has_column_privilege(current_user,'public.addresses',v_column,'UPDATE')
       OR has_column_privilege(current_user,'public.addresses',v_column,'INSERT')
    THEN
      RAISE EXCEPTION 'ADDRESS_VERIFY_PROBE_FAILED: untrusted proof field write is permitted';
    END IF;
  END LOOP;

  IF NOT has_column_privilege(current_user,'public.addresses','street','UPDATE')
     OR NOT has_column_privilege(current_user,'public.addresses','street','INSERT')
     OR NOT has_column_privilege(current_user,'public.addresses','postal_code','UPDATE')
  THEN
    RAISE EXCEPTION 'ADDRESS_VERIFY_PROBE_FAILED: owner postal edit unavailable';
  END IF;

  IF EXISTS (SELECT 1 FROM public.addresses) THEN
    RAISE EXCEPTION 'ADDRESS_VERIFY_PROBE_FAILED: unauthenticated JWT context sees private rows';
  END IF;
END
$address_verify_acl_probe$;

ROLLBACK;
