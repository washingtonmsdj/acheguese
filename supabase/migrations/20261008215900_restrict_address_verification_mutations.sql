-- Endurecimento da autoridade de verificação do Address SSOT.
-- Endereço postal continua editável pelo titular. Prova de verificação não.
-- Migração de código apenas até aprovação de implantação; sem dashboard drift.
BEGIN;

DO $address_verification_preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.oid = 'public.addresses'::regclass
      AND c.relkind = 'r'
      AND c.relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy p
    WHERE p.polrelid = 'public.addresses'::regclass
      AND p.polname = 'Users manage own addresses'
      AND p.polcmd = '*'
      AND 'authenticated'::regrole::oid = ANY(p.polroles)
      AND NOT ('anon'::regrole::oid = ANY(p.polroles))
      AND NOT (0::oid = ANY(p.polroles))
      AND position('owner_user_id' in pg_get_expr(p.polqual,p.polrelid)) > 0
      AND position('auth.uid()' in pg_get_expr(p.polqual,p.polrelid)) > 0
      AND position('owner_user_id' in pg_get_expr(p.polwithcheck,p.polrelid)) > 0
      AND position('auth.uid()' in pg_get_expr(p.polwithcheck,p.polrelid)) > 0
  ) THEN
    RAISE EXCEPTION 'ADDRESS_VERIFY_WRITE_BLOCKED: RLS owner boundary changed';
  END IF;

  IF NOT has_table_privilege('service_role','public.addresses','INSERT')
    OR NOT has_table_privilege('service_role','public.addresses','UPDATE')
    OR NOT has_table_privilege('authenticated','public.addresses','INSERT')
    OR NOT has_table_privilege('authenticated','public.addresses','UPDATE')
  THEN
    RAISE EXCEPTION 'ADDRESS_VERIFY_WRITE_BLOCKED: expected grants drifted';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.addresses'::regclass
      AND tgname = 'address_verification_owner_guard'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'ADDRESS_VERIFY_WRITE_BLOCKED: trigger name already in use';
  END IF;
END
$address_verification_preflight$;

-- Table-level INSERT/UPDATE overrides any column-level deny. Replace both
-- privileges with an explicit safe allowlist for the existing authenticated
-- repository, retaining service_role's separate server authority.
REVOKE INSERT, UPDATE ON TABLE public.addresses FROM PUBLIC, authenticated;

GRANT INSERT (
  location_id, postal_code, street, number, complement, address_type,
  latitude, longitude, geocoded_at, geocoding_source,
  geocoding_confidence, precision, owner_user_id, metadata
) ON TABLE public.addresses TO authenticated;

GRANT UPDATE (
  location_id, postal_code, street, number, complement, address_type,
  latitude, longitude, geocoded_at, geocoding_source,
  geocoding_confidence, precision, metadata
) ON TABLE public.addresses TO authenticated;

-- O estado trusted/verified é responsabilidade exclusiva da autoridade
-- de verificação no servidor. Edits físicos feitos pelo usuário invalidam
-- atomicamente a prova anterior; isso não é uma segunda escrita do cliente.
CREATE FUNCTION private.address_verification_owner_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $address_verification_owner_guard$
BEGIN
  -- Na inclusão, somente serviço privilegiado pode atribuir prova trusted.
  -- Na atualização, QUALQUER alteração física invalida a prova antiga,
  -- inclusive quando a operação foi iniciada pelo servidor.
  IF TG_OP = 'INSERT' THEN
    IF current_user = 'authenticated' OR auth.uid() IS NOT NULL THEN
      NEW.is_verified := false;
      NEW.verification_status := 'pending'::public.address_verification_status;
      NEW.verified_at := NULL;
      NEW.verified_by := NULL;
      NEW.verified_reason := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- Mesmo dentro de RPC SECURITY DEFINER, uma requisição com identidade
  -- do usuário não pode escrever a prova trusted. Alterações postais
  -- continuam permitidas e invalidam a prova automaticamente abaixo.
  IF (current_user = 'authenticated' OR auth.uid() IS NOT NULL)
    AND ROW(NEW.is_verified, NEW.verification_status, NEW.verified_at,
            NEW.verified_by, NEW.verified_reason)
      IS DISTINCT FROM
        ROW(OLD.is_verified, OLD.verification_status, OLD.verified_at,
            OLD.verified_by, OLD.verified_reason)
  THEN
    RAISE EXCEPTION 'ADDRESS_VERIFICATION_SERVER_ONLY'
      USING ERRCODE = '42501';
  END IF;

  IF ROW(
    NEW.location_id, NEW.postal_code, NEW.street, NEW.number,
    NEW.complement, NEW.address_type, NEW.latitude, NEW.longitude,
    NEW.geocoded_at, NEW.geocoding_source, NEW.geocoding_confidence,
    NEW.precision, NEW.metadata
  ) IS DISTINCT FROM ROW(
    OLD.location_id, OLD.postal_code, OLD.street, OLD.number,
    OLD.complement, OLD.address_type, OLD.latitude, OLD.longitude,
    OLD.geocoded_at, OLD.geocoding_source, OLD.geocoding_confidence,
    OLD.precision, OLD.metadata
  ) THEN
    NEW.is_verified := false;
    NEW.verification_status := 'pending'::public.address_verification_status;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.verified_reason := 'address_details_changed';
  END IF;

  RETURN NEW;
END
$address_verification_owner_guard$;

REVOKE ALL ON FUNCTION private.address_verification_owner_guard()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER address_verification_owner_guard
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION private.address_verification_owner_guard();

DO $address_verification_postflight$
DECLARE
  v_protected_column text;
  v_allowed_column text;
BEGIN
  FOREACH v_protected_column IN ARRAY ARRAY[
    'is_verified', 'verification_status', 'verified_at', 'verified_by',
    'verified_reason', 'owner_user_id', 'point', 'id', 'created_at', 'updated_at'
  ]
  LOOP
    IF has_column_privilege('authenticated','public.addresses',v_protected_column,'UPDATE')
    THEN
      RAISE EXCEPTION
        'ADDRESS_VERIFY_WRITE_BLOCKED: authenticated can update protected column %',
        v_protected_column;
    END IF;
  END LOOP;

  FOREACH v_protected_column IN ARRAY ARRAY[
    'is_verified', 'verification_status', 'verified_at', 'verified_by',
    'verified_reason', 'point', 'id', 'created_at', 'updated_at'
  ]
  LOOP
    IF has_column_privilege('authenticated','public.addresses',v_protected_column,'INSERT')
    THEN
      RAISE EXCEPTION
        'ADDRESS_VERIFY_WRITE_BLOCKED: authenticated can insert trusted column %',
        v_protected_column;
    END IF;
  END LOOP;

  FOREACH v_allowed_column IN ARRAY ARRAY[
    'location_id', 'postal_code', 'street', 'number', 'complement',
    'address_type', 'latitude', 'longitude', 'geocoded_at',
    'geocoding_source', 'geocoding_confidence', 'precision', 'metadata'
  ]
  LOOP
    IF NOT has_column_privilege('authenticated','public.addresses',v_allowed_column,'UPDATE')
    THEN
      RAISE EXCEPTION
        'ADDRESS_VERIFY_WRITE_BLOCKED: authenticated lost postal edit of %',
        v_allowed_column;
    END IF;
  END LOOP;

  IF NOT has_column_privilege('authenticated','public.addresses','owner_user_id','INSERT')
    OR NOT has_table_privilege('service_role','public.addresses','UPDATE')
    OR NOT has_table_privilege('service_role','public.addresses','INSERT')
    OR NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = 'public.addresses'::regclass
        AND tgname = 'address_verification_owner_guard'
        AND tgenabled = 'O'
    )
  THEN
    RAISE EXCEPTION 'ADDRESS_VERIFY_WRITE_BLOCKED: postflight grant or trigger mismatch';
  END IF;
END
$address_verification_postflight$;

-- Residence é outro vínculo de confiança: a flag is_verified também
-- não pode ser publicada nem escrita diretamente por residentes.
DO $residence_verification_preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.oid = 'public.user_residences'::regclass
      AND c.relkind = 'r' AND c.relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy p
    WHERE p.polrelid = 'public.user_residences'::regclass
      AND p.polname = 'Users manage own residences'
      AND p.polcmd = '*'
      AND 'authenticated'::regrole::oid = ANY(p.polroles)
      AND NOT ('anon'::regrole::oid = ANY(p.polroles))
      AND position('user_id' in pg_get_expr(p.polqual,p.polrelid)) > 0
      AND position('auth.uid()' in pg_get_expr(p.polqual,p.polrelid)) > 0
  ) THEN
    RAISE EXCEPTION 'RESIDENCE_VERIFY_WRITE_BLOCKED: owner RLS changed';
  END IF;

  IF NOT has_table_privilege('service_role','public.user_residences','UPDATE')
     OR NOT has_table_privilege('authenticated','public.user_residences','UPDATE')
  THEN
    RAISE EXCEPTION 'RESIDENCE_VERIFY_WRITE_BLOCKED: current grants drifted';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE (tgrelid='public.user_residences'::regclass
           AND tgname='residence_verification_owner_guard')
       OR (tgrelid='public.addresses'::regclass
           AND tgname='invalidate_linked_residence_verification')
  ) THEN
    RAISE EXCEPTION 'RESIDENCE_VERIFY_WRITE_BLOCKED: trigger name is occupied';
  END IF;
END
$residence_verification_preflight$;

REVOKE INSERT, UPDATE ON TABLE public.user_residences
  FROM PUBLIC, authenticated;

GRANT INSERT (user_id, address_id, location_id, country, is_primary)
  ON TABLE public.user_residences TO authenticated;

GRANT UPDATE (
  address_id, location_id, country, is_primary, verification_requested_at
) ON TABLE public.user_residences TO authenticated;

-- Uma solicitação não é uma aprovação. O cliente pode solicitar, e o
-- timestamp é sempre controlado pelo servidor, não pelo relógio do navegador.
CREATE FUNCTION private.residence_verification_owner_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $residence_verification_owner_guard$
BEGIN
  -- O vínculo trusted não sobrevive a mudanças de residência, mesmo quando
  -- efetuadas por um serviço autorizado. A aprovação é outra operação.
  IF TG_OP = 'INSERT' THEN
    IF current_user = 'authenticated' OR auth.uid() IS NOT NULL THEN
      NEW.is_verified := false;
      NEW.verification_requested_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- Bloquear somente elevação/substituição de prova trusted pela origem
  -- cliente; uma revogação para FALSE é segura e NECESSÁRIA no UPDATE
  -- interno disparado pelo gatilho AFTER UPDATE de public.addresses.
  -- Colunas continuam sem GRANT de escrita para authenticated.
  IF (current_user = 'authenticated' OR auth.uid() IS NOT NULL)
     AND NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND NEW.is_verified IS DISTINCT FROM FALSE
  THEN
    RAISE EXCEPTION 'RESIDENCE_VERIFICATION_SERVER_ONLY'
      USING ERRCODE = '42501';
  END IF;

  IF ROW(NEW.address_id, NEW.location_id, NEW.country)
    IS DISTINCT FROM ROW(OLD.address_id, OLD.location_id, OLD.country)
  THEN
    NEW.is_verified := false;
    NEW.verification_requested_at := NULL;
  ELSIF NEW.verification_requested_at IS DISTINCT FROM OLD.verification_requested_at
  THEN
    IF NEW.verification_requested_at IS NULL
       AND pg_trigger_depth() > 1
       AND current_user = 'postgres'
       AND NEW.is_verified IS FALSE
    THEN
      -- A cadeia interna Address -> Residence pode revogar a solicitação.
      -- O cliente não pode forjar esta condição em um UPDATE direto.
      NEW.verification_requested_at := NULL;
    ELSIF current_user = 'authenticated' OR auth.uid() IS NOT NULL THEN
      IF NEW.verification_requested_at IS NULL THEN
        -- Um UPDATE direto de morador não cancela o pedido de verificação.
        NEW.verification_requested_at := OLD.verification_requested_at;
      ELSE
        NEW.verification_requested_at := now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END
$residence_verification_owner_guard$;

REVOKE ALL ON FUNCTION private.residence_verification_owner_guard()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER residence_verification_owner_guard
  BEFORE INSERT OR UPDATE ON public.user_residences
  FOR EACH ROW
  EXECUTE FUNCTION private.residence_verification_owner_guard();

-- Mesma transação: alterar fisicamente um Address deve invalidar TODAS as
-- residências que o referenciam, independentemente de um segundo write no UI.
-- Função SECURITY DEFINER só invocável como trigger interno: não recebe ID,
-- não é endpoint RPC e atua exclusivamente sobre o NEW.id já autorizado pelo
-- UPDATE original (RLS Address para owner, ou autoridade server/service_role).
CREATE FUNCTION private.invalidate_linked_residence_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $invalidate_linked_residence_verification$
BEGIN
  IF ROW(
    NEW.location_id, NEW.postal_code, NEW.street, NEW.number,
    NEW.complement, NEW.address_type, NEW.latitude, NEW.longitude,
    NEW.geocoded_at, NEW.geocoding_source, NEW.geocoding_confidence,
    NEW.precision, NEW.metadata
  ) IS DISTINCT FROM ROW(
    OLD.location_id, OLD.postal_code, OLD.street, OLD.number,
    OLD.complement, OLD.address_type, OLD.latitude, OLD.longitude,
    OLD.geocoded_at, OLD.geocoding_source, OLD.geocoding_confidence,
    OLD.precision, OLD.metadata
  ) THEN
    UPDATE public.user_residences
    SET is_verified = false,
        verification_requested_at = NULL
    WHERE address_id = NEW.id
      AND (is_verified IS DISTINCT FROM false
           OR verification_requested_at IS NOT NULL);
  END IF;

  RETURN NULL;
END
$invalidate_linked_residence_verification$;

REVOKE ALL ON FUNCTION private.invalidate_linked_residence_verification()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER invalidate_linked_residence_verification
  AFTER UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION private.invalidate_linked_residence_verification();

DO $residence_verification_postflight$
BEGIN
  IF has_column_privilege('authenticated','public.user_residences','is_verified','UPDATE')
    OR has_column_privilege('authenticated','public.user_residences','is_verified','INSERT')
    OR has_column_privilege('authenticated','public.user_residences','user_id','UPDATE')
    OR NOT has_column_privilege('authenticated','public.user_residences','address_id','UPDATE')
    OR NOT has_column_privilege('authenticated','public.user_residences','verification_requested_at','UPDATE')
    OR NOT has_table_privilege('service_role','public.user_residences','UPDATE')
    OR NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid='public.user_residences'::regclass
        AND tgname='residence_verification_owner_guard'
        AND tgenabled='O'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid='public.addresses'::regclass
        AND tgname='invalidate_linked_residence_verification'
        AND tgenabled='O'
    )
  THEN
    RAISE EXCEPTION 'RESIDENCE_VERIFY_WRITE_BLOCKED: postflight privileges/triggers';
  END IF;
END
$residence_verification_postflight$;

NOTIFY pgrst, 'reload schema';
COMMIT;
