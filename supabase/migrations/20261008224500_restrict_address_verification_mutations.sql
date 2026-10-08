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
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false;
    NEW.verification_status := 'pending'::public.address_verification_status;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.verified_reason := NULL;
    RETURN NEW;
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

NOTIFY pgrst, 'reload schema';
COMMIT;
