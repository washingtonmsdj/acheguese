-- Consolidate Business and Professional contact channels behind one audited,
-- actor-bound Core Platform contract. Raw domain tables are not contact stores.

CREATE TABLE IF NOT EXISTS private.entity_contact_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_data(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professional_data(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  channel_value TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'authenticated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entity_contact_channels_single_owner_check
    CHECK (num_nonnulls(business_id, professional_id) = 1),
  CONSTRAINT entity_contact_channels_type_check
    CHECK (channel_type IN ('phone', 'whatsapp', 'email')),
  CONSTRAINT entity_contact_channels_visibility_check
    CHECK (visibility IN ('private', 'authenticated')),
  CONSTRAINT entity_contact_channels_value_length_check
    CHECK (char_length(channel_value) BETWEEN 3 AND 254)
);

CREATE UNIQUE INDEX IF NOT EXISTS entity_contact_channels_business_channel_uidx
  ON private.entity_contact_channels(business_id, channel_type)
  WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entity_contact_channels_professional_channel_uidx
  ON private.entity_contact_channels(professional_id, channel_type)
  WHERE professional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS entity_contact_channels_business_lookup_idx
  ON private.entity_contact_channels(business_id)
  WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS entity_contact_channels_professional_lookup_idx
  ON private.entity_contact_channels(professional_id)
  WHERE professional_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS private.entity_contact_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('business', 'professional')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('patch')),
  channel_types TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entity_contact_audit_log_entity_idx
  ON private.entity_contact_audit_log(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS private.professional_credentials (
  professional_id UUID PRIMARY KEY
    REFERENCES public.professional_data(id) ON DELETE CASCADE,
  license_number TEXT,
  license_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professional_credentials_value_check
    CHECK (license_number IS NOT NULL OR license_state IS NOT NULL),
  CONSTRAINT professional_credentials_number_length_check
    CHECK (license_number IS NULL OR char_length(license_number) BETWEEN 2 AND 64),
  CONSTRAINT professional_credentials_state_check
    CHECK (license_state IS NULL OR license_state ~ '^[A-Z]{2}$')
);

CREATE TABLE IF NOT EXISTS private.professional_credentials_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS professional_credentials_audit_entity_idx
  ON private.professional_credentials_audit_log(professional_id, created_at DESC);

REVOKE ALL ON TABLE private.entity_contact_channels FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.entity_contact_audit_log FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.professional_credentials FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.professional_credentials_audit_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.entity_contact_channels TO service_role;
GRANT ALL ON TABLE private.entity_contact_audit_log TO service_role;
GRANT ALL ON TABLE private.professional_credentials TO service_role;
GRANT ALL ON TABLE private.professional_credentials_audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE private.entity_contact_audit_log_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE private.professional_credentials_audit_log_id_seq TO service_role;

COMMENT ON TABLE private.entity_contact_channels IS
  'Core Platform SSOT for Business and Professional contact channels. Values are never exposed through generic domain rows.';
COMMENT ON COLUMN private.entity_contact_channels.visibility IS
  'private: owner/admin only; authenticated: visible to signed-in users when the entity is publicly available.';
COMMENT ON TABLE private.entity_contact_audit_log IS
  'Append-only contact mutation audit. Contact values are deliberately excluded.';
COMMENT ON TABLE private.professional_credentials IS
  'Private SSOT for professional registration identifiers. Public projections expose verification state only.';
COMMENT ON TABLE private.professional_credentials_audit_log IS
  'Append-only credential mutation audit without credential values.';

CREATE OR REPLACE FUNCTION public.contact_rpc_get_visible_channels(
  p_actor_user_id UUID,
  p_business_ids UUID[] DEFAULT NULL,
  p_professional_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  channel_type TEXT,
  channel_value TEXT,
  visibility TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF COALESCE(cardinality(p_business_ids), 0) > 50
     OR COALESCE(cardinality(p_professional_ids), 0) > 50 THEN
    RAISE EXCEPTION 'contact scope exceeds limit';
  END IF;

  IF COALESCE(cardinality(p_business_ids), 0) = 0
     AND COALESCE(cardinality(p_professional_ids), 0) = 0 THEN
    RAISE EXCEPTION 'contact scope is required';
  END IF;

  RETURN QUERY
  SELECT
    'business'::TEXT,
    channels.business_id,
    channels.channel_type,
    channels.channel_value,
    channels.visibility
  FROM private.entity_contact_channels channels
  JOIN public.business_data business ON business.id = channels.business_id
  WHERE channels.business_id = ANY(COALESCE(p_business_ids, ARRAY[]::UUID[]))
    AND (
      (
        channels.visibility = 'authenticated'
        AND business.status::TEXT = 'active'
        AND business.business_role IN ('standalone', 'branch')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = business.profile_id
          AND member.user_id = p_actor_user_id
          AND member.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles profile
        WHERE profile.id = business.profile_id
          AND profile.user_id = p_actor_user_id
      )
    )

  UNION ALL

  SELECT
    'professional'::TEXT,
    channels.professional_id,
    channels.channel_type,
    channels.channel_value,
    channels.visibility
  FROM private.entity_contact_channels channels
  JOIN public.professional_data professional
    ON professional.id = channels.professional_id
  WHERE channels.professional_id = ANY(COALESCE(p_professional_ids, ARRAY[]::UUID[]))
    AND (
      (
        channels.visibility = 'authenticated'
        AND professional.is_accepting_clients = true
        AND professional.visibility::TEXT IN ('public_listed', 'public_unlisted')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = professional.profile_id
          AND member.user_id = p_actor_user_id
          AND member.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles profile
        WHERE profile.id = professional.profile_id
          AND profile.user_id = p_actor_user_id
      )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.contact_rpc_patch_owned_channels(
  p_actor_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_channels JSONB
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  channel_type TEXT,
  channel_value TEXT,
  visibility TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_channel JSONB;
  v_channel_type TEXT;
  v_channel_value TEXT;
  v_visibility TEXT;
  v_seen_types TEXT[] := ARRAY[]::TEXT[];
  v_is_owner BOOLEAN := false;
BEGIN
  IF p_actor_user_id IS NULL OR p_entity_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_entity_type NOT IN ('business', 'professional') THEN
    RAISE EXCEPTION 'invalid entity type';
  END IF;

  IF jsonb_typeof(p_channels) <> 'array' OR jsonb_array_length(p_channels) > 3 THEN
    RAISE EXCEPTION 'invalid contact channels';
  END IF;

  IF p_entity_type = 'business' THEN
    SELECT (
      EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = business.profile_id
          AND member.user_id = p_actor_user_id
          AND member.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles profile
        WHERE profile.id = business.profile_id
          AND profile.user_id = p_actor_user_id
      )
    )
    INTO v_is_owner
    FROM public.business_data business
    WHERE business.id = p_entity_id;
  ELSE
    SELECT (
      EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = professional.profile_id
          AND member.user_id = p_actor_user_id
          AND member.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles profile
        WHERE profile.id = professional.profile_id
          AND profile.user_id = p_actor_user_id
      )
    )
    INTO v_is_owner
    FROM public.professional_data professional
    WHERE professional.id = p_entity_id;
  END IF;

  IF COALESCE(v_is_owner, false) = false THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_channel IN SELECT value FROM jsonb_array_elements(p_channels)
  LOOP
    IF jsonb_typeof(v_channel) <> 'object' THEN
      RAISE EXCEPTION 'invalid contact channel';
    END IF;

    v_channel_type := v_channel->>'channelType';
    v_channel_value := NULLIF(btrim(COALESCE(v_channel->>'value', '')), '');
    v_visibility := COALESCE(NULLIF(v_channel->>'visibility', ''), 'authenticated');

    IF v_channel_type NOT IN ('phone', 'whatsapp', 'email')
       OR v_channel_type = ANY(v_seen_types) THEN
      RAISE EXCEPTION 'invalid or duplicate contact channel';
    END IF;

    IF v_visibility NOT IN ('private', 'authenticated') THEN
      RAISE EXCEPTION 'invalid contact visibility';
    END IF;

    IF v_channel_value IS NOT NULL THEN
      IF char_length(v_channel_value) > 254 THEN
        RAISE EXCEPTION 'contact value exceeds limit';
      END IF;

      IF v_channel_type = 'email'
         AND v_channel_value !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
        RAISE EXCEPTION 'invalid email';
      END IF;

      IF v_channel_type IN ('phone', 'whatsapp')
         AND char_length(regexp_replace(v_channel_value, '[^0-9]', '', 'g')) NOT BETWEEN 8 AND 15 THEN
        RAISE EXCEPTION 'invalid phone';
      END IF;
    END IF;

    v_seen_types := array_append(v_seen_types, v_channel_type);

    IF p_entity_type = 'business' THEN
      IF v_channel_value IS NULL THEN
        DELETE FROM private.entity_contact_channels channels
        WHERE channels.business_id = p_entity_id
          AND channels.channel_type = v_channel_type;
      ELSE
        INSERT INTO private.entity_contact_channels (
          business_id,
          channel_type,
          channel_value,
          visibility
        ) VALUES (
          p_entity_id,
          v_channel_type,
          v_channel_value,
          v_visibility
        )
        ON CONFLICT (business_id, channel_type) WHERE business_id IS NOT NULL
        DO UPDATE SET
          channel_value = EXCLUDED.channel_value,
          visibility = EXCLUDED.visibility,
          updated_at = now();
      END IF;
    ELSE
      IF v_channel_value IS NULL THEN
        DELETE FROM private.entity_contact_channels channels
        WHERE channels.professional_id = p_entity_id
          AND channels.channel_type = v_channel_type;
      ELSE
        INSERT INTO private.entity_contact_channels (
          professional_id,
          channel_type,
          channel_value,
          visibility
        ) VALUES (
          p_entity_id,
          v_channel_type,
          v_channel_value,
          v_visibility
        )
        ON CONFLICT (professional_id, channel_type) WHERE professional_id IS NOT NULL
        DO UPDATE SET
          channel_value = EXCLUDED.channel_value,
          visibility = EXCLUDED.visibility,
          updated_at = now();
      END IF;
    END IF;
  END LOOP;

  INSERT INTO private.entity_contact_audit_log (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    channel_types
  ) VALUES (
    p_actor_user_id,
    p_entity_type,
    p_entity_id,
    'patch',
    v_seen_types
  );

  RETURN QUERY
  SELECT
    p_entity_type,
    p_entity_id,
    channels.channel_type,
    channels.channel_value,
    channels.visibility
  FROM private.entity_contact_channels channels
  WHERE (p_entity_type = 'business' AND channels.business_id = p_entity_id)
     OR (p_entity_type = 'professional' AND channels.professional_id = p_entity_id)
  ORDER BY channels.channel_type;
END;
$$;

REVOKE ALL ON FUNCTION public.contact_rpc_get_visible_channels(UUID, UUID[], UUID[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.contact_rpc_patch_owned_channels(UUID, TEXT, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.contact_rpc_get_visible_channels(UUID, UUID[], UUID[])
  TO service_role;
GRANT EXECUTE ON FUNCTION public.contact_rpc_patch_owned_channels(UUID, TEXT, UUID, JSONB)
  TO service_role;

CREATE OR REPLACE FUNCTION public.professional_credentials_rpc_get_owned(
  p_actor_user_id UUID,
  p_profile_id UUID
)
RETURNS TABLE (
  professional_id UUID,
  profile_id UUID,
  license_number TEXT,
  license_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF p_actor_user_id IS NULL OR p_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users actor WHERE actor.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.professional_data professional
    WHERE professional.profile_id = p_profile_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.profiles profile
          WHERE profile.id = professional.profile_id
            AND profile.user_id = p_actor_user_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.profile_members member
          WHERE member.profile_id = professional.profile_id
            AND member.user_id = p_actor_user_id
            AND member.role IN ('owner', 'admin')
        )
      )
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    professional.id,
    professional.profile_id,
    credentials.license_number,
    credentials.license_state
  FROM public.professional_data professional
  LEFT JOIN private.professional_credentials credentials
    ON credentials.professional_id = professional.id
  WHERE professional.profile_id = p_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.professional_credentials_rpc_patch_owned(
  p_actor_user_id UUID,
  p_profile_id UUID,
  p_credentials JSONB
)
RETURNS TABLE (
  professional_id UUID,
  profile_id UUID,
  license_number TEXT,
  license_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_professional_id UUID;
  v_license_number TEXT;
  v_license_state TEXT;
  v_changed_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_actor_user_id IS NULL OR p_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users actor WHERE actor.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF jsonb_typeof(p_credentials) <> 'object'
     OR p_credentials = '{}'::JSONB
     OR EXISTS (
       SELECT 1
       FROM jsonb_object_keys(p_credentials) AS keys(key_name)
       WHERE key_name NOT IN ('licenseNumber', 'licenseState')
     ) THEN
    RAISE EXCEPTION 'invalid professional credentials';
  END IF;

  IF (p_credentials ? 'licenseNumber'
      AND jsonb_typeof(p_credentials->'licenseNumber') NOT IN ('string', 'null'))
     OR (p_credentials ? 'licenseState'
      AND jsonb_typeof(p_credentials->'licenseState') NOT IN ('string', 'null')) THEN
    RAISE EXCEPTION 'invalid professional credentials';
  END IF;

  SELECT professional.id
  INTO v_professional_id
  FROM public.professional_data professional
  WHERE professional.profile_id = p_profile_id
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles profile
        WHERE profile.id = professional.profile_id
          AND profile.user_id = p_actor_user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = professional.profile_id
          AND member.user_id = p_actor_user_id
          AND member.role IN ('owner', 'admin')
      )
    );

  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT credentials.license_number, credentials.license_state
  INTO v_license_number, v_license_state
  FROM private.professional_credentials credentials
  WHERE credentials.professional_id = v_professional_id;

  IF p_credentials ? 'licenseNumber' THEN
    v_license_number := NULLIF(btrim(p_credentials->>'licenseNumber'), '');
    v_changed_fields := array_append(v_changed_fields, 'license_number');
  END IF;

  IF p_credentials ? 'licenseState' THEN
    v_license_state := NULLIF(upper(btrim(p_credentials->>'licenseState')), '');
    v_changed_fields := array_append(v_changed_fields, 'license_state');
  END IF;

  IF v_license_number IS NOT NULL AND (
    char_length(v_license_number) NOT BETWEEN 2 AND 64
    OR v_license_number !~ '^[[:alnum:]/. -]+$'
  ) THEN
    RAISE EXCEPTION 'invalid license number';
  END IF;

  IF v_license_state IS NOT NULL AND v_license_state !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'invalid license state';
  END IF;

  IF v_license_number IS NULL AND v_license_state IS NULL THEN
    DELETE FROM private.professional_credentials credentials
    WHERE credentials.professional_id = v_professional_id;
  ELSE
    INSERT INTO private.professional_credentials (
      professional_id,
      license_number,
      license_state
    ) VALUES (
      v_professional_id,
      v_license_number,
      v_license_state
    )
    ON CONFLICT (professional_id) DO UPDATE SET
      license_number = EXCLUDED.license_number,
      license_state = EXCLUDED.license_state,
      updated_at = now();
  END IF;

  INSERT INTO private.professional_credentials_audit_log (
    actor_user_id,
    professional_id,
    changed_fields
  ) VALUES (
    p_actor_user_id,
    v_professional_id,
    v_changed_fields
  );

  RETURN QUERY
  SELECT
    professional.id,
    professional.profile_id,
    credentials.license_number,
    credentials.license_state
  FROM public.professional_data professional
  LEFT JOIN private.professional_credentials credentials
    ON credentials.professional_id = professional.id
  WHERE professional.id = v_professional_id;
END;
$$;

REVOKE ALL ON FUNCTION public.professional_credentials_rpc_get_owned(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.professional_credentials_rpc_patch_owned(UUID, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.professional_credentials_rpc_get_owned(UUID, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.professional_credentials_rpc_patch_owned(UUID, UUID, JSONB)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_create_profile_with_extension(
  p_actor_user_id UUID,
  p_profile_type TEXT,
  p_handle TEXT,
  p_display_name TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_extension_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_business_id UUID;
  v_professional_id UUID;
  v_normalized_handle CITEXT;
  v_address_id UUID;
  v_location_id UUID;
  v_professional_slug TEXT;
  v_contact_channels JSONB := '[]'::JSONB;
  v_credentials JSONB := '{}'::JSONB;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users actor WHERE actor.id = p_actor_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_profile_type NOT IN ('personal', 'business', 'professional', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid profile type');
  END IF;

  IF p_profile_type IN ('business', 'professional', 'driver')
     AND p_extension_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Extension data required for ' || p_profile_type || ' profiles'
    );
  END IF;

  IF p_profile_type = 'business'
     AND NULLIF(btrim(p_extension_data->>'legal_name'), '') IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'legal_name is required for business profiles'
    );
  END IF;

  IF p_profile_type = 'professional' THEN
    IF NULLIF(btrim(p_extension_data->>'profession'), '') IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'profession is required for professional profiles'
      );
    END IF;
    IF NULLIF(btrim(p_extension_data->>'location_id'), '') IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'location_id is required for professional profiles'
      );
    END IF;
  END IF;

  IF p_profile_type = 'driver' THEN
    IF NULLIF(btrim(p_extension_data->>'license_number'), '') IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'license_number is required for driver profiles'
      );
    END IF;
    IF p_extension_data->>'license_category' IS NULL
       OR p_extension_data->>'license_expiry' IS NULL
       OR p_extension_data->>'license_state' IS NULL
       OR p_extension_data->>'vehicle_type' IS NULL
       OR NULLIF(btrim(p_extension_data->>'vehicle_plate'), '') IS NULL
       OR NULLIF(btrim(p_extension_data->>'vehicle_model'), '') IS NULL
       OR p_extension_data->>'vehicle_year' IS NULL
       OR NULLIF(btrim(p_extension_data->>'vehicle_color'), '') IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Incomplete driver extension data'
      );
    END IF;
  END IF;

  v_normalized_handle := lower(btrim(regexp_replace(p_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,99}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;

  IF p_profile_type = 'personal' AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.user_id = p_actor_user_id
      AND profile.profile_type = 'personal'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has a personal profile'
    );
  END IF;

  IF p_profile_type = 'driver' AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.user_id = p_actor_user_id
      AND profile.profile_type = 'driver'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has a driver profile'
    );
  END IF;

  v_address_id := NULLIF(p_extension_data->>'address_id', '')::UUID;
  v_location_id := NULLIF(p_extension_data->>'location_id', '')::UUID;

  IF p_profile_type = 'professional' THEN
    v_professional_slug := NULLIF(btrim(COALESCE(p_extension_data->>'slug', '')), '');
    IF v_professional_slug IS NULL THEN
      v_professional_slug := v_normalized_handle::TEXT;
    END IF;
    v_professional_slug := lower(
      regexp_replace(v_professional_slug, '[^a-z0-9-]+', '-', 'g')
    );
    v_professional_slug := regexp_replace(v_professional_slug, '-+', '-', 'g');
    v_professional_slug := regexp_replace(v_professional_slug, '^-|-$', '', 'g');
  END IF;

  INSERT INTO public.profiles (
    user_id,
    profile_type,
    handle,
    name,
    display_name,
    avatar_url,
    bio
  ) VALUES (
    p_actor_user_id,
    p_profile_type,
    v_normalized_handle,
    p_display_name,
    p_display_name,
    p_avatar_url,
    p_bio
  ) RETURNING id INTO v_profile_id;

  IF p_profile_type = 'business' THEN
    INSERT INTO public.business_data (
      profile_id,
      business_name,
      legal_name,
      cnpj,
      company_type,
      industry,
      status,
      address_id,
      location_id
    ) VALUES (
      v_profile_id,
      p_extension_data->>'legal_name',
      p_extension_data->>'legal_name',
      p_extension_data->>'cnpj',
      p_extension_data->>'company_type',
      p_extension_data->>'industry',
      'pending',
      v_address_id,
      v_location_id
    ) RETURNING id INTO v_business_id;

    INSERT INTO public.profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, p_actor_user_id, 'owner');

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'channelType', contact.channel_type,
          'value', contact.channel_value,
          'visibility', 'authenticated'
        )
      ),
      '[]'::JSONB
    )
    INTO v_contact_channels
    FROM (
      VALUES
        ('phone', COALESCE(p_extension_data->>'phone', p_extension_data->'metadata'->>'phone')),
        ('whatsapp', COALESCE(p_extension_data->>'whatsapp', p_extension_data->'metadata'->>'whatsapp')),
        ('email', COALESCE(p_extension_data->>'email', p_extension_data->'metadata'->>'email'))
    ) AS contact(channel_type, channel_value)
    WHERE NULLIF(btrim(contact.channel_value), '') IS NOT NULL;

    IF jsonb_array_length(v_contact_channels) > 0 THEN
      PERFORM public.contact_rpc_patch_owned_channels(
        p_actor_user_id,
        'business',
        v_business_id,
        v_contact_channels
      );
    END IF;

  ELSIF p_profile_type = 'professional' THEN
    INSERT INTO public.professional_data (
      profile_id,
      slug,
      professional_name,
      service_category,
      service_subcategory,
      description,
      certifications,
      experience_years,
      education,
      price_range,
      service_areas,
      available_hours,
      is_accepting_clients,
      address_id,
      location_id,
      metadata
    ) VALUES (
      v_profile_id,
      v_professional_slug,
      p_display_name,
      p_extension_data->'metadata'->>'category',
      p_extension_data->>'profession',
      p_bio,
      COALESCE(p_extension_data->'certifications', '[]'::JSONB),
      NULLIF(p_extension_data->>'years_experience', '')::INTEGER,
      p_extension_data->>'education',
      p_extension_data->'metadata'->>'price_range',
      COALESCE(p_extension_data->'service_area', '[]'::JSONB),
      p_extension_data->'metadata'->'available_hours',
      true,
      v_address_id,
      v_location_id,
      COALESCE(p_extension_data->'metadata', '{}'::JSONB)
        - ARRAY['phone', 'whatsapp', 'email']
    ) RETURNING id INTO v_professional_id;

    INSERT INTO public.profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, p_actor_user_id, 'owner');

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'channelType', contact.channel_type,
          'value', contact.channel_value,
          'visibility', 'authenticated'
        )
      ),
      '[]'::JSONB
    )
    INTO v_contact_channels
    FROM (
      VALUES
        ('phone', COALESCE(p_extension_data->>'phone', p_extension_data->'metadata'->>'phone')),
        ('whatsapp', COALESCE(p_extension_data->>'whatsapp', p_extension_data->'metadata'->>'whatsapp')),
        ('email', COALESCE(p_extension_data->>'email', p_extension_data->'metadata'->>'email'))
    ) AS contact(channel_type, channel_value)
    WHERE NULLIF(btrim(contact.channel_value), '') IS NOT NULL;

    IF jsonb_array_length(v_contact_channels) > 0 THEN
      PERFORM public.contact_rpc_patch_owned_channels(
        p_actor_user_id,
        'professional',
        v_professional_id,
        v_contact_channels
      );
    END IF;

    v_credentials := jsonb_strip_nulls(
      jsonb_build_object(
        'licenseNumber', NULLIF(btrim(p_extension_data->>'license_number'), ''),
        'licenseState', NULLIF(upper(btrim(p_extension_data->>'license_state')), '')
      )
    );
    IF v_credentials <> '{}'::JSONB THEN
      PERFORM public.professional_credentials_rpc_patch_owned(
        p_actor_user_id,
        v_profile_id,
        v_credentials
      );
    END IF;

  ELSIF p_profile_type = 'driver' THEN
    INSERT INTO public.driver_data (
      profile_id,
      license_number,
      license_category,
      license_expiry,
      license_state,
      vehicle,
      vehicle_type,
      vehicle_plate,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      documents_verified,
      documents_verified_at,
      background_check_status,
      background_check_date,
      is_available,
      can_do_delivery,
      can_do_rides
    ) VALUES (
      v_profile_id,
      p_extension_data->>'license_number',
      p_extension_data->>'license_category',
      (p_extension_data->>'license_expiry')::DATE,
      p_extension_data->>'license_state',
      jsonb_build_object(
        'type', p_extension_data->>'vehicle_type',
        'plate', p_extension_data->>'vehicle_plate',
        'model', p_extension_data->>'vehicle_model',
        'year', NULLIF(p_extension_data->>'vehicle_year', '')::INTEGER,
        'color', p_extension_data->>'vehicle_color'
      ),
      p_extension_data->>'vehicle_type',
      p_extension_data->>'vehicle_plate',
      p_extension_data->>'vehicle_model',
      NULLIF(p_extension_data->>'vehicle_year', '')::INTEGER,
      p_extension_data->>'vehicle_color',
      COALESCE((p_extension_data->>'documents_verified')::BOOLEAN, false),
      NULLIF(p_extension_data->>'documents_verified_at', '')::TIMESTAMPTZ,
      COALESCE(p_extension_data->>'background_check_status', 'pending'),
      NULLIF(p_extension_data->>'background_check_date', '')::TIMESTAMPTZ,
      COALESCE((p_extension_data->>'is_available')::BOOLEAN, false),
      COALESCE((p_extension_data->>'can_do_delivery')::BOOLEAN, true),
      COALESCE((p_extension_data->>'can_do_rides')::BOOLEAN, true)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', v_profile_id,
      'handle', v_normalized_handle
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.profile_create_profile_with_extension(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_create_profile_with_extension(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_work_opportunity_professional_ownership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.professional_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.professional_data professional
    WHERE professional.id = NEW.professional_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.profiles profile
          WHERE profile.id = professional.profile_id
            AND profile.user_id = NEW.author_user_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.profile_members member
          WHERE member.profile_id = professional.profile_id
            AND member.user_id = NEW.author_user_id
            AND member.role IN ('owner', 'admin')
        )
      )
  ) THEN
    RAISE EXCEPTION 'Linked professional profile must belong to the same user';
  END IF;

  RETURN NEW;
END;
$$;

DROP VIEW IF EXISTS public.work_opportunity_match_candidates;
CREATE VIEW public.work_opportunity_match_candidates
WITH (security_invoker = true)
AS
SELECT
  opportunity.id AS opportunity_id,
  opportunity.professional_category,
  opportunity.territory_location_id,
  opportunity.urgency,
  professional.id AS professional_id,
  professional.service_category,
  professional.availability_notes,
  professional.location_id AS professional_location_id,
  professional.visibility AS professional_visibility,
  professional.is_accepting_clients
FROM public.work_opportunities opportunity
JOIN public.professional_data professional
  ON professional.service_category = opportunity.professional_category
 AND professional.location_id = opportunity.territory_location_id
JOIN public.profiles professional_profile
  ON professional_profile.id = professional.profile_id
WHERE opportunity.status = 'active'
  AND opportunity.visibility = 'public_listed'
  AND professional.is_accepting_clients = true
  AND professional.visibility IN ('public_listed', 'public_unlisted')
  AND professional_profile.user_id IS DISTINCT FROM opportunity.author_user_id;

REVOKE ALL ON TABLE public.work_opportunity_match_candidates
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.work_opportunity_match_candidates TO authenticated;

INSERT INTO private.entity_contact_channels (
  business_id,
  channel_type,
  channel_value,
  visibility
)
SELECT id, 'email', btrim(email), 'authenticated'
FROM public.business_data
WHERE NULLIF(btrim(email), '') IS NOT NULL
ON CONFLICT (business_id, channel_type) WHERE business_id IS NOT NULL
DO UPDATE SET channel_value = EXCLUDED.channel_value, updated_at = now();

INSERT INTO private.entity_contact_channels (
  business_id,
  channel_type,
  channel_value,
  visibility
)
SELECT id, 'phone', btrim(metadata->>'phone'), 'authenticated'
FROM public.business_data
WHERE NULLIF(btrim(metadata->>'phone'), '') IS NOT NULL
ON CONFLICT (business_id, channel_type) WHERE business_id IS NOT NULL
DO UPDATE SET channel_value = EXCLUDED.channel_value, updated_at = now();

INSERT INTO private.entity_contact_channels (
  business_id,
  channel_type,
  channel_value,
  visibility
)
SELECT id, 'whatsapp', btrim(metadata->>'whatsapp'), 'authenticated'
FROM public.business_data
WHERE NULLIF(btrim(metadata->>'whatsapp'), '') IS NOT NULL
ON CONFLICT (business_id, channel_type) WHERE business_id IS NOT NULL
DO UPDATE SET channel_value = EXCLUDED.channel_value, updated_at = now();

INSERT INTO private.entity_contact_channels (
  professional_id,
  channel_type,
  channel_value,
  visibility
)
SELECT id, 'email', btrim(email), 'authenticated'
FROM public.professional_data
WHERE NULLIF(btrim(email), '') IS NOT NULL
ON CONFLICT (professional_id, channel_type) WHERE professional_id IS NOT NULL
DO UPDATE SET channel_value = EXCLUDED.channel_value, updated_at = now();

INSERT INTO private.professional_credentials (
  professional_id,
  license_number,
  license_state
)
SELECT
  credentials.id,
  credentials.license_number,
  credentials.license_state
FROM (
  SELECT
    professional.id,
    CASE
      WHEN char_length(NULLIF(btrim(professional.license_number), '')) BETWEEN 2 AND 64
        THEN NULLIF(btrim(professional.license_number), '')
      ELSE NULL
    END AS license_number,
    CASE
      WHEN upper(btrim(professional.license_state)) ~ '^[A-Z]{2}$'
        THEN upper(btrim(professional.license_state))
      ELSE NULL
    END AS license_state
  FROM public.professional_data professional
) credentials
WHERE credentials.license_number IS NOT NULL
   OR credentials.license_state IS NOT NULL
ON CONFLICT (professional_id) DO UPDATE SET
  license_number = EXCLUDED.license_number,
  license_state = EXCLUDED.license_state,
  updated_at = now();

INSERT INTO private.entity_contact_channels (
  professional_id,
  channel_type,
  channel_value,
  visibility
)
SELECT id, 'whatsapp', btrim(whatsapp), 'authenticated'
FROM public.professional_data
WHERE NULLIF(btrim(whatsapp), '') IS NOT NULL
ON CONFLICT (professional_id, channel_type) WHERE professional_id IS NOT NULL
DO UPDATE SET channel_value = EXCLUDED.channel_value, updated_at = now();

UPDATE public.business_data
SET metadata = metadata - ARRAY['phone', 'whatsapp', 'email'];

UPDATE public.professional_data
SET metadata = metadata - ARRAY['phone', 'whatsapp', 'email'];

ALTER TABLE public.business_data
  ADD CONSTRAINT business_data_metadata_no_contact
  CHECK (NOT metadata ?| ARRAY['phone', 'whatsapp', 'email']);

ALTER TABLE public.professional_data
  ADD CONSTRAINT professional_data_metadata_no_contact
  CHECK (NOT metadata ?| ARRAY['phone', 'whatsapp', 'email']);

-- Snapshot RPC definitions are refreshed below before the legacy columns are
-- removed, so anonymous payloads can no longer carry contact values.

CREATE OR REPLACE FUNCTION get_public_business_snapshot_by_slug(
  p_state TEXT,
  p_city TEXT,
  p_district TEXT,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_geo_path TEXT := '/br/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district));
  v_row RECORD;
  v_has_gastronomy BOOLEAN := false;
  v_business_url TEXT;
  v_gastronomy_url TEXT;
  v_photos JSONB := '[]'::jsonb;
  v_preview JSONB := '[]'::jsonb;
BEGIN
  SELECT
    bd.id AS business_id,
    bd.profile_id,
    bd.slug,
    bd.business_name,
    bd.description,
    bd.category,
    bd.subcategory,
    NULL::TEXT AS email,
    bd.website,
    bd.instagram,
    bd.facebook,
    bd.opening_hours,
    bd.rating,
    bd.total_reviews,
    bd.metadata,
    bd.is_premium,
    bd.is_verified,
    bd.status,
    bd.created_at,
    bd.updated_at,
    l.id AS location_id,
    l.name AS location_name,
    l.canonical_lat,
    l.canonical_lng,
    a.street AS address_street,
    a.number AS address_number,
    a.complement AS address_complement,
    a.postal_code AS address_postal_code,
    a.latitude AS address_latitude,
    a.longitude AS address_longitude,
    l.geographic_path,
    l.full_name
  INTO v_row
  FROM business_data bd
  JOIN locations l ON l.id = bd.location_id
  LEFT JOIN addresses a ON a.id = bd.address_id
  WHERE bd.status = 'active'
    AND bd.business_role IN ('standalone', 'branch')
    AND bd.slug = p_slug
    AND l.geographic_path = v_geo_path
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_business_url := '/empresas/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || v_row.slug;
  v_gastronomy_url := v_business_url;

  SELECT EXISTS (
    SELECT 1
    FROM gastronomy_profiles gp
    WHERE gp.business_id = v_row.business_id
      AND gp.status = 'active'
  )
  INTO v_has_gastronomy;

  SELECT COALESCE(
    jsonb_agg(bg.image_url ORDER BY bg.is_featured DESC, bg.display_order ASC, bg.created_at DESC),
    '[]'::jsonb
  )
  INTO v_photos
  FROM business_gallery bg
  WHERE bg.business_id = v_row.business_id;

  IF v_has_gastronomy THEN
    WITH featured AS (
      SELECT
        mi.id,
        mi.name,
        mi.image_url,
        LEAST(
          mi.base_price,
          COALESCE(
            (
              SELECT MIN(mi.base_price + v.price_adjustment)
              FROM menu_item_variants v
              WHERE v.item_id = mi.id
                AND v.is_available = true
            ),
            mi.base_price
          )
        ) AS price_from
      FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      JOIN menus m ON m.id = mc.menu_id
      WHERE m.business_id = v_row.business_id
        AND m.is_active = true
        AND mc.is_available = true
        AND mi.is_available = true
      ORDER BY mi.is_featured DESC, mi.display_order ASC, mi.created_at DESC
      LIMIT 3
    )
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'name', f.name,
          'imageUrl', f.image_url,
          'priceFrom', f.price_from,
          'priceLabel', 'A partir de R$ ' || to_char(f.price_from, 'FM999999990D00'),
          'menuUrl', v_gastronomy_url
        )
      ),
      '[]'::jsonb
    )
    INTO v_preview
    FROM featured f;
  END IF;

  RETURN jsonb_build_object(
    'identity', jsonb_build_object(
      'profileId', v_row.profile_id,
      'businessId', v_row.business_id,
      'slug', v_row.slug,
      'displayName', v_row.business_name,
      'canonicalBusinessUrl', v_business_url
    ),
    'institutional', jsonb_build_object(
      'name', v_row.business_name,
      'description', COALESCE(v_row.description, ''),
      'category', COALESCE(v_row.category, ''),
      'subcategory', v_row.subcategory,
      'logoUrl', v_row.metadata->>'logo_url',
      'bannerUrl', v_row.metadata->>'banner_url',
      'photos', v_photos,
      'addressText', COALESCE(v_row.metadata->>'business_address', NULL),
      'locationText', v_row.full_name,
      'phone', NULL,
      'whatsapp', NULL,
      'email', NULL,
      'website', v_row.website,
      'openStatus', jsonb_build_object('open', false, 'todayHours', NULL),
      'openingHours', COALESCE(v_row.opening_hours, '{}'::jsonb),
      'rating', COALESCE(v_row.rating, 0),
      'reviewCount', COALESCE(v_row.total_reviews, 0)
      ,
      'business', jsonb_build_object(
        'id', v_row.profile_id,
        'profile_id', v_row.profile_id,
        'name', v_row.business_name,
        'description', COALESCE(v_row.description, ''),
        'category', COALESCE(v_row.category, 'outros'),
        'subcategoria', v_row.subcategory,
        'phone', NULL,
        'whatsapp', NULL,
        'email', NULL,
        'website', v_row.website,
        'location_id', v_row.location_id,
        'address_id', NULL,
        'business_address', COALESCE(v_row.metadata->>'business_address', NULL),
        'business_city', NULL,
        'business_state', NULL,
        'business_zip', NULL,
        'address', jsonb_build_object(
          'street', v_row.address_street,
          'number', v_row.address_number,
          'complement', v_row.address_complement,
          'postal_code', v_row.address_postal_code,
          'latitude', v_row.address_latitude,
          'longitude', v_row.address_longitude
        ),
        'location', jsonb_build_object(
          'name', v_row.location_name,
          'full_name', v_row.full_name,
          'geographic_path', v_row.geographic_path,
          'canonical_lat', v_row.canonical_lat,
          'canonical_lng', v_row.canonical_lng
        ),
        'geographic_path', v_row.geographic_path,
        'horario_funcionamento', COALESCE(v_row.opening_hours, '{}'::jsonb),
        'tem_delivery', CASE
          WHEN lower(COALESCE(v_row.metadata->>'tem_delivery', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_cartao', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_cartao', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_pix', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_pix', 'false')) = 'true' THEN true
          ELSE false
        END,
        'logo_url', v_row.metadata->>'logo_url',
        'banner_url', v_row.metadata->>'banner_url',
        'fotos', v_photos,
        'status', COALESCE(v_row.status, 'active'),
        'rating', COALESCE(v_row.rating, 0),
        'total_reviews', COALESCE(v_row.total_reviews, 0),
        'favorites_count', 0,
        'recommendations_count', 0,
        'total_products', 0,
        'is_premium', COALESCE(v_row.is_premium, false),
        'is_verified', COALESCE(v_row.is_verified, false),
        'can_post_vagas', false,
        'slug', v_row.slug,
        'formas_pagamento', '[]'::jsonb,
        'especialidades', '[]'::jsonb,
        'facilidades', '[]'::jsonb,
        'modos_atendimento', CASE
          WHEN lower(COALESCE(v_row.metadata->>'tem_delivery', 'false')) = 'true' THEN jsonb_build_array('delivery')
          ELSE '[]'::jsonb
        END,
        'instagram', v_row.instagram,
        'facebook', v_row.facebook,
        'created_at', v_row.created_at,
        'updated_at', v_row.updated_at
      )
    ),
    'verticals', jsonb_build_object(
      'activeVerticals', CASE WHEN v_has_gastronomy THEN jsonb_build_array('gastronomy') ELSE '[]'::jsonb END,
      'primaryVertical', CASE WHEN v_has_gastronomy THEN 'gastronomy' ELSE NULL END,
      'canonicalVerticalUrl', CASE WHEN v_has_gastronomy THEN v_gastronomy_url ELSE NULL END,
      'verticalPublicUrls', CASE WHEN v_has_gastronomy THEN jsonb_build_object('gastronomy', v_gastronomy_url) ELSE '{}'::jsonb END
    ),
    'gastronomyPreview', v_preview,
    'seo', jsonb_build_object(
      'title', v_row.business_name || ' | Achegue-se',
      'description', COALESCE(v_row.description, 'Conheca ' || v_row.business_name || ' no Achegue-se.'),
      'canonical', v_business_url,
      'robots', CASE
        WHEN COALESCE(v_row.description, '') <> '' OR jsonb_array_length(v_photos) > 0 OR COALESCE(v_row.total_reviews, 0) > 0
          THEN 'index, follow'
        ELSE 'noindex, follow'
      END,
      'schemaType', CASE WHEN v_has_gastronomy THEN 'Restaurant' ELSE 'LocalBusiness' END,
      'hasLocalBusinessSchema', true,
      'hasRestaurantSchema', v_has_gastronomy
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_public_gastronomy_snapshot_by_slug(
  p_state TEXT,
  p_city TEXT,
  p_district TEXT,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_geo_path TEXT := '/br/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district));
  v_row RECORD;
  v_profile JSONB;
  v_menu JSONB := NULL;
  v_promotions JSONB := '[]'::jsonb;
  v_has_useful_menu BOOLEAN := false;
  v_business_url TEXT;
  v_gastronomy_url TEXT;
  v_photos JSONB := '[]'::jsonb;
BEGIN
  SELECT
    bd.id AS business_id,
    bd.profile_id,
    bd.slug,
    bd.business_name,
    bd.description,
    bd.category,
    bd.subcategory,
    NULL::TEXT AS email,
    bd.website,
    bd.instagram,
    bd.facebook,
    bd.opening_hours,
    bd.rating,
    bd.total_reviews,
    bd.metadata,
    bd.is_premium,
    bd.is_verified,
    bd.status,
    bd.created_at,
    bd.updated_at,
    l.id AS location_id,
    l.canonical_lat,
    l.canonical_lng,
    a.street AS address_street,
    a.number AS address_number,
    a.complement AS address_complement,
    a.postal_code AS address_postal_code,
    a.latitude AS address_latitude,
    a.longitude AS address_longitude,
    l.geographic_path,
    l.full_name,
    l.name AS location_name
  INTO v_row
  FROM business_data bd
  JOIN locations l ON l.id = bd.location_id
  LEFT JOIN addresses a ON a.id = bd.address_id
  WHERE bd.status = 'active'
    AND bd.business_role IN ('standalone', 'branch')
    AND bd.slug = p_slug
    AND l.geographic_path = v_geo_path
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(gp.*)
  INTO v_profile
  FROM gastronomy_profiles gp
  WHERE gp.business_id = v_row.business_id
    AND gp.status = 'active'
  LIMIT 1;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  v_business_url := '/empresas/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || v_row.slug;
  v_gastronomy_url := v_business_url;

  SELECT COALESCE(
    jsonb_agg(bg.image_url ORDER BY bg.is_featured DESC, bg.display_order ASC, bg.created_at DESC),
    '[]'::jsonb
  )
  INTO v_photos
  FROM business_gallery bg
  WHERE bg.business_id = v_row.business_id;

  WITH primary_menu AS (
    SELECT m.*
    FROM menus m
    WHERE m.business_id = v_row.business_id
      AND m.is_active = true
    ORDER BY m.display_order ASC, m.created_at ASC
    LIMIT 1
  ),
  menu_payload AS (
    SELECT jsonb_build_object(
      'id', pm.id,
      'business_id', pm.business_id,
      'name', pm.name,
      'description', pm.description,
      'is_active', pm.is_active,
      'display_order', pm.display_order,
      'available_days', pm.available_days,
      'available_start_time', pm.available_start_time,
      'available_end_time', pm.available_end_time,
      'created_at', pm.created_at,
      'updated_at', pm.updated_at,
      'categories', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', mc.id,
            'menu_id', mc.menu_id,
            'name', mc.name,
            'description', mc.description,
            'display_order', mc.display_order,
            'is_available', mc.is_available,
            'created_at', mc.created_at,
            'updated_at', mc.updated_at,
            'items', COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', mi.id,
                  'category_id', mi.category_id,
                  'name', mi.name,
                  'description', mi.description,
                  'base_price', mi.base_price,
                  'image_url', mi.image_url,
                  'preparation_time', mi.preparation_time,
                  'calories', mi.calories,
                  'is_vegetarian', mi.is_vegetarian,
                  'is_vegan', mi.is_vegan,
                  'is_gluten_free', mi.is_gluten_free,
                  'is_lactose_free', mi.is_lactose_free,
                  'is_spicy', mi.is_spicy,
                  'spicy_level', mi.spicy_level,
                  'ingredients', mi.ingredients,
                  'allergens', mi.allergens,
                  'is_available', mi.is_available,
                  'is_featured', mi.is_featured,
                  'display_order', mi.display_order,
                  'metadata', mi.metadata,
                  'created_at', mi.created_at,
                  'updated_at', mi.updated_at,
                  'variants', COALESCE((
                    SELECT jsonb_agg(to_jsonb(mv.*) ORDER BY mv.display_order ASC, mv.created_at ASC)
                    FROM menu_item_variants mv
                    WHERE mv.item_id = mi.id
                  ), '[]'::jsonb),
                  'addons', COALESCE((
                    SELECT jsonb_agg(to_jsonb(ma.*) ORDER BY ma.display_order ASC, ma.created_at ASC)
                    FROM menu_item_addons ma
                    WHERE ma.item_id = mi.id
                  ), '[]'::jsonb),
                  'availability', COALESCE((
                    SELECT jsonb_agg(to_jsonb(av.*) ORDER BY av.day_of_week ASC, av.start_time ASC)
                    FROM menu_item_availability av
                    WHERE av.item_id = mi.id
                  ), '[]'::jsonb)
                )
                ORDER BY mi.display_order ASC, mi.created_at ASC
              )
              FROM menu_items mi
              WHERE mi.category_id = mc.id
            ), '[]'::jsonb)
          )
          ORDER BY mc.display_order ASC, mc.created_at ASC
        )
        FROM menu_categories mc
        WHERE mc.menu_id = pm.id
      ), '[]'::jsonb)
    ) AS payload
    FROM primary_menu pm
  )
  SELECT payload INTO v_menu
  FROM menu_payload;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(mp.*) ORDER BY mp.created_at DESC),
    '[]'::jsonb
  )
  INTO v_promotions
  FROM menu_promotions mp
  WHERE mp.business_id = v_row.business_id
    AND mp.is_active = true
    AND mp.valid_from <= now()
    AND mp.valid_until >= now();

  SELECT EXISTS (
    SELECT 1
    FROM menu_items mi
    JOIN menu_categories mc ON mc.id = mi.category_id
    JOIN menus m ON m.id = mc.menu_id
    WHERE m.business_id = v_row.business_id
      AND m.is_active = true
      AND mc.is_available = true
      AND mi.is_available = true
  )
  INTO v_has_useful_menu;

  RETURN jsonb_build_object(
    'identity', jsonb_build_object(
      'profileId', v_row.profile_id,
      'businessId', v_row.business_id,
      'slug', v_row.slug,
      'displayName', v_row.business_name,
      'canonicalBusinessUrl', v_business_url
    ),
    'institutional', jsonb_build_object(
      'name', v_row.business_name,
      'description', COALESCE(v_row.description, ''),
      'category', COALESCE(v_row.category, ''),
      'subcategory', v_row.subcategory,
      'logoUrl', v_row.metadata->>'logo_url',
      'bannerUrl', v_row.metadata->>'banner_url',
      'photos', v_photos,
      'addressText', COALESCE(v_row.metadata->>'business_address', NULL),
      'locationText', v_row.full_name,
      'phone', NULL,
      'whatsapp', NULL,
      'email', NULL,
      'website', v_row.website,
      'openStatus', jsonb_build_object('open', false, 'todayHours', NULL),
      'openingHours', COALESCE(v_row.opening_hours, '{}'::jsonb),
      'rating', COALESCE(v_row.rating, 0),
      'reviewCount', COALESCE(v_row.total_reviews, 0)
      ,
      'business', jsonb_build_object(
        'id', v_row.profile_id,
        'profile_id', v_row.profile_id,
        'name', v_row.business_name,
        'description', COALESCE(v_row.description, ''),
        'category', COALESCE(v_row.category, 'outros'),
        'subcategoria', v_row.subcategory,
        'phone', NULL,
        'whatsapp', NULL,
        'email', NULL,
        'website', v_row.website,
        'location_id', v_row.location_id,
        'address_id', NULL,
        'business_address', COALESCE(v_row.metadata->>'business_address', NULL),
        'business_city', NULL,
        'business_state', NULL,
        'business_zip', NULL,
        'address', NULL,
        'location', jsonb_build_object(
          'name', v_row.location_name,
          'full_name', v_row.full_name,
          'geographic_path', v_row.geographic_path,
          'canonical_lat', NULL,
          'canonical_lng', NULL
        ),
        'geographic_path', v_row.geographic_path,
        'horario_funcionamento', COALESCE(v_row.opening_hours, '{}'::jsonb),
        'tem_delivery', CASE
          WHEN lower(COALESCE(v_row.metadata->>'tem_delivery', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_cartao', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_cartao', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_pix', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_pix', 'false')) = 'true' THEN true
          ELSE false
        END,
        'logo_url', v_row.metadata->>'logo_url',
        'banner_url', v_row.metadata->>'banner_url',
        'fotos', v_photos,
        'status', COALESCE(v_row.status, 'active'),
        'rating', COALESCE(v_row.rating, 0),
        'total_reviews', COALESCE(v_row.total_reviews, 0),
        'favorites_count', 0,
        'recommendations_count', 0,
        'total_products', 0,
        'is_premium', COALESCE(v_row.is_premium, false),
        'is_verified', COALESCE(v_row.is_verified, false),
        'can_post_vagas', false,
        'slug', v_row.slug,
        'formas_pagamento', '[]'::jsonb,
        'especialidades', '[]'::jsonb,
        'facilidades', '[]'::jsonb,
        'modos_atendimento', CASE
          WHEN COALESCE((v_profile->>'delivery_enabled')::boolean, false) THEN jsonb_build_array('delivery')
          ELSE '[]'::jsonb
        END,
        'instagram', v_row.instagram,
        'facebook', v_row.facebook,
        'created_at', v_row.created_at,
        'updated_at', v_row.updated_at
      )
    ),
    'verticals', jsonb_build_object(
      'activeVerticals', jsonb_build_array('gastronomy'),
      'primaryVertical', 'gastronomy',
      'canonicalVerticalUrl', v_gastronomy_url,
      'verticalPublicUrls', jsonb_build_object('gastronomy', v_gastronomy_url)
    ),
    'gastronomy', jsonb_build_object(
      'profile', v_profile,
      'business', jsonb_build_object(
        'id', v_row.profile_id,
        'profile_id', v_row.profile_id,
        'business_data_id', v_row.business_id,
        'slug', v_row.slug,
        'name', v_row.business_name,
        'description', COALESCE(v_row.description, ''),
        'rating', COALESCE(v_row.rating, 0),
        'total_reviews', COALESCE(v_row.total_reviews, 0),
        'is_verified', COALESCE(v_row.is_verified, false),
        'is_premium', COALESCE(v_row.is_premium, false),
        'banner_url', v_row.metadata->>'banner_url',
        'phone', NULL,
        'whatsapp', NULL,
        'email', NULL,
        'instagram', v_row.instagram,
        'facebook', v_row.facebook,
        'website', v_row.website,
        'fotos', v_photos,
        'geographic_path', v_row.geographic_path,
        'location', jsonb_build_object(
          'name', v_row.location_name,
          'full_name', v_row.full_name,
          'geographic_path', v_row.geographic_path
        ),
        'address', jsonb_build_object(
          'street', v_row.address_street,
          'number', v_row.address_number,
          'complement', v_row.address_complement,
          'postal_code', v_row.address_postal_code,
          'latitude', v_row.address_latitude,
          'longitude', v_row.address_longitude
        ),
        'gastronomy_profile', v_profile
      ),
      'menu', v_menu,
      'promotions', v_promotions,
      'hasUsefulMenuContent', v_has_useful_menu,
      'commerce', jsonb_build_object(
        'businessDataId', v_row.business_id,
        'deliveryEnabled', COALESCE((v_profile->>'delivery_enabled')::boolean, false),
        'takeoutEnabled', COALESCE((v_profile->>'takeout_enabled')::boolean, false),
        'dineInEnabled', COALESCE((v_profile->>'dine_in_enabled')::boolean, false),
        'minimumOrder', (v_profile->>'minimum_order')::numeric,
        'deliveryFee', (v_profile->>'delivery_fee')::numeric,
        'currency', 'BRL'
      )
    ),
    'seo', jsonb_build_object(
      'title', v_row.business_name || ' - Cardapio e pedidos | Achegue-se',
      'description', COALESCE(v_row.description, 'Cardapio e pedidos de ' || v_row.business_name || ' no Achegue-se.'),
      'canonical', v_gastronomy_url,
      'robots', CASE WHEN v_has_useful_menu THEN 'index, follow' ELSE 'noindex, follow' END,
      'schemaType', 'Restaurant',
      'hasLocalBusinessSchema', true,
      'hasRestaurantSchema', true,
      'canonicalGastronomyUrl', v_gastronomy_url,
      'canonicalBusinessUrl', v_business_url,
      'shouldNoIndex', NOT v_has_useful_menu
    )
  );
END;
$$;

-- security-authority: public-rpc public.get_public_business_snapshot_by_slug
-- security-authority: public-rpc public.get_public_gastronomy_snapshot_by_slug
REVOKE ALL ON FUNCTION get_public_business_snapshot_by_slug(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION get_public_gastronomy_snapshot_by_slug(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_business_snapshot_by_slug(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_gastronomy_snapshot_by_slug(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
ALTER TABLE public.business_data DROP COLUMN email;
ALTER TABLE public.professional_data DROP COLUMN email;
ALTER TABLE public.professional_data DROP COLUMN whatsapp;
ALTER TABLE public.professional_data DROP COLUMN license_number;
ALTER TABLE public.professional_data DROP COLUMN license_state;

DROP VIEW IF EXISTS public.public_professional_search CASCADE;
CREATE VIEW public.public_professional_search
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
  COALESCE((professional.metadata->>'latitude')::NUMERIC, address.latitude) AS latitude,
  COALESCE((professional.metadata->>'longitude')::NUMERIC, address.longitude) AS longitude,
  location.geographic_path
FROM public.professional_data professional
LEFT JOIN public.addresses address ON professional.address_id = address.id
LEFT JOIN public.locations location ON professional.location_id = location.id
WHERE professional.is_accepting_clients = true
  AND professional.visibility = 'public_listed';

REVOKE SELECT ON TABLE public.professional_data FROM anon, authenticated;
GRANT SELECT (
  id,
  profile_id,
  slug,
  professional_name,
  service_category,
  service_subcategory,
  description,
  certifications,
  experience_years,
  education,
  price_range,
  service_areas,
  service_radius_km,
  available_hours,
  is_accepting_clients,
  is_verified,
  verified_at,
  rating,
  address_id,
  location_id,
  metadata,
  created_at,
  updated_at,
  visibility,
  availability_notes,
  portfolio_items,
  accepts_remote,
  hourly_rate,
  price_type,
  profession,
  service_area,
  services_offered,
  specialties,
  years_experience
) ON TABLE public.professional_data TO anon, authenticated;

GRANT SELECT ON TABLE public.public_professional_search TO anon, authenticated;

COMMENT ON FUNCTION public.contact_rpc_get_visible_channels(UUID, UUID[], UUID[]) IS
  'Authenticated, actor-scoped contact projection for Business and Professional.';
COMMENT ON FUNCTION public.contact_rpc_patch_owned_channels(UUID, TEXT, UUID, JSONB) IS
  'Owner/admin contact patch command. Values stay in private.entity_contact_channels.';

NOTIFY pgrst, 'reload schema';
