-- G25: server-own emergency-contact writes and make primary uniqueness concurrency-safe.
--
-- RLS protected ownership, but direct browser DML still allowed lifecycle and
-- provenance fields outside the product contract. Commands now whitelist
-- mutable fields; created_at/profile_id/metadata are not browser writable.
-- A partial unique index is the database invariant for one active primary.

CREATE UNIQUE INDEX IF NOT EXISTS emergency_contacts_one_active_primary_per_profile
  ON public.emergency_contacts(profile_id)
  WHERE is_primary = true AND is_active = true;

CREATE OR REPLACE FUNCTION public.create_emergency_contact(
  p_profile_id uuid,
  p_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_relationship text DEFAULT NULL,
  p_is_primary boolean DEFAULT false
)
RETURNS public.emergency_contacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_contact public.emergency_contacts%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_name text := pg_catalog.btrim(COALESCE(p_name, ''));
  v_email text := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_email, '')));
  v_phone text := NULLIF(pg_catalog.btrim(COALESCE(p_phone, '')), '');
  v_relationship text := NULLIF(pg_catalog.btrim(COALESCE(p_relationship, '')), '');
BEGIN
  IF auth.uid() IS NULL OR p_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_user_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = p_profile_id
      AND profile.user_id = auth.uid()
      AND profile.is_active = true
  ) THEN
    RAISE EXCEPTION 'owned_active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF pg_catalog.char_length(v_name) NOT BETWEEN 1 AND 100
     OR v_name ~ '[<>]'
  THEN
    RAISE EXCEPTION 'invalid_emergency_contact_name' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.char_length(v_email) NOT BETWEEN 3 AND 254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR v_email ~ '[<>[:cntrl:]]'
  THEN
    RAISE EXCEPTION 'invalid_emergency_contact_email' USING ERRCODE = '22023';
  END IF;

  IF v_phone IS NOT NULL AND (
    pg_catalog.char_length(v_phone) NOT BETWEEN 10 AND 32
    OR v_phone !~ '^[+0-9 ()-]+$'
  ) THEN
    RAISE EXCEPTION 'invalid_emergency_contact_phone' USING ERRCODE = '22023';
  END IF;

  IF v_relationship IS NOT NULL AND (
    pg_catalog.char_length(v_relationship) > 80
    OR v_relationship ~ '[<>]'
  ) THEN
    RAISE EXCEPTION 'invalid_emergency_contact_relationship' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.emergency_contacts (
    profile_id,
    name,
    email,
    phone,
    relationship,
    is_primary,
    is_active,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    p_profile_id,
    v_name,
    v_email,
    v_phone,
    v_relationship,
    COALESCE(p_is_primary, false),
    true,
    '{}'::jsonb,
    v_now,
    v_now
  )
  RETURNING * INTO v_contact;

  RETURN v_contact;
END;
$function$;

CREATE OR REPLACE FUNCTION public.patch_emergency_contact(
  p_contact_id uuid,
  p_updates jsonb
)
RETURNS public.emergency_contacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_contact public.emergency_contacts%ROWTYPE;
  v_name text;
  v_email text;
  v_phone text;
  v_relationship text;
  v_is_primary boolean;
  v_is_active boolean;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF auth.uid() IS NULL OR p_contact_id IS NULL THEN
    RAISE EXCEPTION 'active_user_required' USING ERRCODE = '42501';
  END IF;

  IF p_updates IS NULL
     OR pg_catalog.jsonb_typeof(p_updates) <> 'object'
     OR p_updates = '{}'::jsonb
  THEN
    RAISE EXCEPTION 'invalid_emergency_contact_patch' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_object_keys(p_updates) AS key_name
    WHERE key_name NOT IN (
      'name','email','phone','relationship','is_primary','is_active'
    )
  ) THEN
    RAISE EXCEPTION 'unsupported_emergency_contact_patch_field'
      USING ERRCODE = '22023';
  END IF;

  SELECT contact.*
  INTO v_contact
  FROM public.emergency_contacts contact
  JOIN public.profiles profile
    ON profile.id = contact.profile_id
  WHERE contact.id = p_contact_id
    AND profile.user_id = auth.uid()
  FOR UPDATE OF contact;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'emergency_contact_not_found_or_forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF p_updates ? 'name' THEN
    IF p_updates -> 'name' = 'null'::jsonb
       OR pg_catalog.jsonb_typeof(p_updates -> 'name') <> 'string'
    THEN
      RAISE EXCEPTION 'invalid_emergency_contact_name' USING ERRCODE = '22023';
    END IF;
    v_name := pg_catalog.btrim(p_updates ->> 'name');
  ELSE
    v_name := v_contact.name;
  END IF;

  IF p_updates ? 'email' THEN
    IF p_updates -> 'email' = 'null'::jsonb
       OR pg_catalog.jsonb_typeof(p_updates -> 'email') <> 'string'
    THEN
      RAISE EXCEPTION 'invalid_emergency_contact_email' USING ERRCODE = '22023';
    END IF;
    v_email := pg_catalog.lower(pg_catalog.btrim(p_updates ->> 'email'));
  ELSE
    v_email := v_contact.email;
  END IF;

  IF p_updates ? 'phone' THEN
    IF p_updates -> 'phone' = 'null'::jsonb THEN
      v_phone := NULL;
    ELSIF pg_catalog.jsonb_typeof(p_updates -> 'phone') = 'string' THEN
      v_phone := NULLIF(pg_catalog.btrim(p_updates ->> 'phone'), '');
    ELSE
      RAISE EXCEPTION 'invalid_emergency_contact_phone' USING ERRCODE = '22023';
    END IF;
  ELSE
    v_phone := v_contact.phone;
  END IF;

  IF p_updates ? 'relationship' THEN
    IF p_updates -> 'relationship' = 'null'::jsonb THEN
      v_relationship := NULL;
    ELSIF pg_catalog.jsonb_typeof(p_updates -> 'relationship') = 'string' THEN
      v_relationship := NULLIF(pg_catalog.btrim(p_updates ->> 'relationship'), '');
    ELSE
      RAISE EXCEPTION 'invalid_emergency_contact_relationship'
        USING ERRCODE = '22023';
    END IF;
  ELSE
    v_relationship := v_contact.relationship;
  END IF;

  IF p_updates ? 'is_primary' THEN
    IF pg_catalog.jsonb_typeof(p_updates -> 'is_primary') <> 'boolean' THEN
      RAISE EXCEPTION 'invalid_emergency_contact_primary'
        USING ERRCODE = '22023';
    END IF;
    v_is_primary := (p_updates ->> 'is_primary')::boolean;
  ELSE
    v_is_primary := v_contact.is_primary;
  END IF;

  IF p_updates ? 'is_active' THEN
    IF pg_catalog.jsonb_typeof(p_updates -> 'is_active') <> 'boolean' THEN
      RAISE EXCEPTION 'invalid_emergency_contact_active'
        USING ERRCODE = '22023';
    END IF;
    v_is_active := (p_updates ->> 'is_active')::boolean;
  ELSE
    v_is_active := v_contact.is_active;
  END IF;

  IF NOT v_is_active THEN
    v_is_primary := false;
  END IF;

  IF pg_catalog.char_length(v_name) NOT BETWEEN 1 AND 100
     OR v_name ~ '[<>]'
  THEN
    RAISE EXCEPTION 'invalid_emergency_contact_name' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.char_length(v_email) NOT BETWEEN 3 AND 254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR v_email ~ '[<>[:cntrl:]]'
  THEN
    RAISE EXCEPTION 'invalid_emergency_contact_email' USING ERRCODE = '22023';
  END IF;

  IF v_phone IS NOT NULL AND (
    pg_catalog.char_length(v_phone) NOT BETWEEN 10 AND 32
    OR v_phone !~ '^[+0-9 ()-]+$'
  ) THEN
    RAISE EXCEPTION 'invalid_emergency_contact_phone' USING ERRCODE = '22023';
  END IF;

  IF v_relationship IS NOT NULL AND (
    pg_catalog.char_length(v_relationship) > 80
    OR v_relationship ~ '[<>]'
  ) THEN
    RAISE EXCEPTION 'invalid_emergency_contact_relationship'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.emergency_contacts contact
  SET
    name = v_name,
    email = v_email,
    phone = v_phone,
    relationship = v_relationship,
    is_primary = v_is_primary,
    is_active = v_is_active,
    updated_at = v_now
  WHERE contact.id = p_contact_id
  RETURNING * INTO v_contact;

  RETURN v_contact;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_emergency_contact(
  uuid, text, text, text, text, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_emergency_contact(
  uuid, text, text, text, text, boolean
) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.patch_emergency_contact(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.patch_emergency_contact(uuid, jsonb)
  TO authenticated, service_role;

REVOKE INSERT, UPDATE ON TABLE public.emergency_contacts FROM authenticated;
DROP POLICY IF EXISTS emergency_contacts_insert_own ON public.emergency_contacts;
DROP POLICY IF EXISTS emergency_contacts_update_own ON public.emergency_contacts;

COMMENT ON FUNCTION public.create_emergency_contact(
  uuid, text, text, text, text, boolean
) IS
  'Owned-active-Profile emergency-contact creation command. Lifecycle, metadata and timestamps are server-owned; one active primary is enforced by database index.';
COMMENT ON FUNCTION public.patch_emergency_contact(uuid, jsonb) IS
  'Owned emergency-contact patch command with a strict mutable-field allowlist. profile_id, metadata and created_at are immutable to browser clients.';
