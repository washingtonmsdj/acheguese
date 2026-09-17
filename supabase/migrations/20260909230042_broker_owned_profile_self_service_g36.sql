-- G36A: broker-owned self-service mutations for public.profiles.
-- This is an additive compatibility stage. Browser table grants are revoked only
-- after the new web release is proven live.

CREATE OR REPLACE FUNCTION private.profile_username_is_reserved(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT lower(COALESCE(p_username, '')) = ANY (
    ARRAY[
      'admin',
      'root',
      'system',
      'moderator',
      'mod',
      'administrator',
      'oficial',
      'official',
      'verified',
      'staff',
      'team',
      'suporte-oficial',
      'login',
      'logout',
      'cadastro',
      'signup',
      'signin',
      'signout',
      'register',
      'auth',
      'authentication',
      'password',
      'senha',
      'recuperar',
      'recover',
      'reset',
      'confirm',
      'confirmar',
      'sobre',
      'about',
      'contato',
      'contact',
      'fale-conosco',
      'termos',
      'terms',
      'privacidade',
      'privacy',
      'politica',
      'ajuda',
      'help',
      'suporte',
      'support',
      'faq',
      'carreiras',
      'careers',
      'trabalhe-conosco',
      'jobs',
      'api',
      'docs',
      'documentation',
      'swagger',
      'health',
      'status',
      'metrics',
      'monitoring',
      'webhook',
      'webhooks',
      'callback',
      'oauth',
      'static',
      'assets',
      'public',
      'files',
      'uploads',
      'p',
      'u',
      'dashboard',
      'painel',
      'admin-panel',
      'home',
      'inicio',
      'index',
      'main',
      'ba',
      'salvador',
      'sp',
      'sao-paulo',
      'rj',
      'rio-de-janeiro',
      'mg',
      'belo-horizonte',
      'rs',
      'porto-alegre',
      'pr',
      'curitiba',
      'pe',
      'recife',
      'ce',
      'fortaleza',
      'pa',
      'belem',
      'go',
      'goiania',
      'df',
      'brasilia',
      'am',
      'manaus',
      'null',
      'undefined',
      'none',
      'nil',
      'void',
      'test',
      'teste',
      'demo',
      'example',
      'sample',
      'fake',
      'falso',
      'spam',
      'bot',
      'robot',
      'porra',
      'merda',
      'caralho',
      'puta',
      'fdp',
      'fuck',
      'shit',
      'damn',
      'bitch',
      'ass',
      'perfil',
      'profile',
      'user',
      'usuario',
      'users',
      'usuarios',
      'conta',
      'account',
      'accounts',
      'contas',
      'meu-perfil',
      'my-profile',
      'minha-conta',
      'my-account',
      'configuracoes',
      'settings',
      'config',
      'preferences',
      'familia',
      'family',
      'familias',
      'families',
      'identidades',
      'identities',
      'identidade',
      'identity',
      'membro',
      'member',
      'membros',
      'members',
      'editar',
      'edit',
      'atualizar',
      'update',
      'deletar',
      'delete',
      'remover',
      'remove',
      'criar',
      'create',
      'novo',
      'new'
    ]::text[]
  );
$$;

REVOKE ALL ON FUNCTION private.profile_username_is_reserved(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_username_is_reserved(text)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_patch_owned(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_patch jsonb,
  p_new_username text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_unknown_key text;
  v_username text;
  v_last_username_change timestamptz;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid profile patch');
  END IF;

  SELECT profile.*
  INTO v_profile
  FROM public.profiles AS profile
  WHERE profile.id = p_profile_id;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF NOT (
    v_profile.user_id = p_actor_user_id
    OR EXISTS (
      SELECT 1
      FROM public.profile_members AS member
      WHERE member.profile_id = p_profile_id
        AND member.user_id = p_actor_user_id
        AND member.role IN ('owner', 'admin')
        AND COALESCE(member.is_active, true)
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  SELECT key
  INTO v_unknown_key
  FROM jsonb_object_keys(p_patch) AS key
  WHERE key NOT IN (
    'name',
    'display_name',
    'bio',
    'short_bio',
    'avatar_url',
    'city',
    'neighborhood',
    'street',
    'state',
    'location_id',
    'main_territory_location_id',
    'public_location_visibility',
    'is_active',
    'contact_email',
    'phone',
    'website',
    'location',
    'is_public',
    'show_contact_email',
    'show_phone',
    'show_linked_profiles',
    'show_business_links',
    'show_professional_links',
    'share_activity_default'
  )
  LIMIT 1;

  IF v_unknown_key IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported profile field: ' || v_unknown_key
    );
  END IF;

  IF p_patch ? 'name'
     AND (
       jsonb_typeof(p_patch->'name') <> 'string'
       OR length(btrim(p_patch->>'name')) NOT BETWEEN 1 AND 160
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid name');
  END IF;

  IF p_patch ? 'display_name'
     AND p_patch->'display_name' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'display_name') <> 'string'
       OR length(p_patch->>'display_name') > 160
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid display_name');
  END IF;

  IF p_patch ? 'bio'
     AND p_patch->'bio' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'bio') <> 'string'
       OR length(p_patch->>'bio') > 4000
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid bio');
  END IF;

  IF p_patch ? 'short_bio'
     AND p_patch->'short_bio' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'short_bio') <> 'string'
       OR length(p_patch->>'short_bio') > 280
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid short_bio');
  END IF;

  IF p_patch ? 'avatar_url'
     AND p_patch->'avatar_url' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'avatar_url') <> 'string'
       OR length(p_patch->>'avatar_url') > 2048
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid avatar_url');
  END IF;

  IF p_patch ? 'contact_email'
     AND p_patch->'contact_email' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'contact_email') <> 'string'
       OR length(p_patch->>'contact_email') > 254
       OR (
         length(btrim(p_patch->>'contact_email')) > 0
         AND btrim(p_patch->>'contact_email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       )
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid contact_email');
  END IF;

  IF p_patch ? 'public_location_visibility'
     AND (
       jsonb_typeof(p_patch->'public_location_visibility') <> 'string'
       OR p_patch->>'public_location_visibility' NOT IN ('hidden', 'city_only', 'district')
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid public_location_visibility');
  END IF;

  IF p_patch ? 'location_id'
     AND p_patch->'location_id' <> 'null'::jsonb
     AND (p_patch->>'location_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid location_id');
  END IF;

  IF p_patch ? 'main_territory_location_id'
     AND p_patch->'main_territory_location_id' <> 'null'::jsonb
     AND (p_patch->>'main_territory_location_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid main_territory_location_id');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_each(p_patch) AS item(key, value)
    WHERE item.key IN (
      'is_active',
      'is_public',
      'show_contact_email',
      'show_phone',
      'show_linked_profiles',
      'show_business_links',
      'show_professional_links',
      'share_activity_default'
    )
      AND item.value <> 'null'::jsonb
      AND jsonb_typeof(item.value) <> 'boolean'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid boolean profile field');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_each(p_patch) AS item(key, value)
    WHERE item.key IN ('city', 'neighborhood', 'state', 'location')
      AND item.value <> 'null'::jsonb
      AND (
        jsonb_typeof(item.value) <> 'string'
        OR length(item.value #>> '{}') > 160
      )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid locality field');
  END IF;

  IF p_patch ? 'street'
     AND p_patch->'street' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'street') <> 'string'
       OR length(p_patch->>'street') > 300
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid street');
  END IF;

  IF p_patch ? 'phone'
     AND p_patch->'phone' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'phone') <> 'string'
       OR length(p_patch->>'phone') > 64
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid phone');
  END IF;

  IF p_patch ? 'website'
     AND p_patch->'website' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'website') <> 'string'
       OR length(p_patch->>'website') > 2048
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid website');
  END IF;

  IF p_new_username IS NOT NULL THEN
    IF v_profile.profile_type <> 'personal' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Username changes are personal-profile only'
      );
    END IF;

    v_username := lower(btrim(p_new_username));
    v_username := regexp_replace(v_username, '[[:space:]-]+', '_', 'g');
    v_username := regexp_replace(v_username, '_+', '_', 'g');
    v_username := regexp_replace(v_username, '^_+|_+$', '', 'g');

    IF v_username !~ '^[a-z][a-z0-9_]{2,29}$' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid username format');
    END IF;

    IF private.profile_username_is_reserved(v_username) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Reserved username');
    END IF;

    IF v_username IS DISTINCT FROM v_profile.username THEN
      SELECT max(history.changed_at)
      INTO v_last_username_change
      FROM public.profile_username_history AS history
      WHERE history.profile_id = p_profile_id;

      IF v_last_username_change IS NOT NULL
         AND v_last_username_change > now() - interval '30 days' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username cooldown active');
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public.profiles AS other
        WHERE other.username = v_username
          AND other.id <> p_profile_id
      ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username already in use');
      END IF;
    END IF;
  END IF;

  PERFORM set_config('app.profile_actor_user_id', p_actor_user_id::text, true);

  UPDATE public.profiles AS profile
  SET
    name = CASE WHEN p_patch ? 'name' THEN btrim(p_patch->>'name') ELSE profile.name END,
    display_name = CASE WHEN p_patch ? 'display_name' THEN NULLIF(btrim(p_patch->>'display_name'), '') ELSE profile.display_name END,
    bio = CASE WHEN p_patch ? 'bio' THEN NULLIF(p_patch->>'bio', '') ELSE profile.bio END,
    short_bio = CASE WHEN p_patch ? 'short_bio' THEN NULLIF(p_patch->>'short_bio', '') ELSE profile.short_bio END,
    avatar_url = CASE WHEN p_patch ? 'avatar_url' THEN NULLIF(p_patch->>'avatar_url', '') ELSE profile.avatar_url END,
    city = CASE WHEN p_patch ? 'city' THEN NULLIF(btrim(p_patch->>'city'), '') ELSE profile.city END,
    neighborhood = CASE WHEN p_patch ? 'neighborhood' THEN NULLIF(btrim(p_patch->>'neighborhood'), '') ELSE profile.neighborhood END,
    street = CASE WHEN p_patch ? 'street' THEN NULLIF(btrim(p_patch->>'street'), '') ELSE profile.street END,
    state = CASE WHEN p_patch ? 'state' THEN NULLIF(btrim(p_patch->>'state'), '') ELSE profile.state END,
    location_id = CASE WHEN p_patch ? 'location_id' THEN NULLIF(p_patch->>'location_id', '')::uuid ELSE profile.location_id END,
    main_territory_location_id = CASE WHEN p_patch ? 'main_territory_location_id' THEN NULLIF(p_patch->>'main_territory_location_id', '')::uuid ELSE profile.main_territory_location_id END,
    public_location_visibility = CASE WHEN p_patch ? 'public_location_visibility' THEN p_patch->>'public_location_visibility' ELSE profile.public_location_visibility END,
    is_active = CASE WHEN p_patch ? 'is_active' THEN (p_patch->>'is_active')::boolean ELSE profile.is_active END,
    contact_email = CASE WHEN p_patch ? 'contact_email' THEN NULLIF(btrim(p_patch->>'contact_email'), '') ELSE profile.contact_email END,
    phone = CASE WHEN p_patch ? 'phone' THEN NULLIF(btrim(p_patch->>'phone'), '') ELSE profile.phone END,
    website = CASE WHEN p_patch ? 'website' THEN NULLIF(btrim(p_patch->>'website'), '') ELSE profile.website END,
    location = CASE WHEN p_patch ? 'location' THEN NULLIF(btrim(p_patch->>'location'), '') ELSE profile.location END,
    is_public = CASE WHEN p_patch ? 'is_public' THEN (p_patch->>'is_public')::boolean ELSE profile.is_public END,
    show_contact_email = CASE WHEN p_patch ? 'show_contact_email' THEN (p_patch->>'show_contact_email')::boolean ELSE profile.show_contact_email END,
    show_phone = CASE WHEN p_patch ? 'show_phone' THEN (p_patch->>'show_phone')::boolean ELSE profile.show_phone END,
    show_linked_profiles = CASE WHEN p_patch ? 'show_linked_profiles' THEN (p_patch->>'show_linked_profiles')::boolean ELSE profile.show_linked_profiles END,
    show_business_links = CASE WHEN p_patch ? 'show_business_links' THEN (p_patch->>'show_business_links')::boolean ELSE profile.show_business_links END,
    show_professional_links = CASE WHEN p_patch ? 'show_professional_links' THEN (p_patch->>'show_professional_links')::boolean ELSE profile.show_professional_links END,
    share_activity_default = CASE WHEN p_patch ? 'share_activity_default' THEN (p_patch->>'share_activity_default')::boolean ELSE profile.share_activity_default END,
    username = CASE
      WHEN p_new_username IS NOT NULL AND v_username IS DISTINCT FROM profile.username
        THEN v_username
      ELSE profile.username
    END,
    updated_at = now()
  WHERE profile.id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', p_profile_id,
      'username', COALESCE(v_username, v_profile.username)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.profile_patch_owned(uuid, uuid, jsonb, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_patch_owned(uuid, uuid, jsonb, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_update_owned_profile(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_patch jsonb,
  p_new_username text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_patch_owned(
    p_actor_user_id,
    p_profile_id,
    p_patch,
    p_new_username
  );
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_update_owned_profile(uuid, uuid, jsonb, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_update_owned_profile(uuid, uuid, jsonb, text)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_clear_expired_suspension(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row_count bigint := 0;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = p_profile_id
      AND (
        profile.user_id = p_actor_user_id
        OR EXISTS (
          SELECT 1
          FROM public.profile_members AS member
          WHERE member.profile_id = profile.id
            AND member.user_id = p_actor_user_id
            AND member.role IN ('owner', 'admin')
            AND COALESCE(member.is_active, true)
        )
      )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  UPDATE public.profiles AS profile
  SET is_suspended = false,
      suspended = false,
      suspended_until = NULL,
      suspension_reason = NULL,
      updated_at = now()
  WHERE profile.id = p_profile_id
    AND (profile.is_suspended OR profile.suspended)
    AND profile.suspended_until IS NOT NULL
    AND profile.suspended_until <= now();

  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', p_profile_id,
      'cleared', v_row_count > 0
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.profile_clear_expired_suspension(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_clear_expired_suspension(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_clear_expired_suspension(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_clear_expired_suspension(
    p_actor_user_id,
    p_profile_id
  );
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_clear_expired_suspension(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_clear_expired_suspension(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.fn_record_profile_username_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid;
BEGIN
  BEGIN
    v_actor := NULLIF(current_setting('app.profile_actor_user_id', true), '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_actor := NULL;
  END;

  INSERT INTO public.profile_username_history (
    profile_id,
    old_username,
    new_username,
    change_reason
  ) VALUES (
    NEW.id,
    COALESCE(OLD.username, ''),
    COALESCE(NEW.username, ''),
    CASE
      WHEN COALESCE(v_actor, auth.uid()) = NEW.user_id
        OR EXISTS (
          SELECT 1
          FROM public.profile_members AS member
          WHERE member.profile_id = NEW.id
            AND member.user_id = COALESCE(v_actor, auth.uid())
            AND member.role IN ('owner', 'admin')
            AND COALESCE(member.is_active, true)
        )
        THEN 'user_requested'
      ELSE 'admin_action'
    END
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_profile_username_history()
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.profile_rpc_update_owned_profile(uuid, uuid, jsonb, text)
  IS 'Service-role target for allowlisted owner/manager profile edits through profile-rpc.';
COMMENT ON FUNCTION public.profile_rpc_clear_expired_suspension(uuid, uuid)
  IS 'Service-role target that clears only already-expired suspension state for an accessible profile.';

-- Compatibility window:
-- authenticated INSERT/UPDATE/DELETE grants on public.profiles remain until the
-- replacement web release is proven live. G36 cutover removes them later.
