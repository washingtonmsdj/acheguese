-- G6 Contact: remove PL/pgSQL output-column ambiguity from contact upserts.
--
-- The function RETURNS TABLE(... channel_type ...), so the old partial-index
-- conflict target ON CONFLICT (..., channel_type) can resolve ambiguously in
-- PL/pgSQL. Keep the same private tables/API and use a two-step idempotent
-- upsert: insert-if-absent, then update the canonical row.

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
          AND member.is_active = true AND member.role IN ('owner', 'admin')
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
          AND member.is_active = true AND member.role IN ('owner', 'admin')
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
        ON CONFLICT DO NOTHING;

        UPDATE private.entity_contact_channels AS channels
        SET
          channel_value = v_channel_value,
          visibility = v_visibility,
          updated_at = now()
        WHERE channels.business_id = p_entity_id
          AND channels.channel_type = v_channel_type;
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
        ON CONFLICT DO NOTHING;

        UPDATE private.entity_contact_channels AS channels
        SET
          channel_value = v_channel_value,
          visibility = v_visibility,
          updated_at = now()
        WHERE channels.professional_id = p_entity_id
          AND channels.channel_type = v_channel_type;
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

REVOKE ALL ON FUNCTION public.contact_rpc_patch_owned_channels(UUID, TEXT, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.contact_rpc_patch_owned_channels(UUID, TEXT, UUID, JSONB)
  TO service_role;

DO $verify$
BEGIN
  IF pg_get_functiondef(
    'public.contact_rpc_patch_owned_channels(uuid,text,uuid,jsonb)'::regprocedure
  ) LIKE '%ON CONFLICT (business_id, channel_type)%'
     OR pg_get_functiondef(
       'public.contact_rpc_patch_owned_channels(uuid,text,uuid,jsonb)'::regprocedure
     ) LIKE '%ON CONFLICT (professional_id, channel_type)%' THEN
    RAISE EXCEPTION 'contact_rpc_ambiguous_conflict_target_remains';
  END IF;

  IF has_function_privilege(
       'anon',
       'public.contact_rpc_patch_owned_channels(uuid,text,uuid,jsonb)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'authenticated',
       'public.contact_rpc_patch_owned_channels(uuid,text,uuid,jsonb)',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       'service_role',
       'public.contact_rpc_patch_owned_channels(uuid,text,uuid,jsonb)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'contact_rpc_execute_acl_drift';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
