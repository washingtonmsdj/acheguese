-- G35: make profile-rpc the mutation authority for professional_data.
-- Additive compatibility stage: browser DML grants are intentionally preserved
-- until the new web release is proven live. A later cutover migration revokes them.

CREATE OR REPLACE FUNCTION private.professional_slug_is_reserved(p_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT lower(COALESCE(p_slug, '')) = ANY (
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
      'profissional',
      'professional',
      'prestador',
      'provider',
      'profissionais',
      'professionals',
      'prestadores',
      'providers',
      'autonomo',
      'freelancer',
      'freelance',
      'servicos',
      'services',
      'servico',
      'service',
      'atendimento',
      'attendance',
      'consulta',
      'consultation',
      'orcamento',
      'budget',
      'quote',
      'estimate',
      'portfolio',
      'trabalhos',
      'projetos',
      'projects',
      'galeria',
      'gallery',
      'fotos',
      'photos',
      'eletricista',
      'encanador',
      'pedreiro',
      'pintor',
      'mecanico',
      'jardineiro',
      'diarista',
      'cozinheiro',
      'professor',
      'tutor',
      'instrutor',
      'coach'
    ]::text[]
  );
$$;

REVOKE ALL ON FUNCTION private.professional_slug_is_reserved(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.professional_slug_is_reserved(text)
  TO service_role;

CREATE OR REPLACE FUNCTION private.enforce_professional_slug_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_slug text;
  v_last_change timestamptz;
BEGIN
  IF NEW.slug IS NULL THEN
    RETURN NEW;
  END IF;

  v_slug := lower(btrim(NEW.slug));

  IF length(v_slug) < 2
     OR length(v_slug) > 100
     OR v_slug !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' THEN
    RAISE EXCEPTION 'invalid_professional_slug'
      USING ERRCODE = '22023';
  END IF;

  IF private.professional_slug_is_reserved(v_slug) THEN
    RAISE EXCEPTION 'reserved_professional_slug'
      USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'UPDATE' AND v_slug IS DISTINCT FROM OLD.slug THEN
    SELECT max(history.created_at)
    INTO v_last_change
    FROM public.professional_slug_history AS history
    WHERE history.professional_id = OLD.id;

    IF v_last_change IS NOT NULL
       AND v_last_change > now() - interval '30 days' THEN
      RAISE EXCEPTION 'professional_slug_cooldown_active'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  NEW.slug := v_slug;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_professional_slug_policy()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS aa_enforce_professional_slug_policy
  ON public.professional_data;
CREATE TRIGGER aa_enforce_professional_slug_policy
BEFORE INSERT OR UPDATE OF slug
ON public.professional_data
FOR EACH ROW
EXECUTE FUNCTION private.enforce_professional_slug_policy();

CREATE OR REPLACE FUNCTION private.ensure_professional_stats_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.professional_stats (
    profile_id,
    views_count,
    contacts_count,
    favorites_count,
    shares_count,
    jobs_completed,
    response_rate,
    average_response_time
  ) VALUES (
    NEW.profile_id,
    0, 0, 0, 0, 0, 0, 0
  )
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.ensure_professional_stats_on_insert()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS professional_data_ensure_stats
  ON public.professional_data;
CREATE TRIGGER professional_data_ensure_stats
AFTER INSERT
ON public.professional_data
FOR EACH ROW
EXECUTE FUNCTION private.ensure_professional_stats_on_insert();

INSERT INTO public.professional_stats (
  profile_id,
  views_count,
  contacts_count,
  favorites_count,
  shares_count,
  jobs_completed,
  response_rate,
  average_response_time
)
SELECT
  professional.profile_id,
  0, 0, 0, 0, 0, 0, 0
FROM public.professional_data AS professional
LEFT JOIN public.professional_stats AS stats
  ON stats.profile_id = professional.profile_id
WHERE stats.profile_id IS NULL
ON CONFLICT (profile_id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.profile_patch_professional_data(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_professional_id uuid;
  v_unknown_key text;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid professional patch');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = p_profile_id
      AND profile.profile_type = 'professional'
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

  SELECT key
  INTO v_unknown_key
  FROM jsonb_object_keys(p_patch) AS key
  WHERE key NOT IN (
    'slug',
    'professional_name',
    'service_category',
    'service_subcategory',
    'description',
    'certifications',
    'experience_years',
    'education',
    'price_range',
    'available_hours',
    'is_accepting_clients',
    'address_id',
    'location_id',
    'metadata',
    'visibility',
    'availability_notes',
    'portfolio_items',
    'profession',
    'specialties',
    'years_experience',
    'services_offered',
    'service_area',
    'hourly_rate',
    'accepts_remote'
  )
  LIMIT 1;

  IF v_unknown_key IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported professional field: ' || v_unknown_key
    );
  END IF;

  IF p_patch ? 'professional_name'
     AND NULLIF(btrim(p_patch->>'professional_name'), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'professional_name is required');
  END IF;

  IF p_patch ? 'service_category'
     AND NULLIF(btrim(p_patch->>'service_category'), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'service_category is required');
  END IF;

  IF p_patch ? 'location_id'
     AND NULLIF(btrim(p_patch->>'location_id'), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'location_id cannot be cleared');
  END IF;

  SELECT professional.id
  INTO v_professional_id
  FROM public.professional_data AS professional
  WHERE professional.profile_id = p_profile_id;

  IF v_professional_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Professional data not found');
  END IF;

  UPDATE public.profiles AS profile
  SET
    name = CASE
      WHEN p_patch ? 'professional_name' THEN NULLIF(btrim(p_patch->>'professional_name'), '')
      ELSE profile.name
    END,
    display_name = CASE
      WHEN p_patch ? 'professional_name' THEN NULLIF(btrim(p_patch->>'professional_name'), '')
      ELSE profile.display_name
    END,
    bio = CASE
      WHEN p_patch ? 'description' THEN NULLIF(p_patch->>'description', '')
      ELSE profile.bio
    END,
    updated_at = now()
  WHERE profile.id = p_profile_id;

  UPDATE public.professional_data AS professional
  SET
    slug = CASE WHEN p_patch ? 'slug' THEN NULLIF(p_patch->>'slug', '') ELSE professional.slug END,
    professional_name = CASE WHEN p_patch ? 'professional_name' THEN NULLIF(btrim(p_patch->>'professional_name'), '') ELSE professional.professional_name END,
    service_category = CASE WHEN p_patch ? 'service_category' THEN NULLIF(btrim(p_patch->>'service_category'), '') ELSE professional.service_category END,
    service_subcategory = CASE WHEN p_patch ? 'service_subcategory' THEN NULLIF(btrim(p_patch->>'service_subcategory'), '') ELSE professional.service_subcategory END,
    description = CASE WHEN p_patch ? 'description' THEN NULLIF(p_patch->>'description', '') ELSE professional.description END,
    certifications = CASE WHEN p_patch ? 'certifications' THEN COALESCE(p_patch->'certifications', '[]'::jsonb) ELSE professional.certifications END,
    experience_years = CASE WHEN p_patch ? 'experience_years' THEN NULLIF(p_patch->>'experience_years', '')::integer ELSE professional.experience_years END,
    education = CASE WHEN p_patch ? 'education' THEN NULLIF(p_patch->>'education', '') ELSE professional.education END,
    price_range = CASE WHEN p_patch ? 'price_range' THEN NULLIF(p_patch->>'price_range', '') ELSE professional.price_range END,
    available_hours = CASE WHEN p_patch ? 'available_hours' THEN COALESCE(p_patch->'available_hours', '{}'::jsonb) ELSE professional.available_hours END,
    is_accepting_clients = CASE WHEN p_patch ? 'is_accepting_clients' THEN (p_patch->>'is_accepting_clients')::boolean ELSE professional.is_accepting_clients END,
    address_id = CASE WHEN p_patch ? 'address_id' THEN NULLIF(p_patch->>'address_id', '')::uuid ELSE professional.address_id END,
    location_id = CASE WHEN p_patch ? 'location_id' THEN NULLIF(p_patch->>'location_id', '')::uuid ELSE professional.location_id END,
    metadata = CASE
      WHEN p_patch ? 'metadata'
        THEN COALESCE(p_patch->'metadata', '{}'::jsonb) - ARRAY['phone', 'whatsapp', 'email']
      ELSE professional.metadata
    END,
    visibility = CASE WHEN p_patch ? 'visibility' THEN (p_patch->>'visibility')::public.professional_profile_visibility ELSE professional.visibility END,
    availability_notes = CASE WHEN p_patch ? 'availability_notes' THEN NULLIF(p_patch->>'availability_notes', '') ELSE professional.availability_notes END,
    portfolio_items = CASE WHEN p_patch ? 'portfolio_items' THEN COALESCE(p_patch->'portfolio_items', '[]'::jsonb) ELSE professional.portfolio_items END,
    profession = CASE WHEN p_patch ? 'profession' THEN NULLIF(btrim(p_patch->>'profession'), '') ELSE professional.profession END,
    specialties = CASE
      WHEN p_patch ? 'specialties'
        THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_patch->'specialties', '[]'::jsonb)))
      ELSE professional.specialties
    END,
    years_experience = CASE WHEN p_patch ? 'years_experience' THEN NULLIF(p_patch->>'years_experience', '')::integer ELSE professional.years_experience END,
    services_offered = CASE
      WHEN p_patch ? 'services_offered'
        THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_patch->'services_offered', '[]'::jsonb)))
      ELSE professional.services_offered
    END,
    service_area = CASE
      WHEN p_patch ? 'service_area'
        THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_patch->'service_area', '[]'::jsonb)))
      ELSE professional.service_area
    END,
    hourly_rate = CASE WHEN p_patch ? 'hourly_rate' THEN NULLIF(p_patch->>'hourly_rate', '')::numeric ELSE professional.hourly_rate END,
    accepts_remote = CASE WHEN p_patch ? 'accepts_remote' THEN (p_patch->>'accepts_remote')::boolean ELSE professional.accepts_remote END,
    updated_by_user_id = p_actor_user_id,
    updated_at = now()
  WHERE professional.id = v_professional_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', p_profile_id,
      'professional_id', v_professional_id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.profile_patch_professional_data(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_patch_professional_data(uuid, uuid, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_update_professional_data(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_patch_professional_data(
    p_actor_user_id,
    p_profile_id,
    p_patch
  );
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_update_professional_data(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_update_professional_data(uuid, uuid, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_create_professional(
  p_actor_user_id uuid,
  p_handle text,
  p_display_name text,
  p_avatar_url text,
  p_bio text,
  p_extension_data jsonb,
  p_professional_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_create jsonb;
  v_patch jsonb;
  v_profile_id uuid;
BEGIN
  v_create := private.profile_create_profile_with_extension(
    p_actor_user_id,
    'professional',
    p_handle,
    p_display_name,
    p_avatar_url,
    p_bio,
    p_extension_data
  );

  IF NOT COALESCE((v_create->>'success')::boolean, false) THEN
    RETURN v_create;
  END IF;

  v_profile_id := (v_create->'data'->>'profile_id')::uuid;
  v_patch := private.profile_patch_professional_data(
    p_actor_user_id,
    v_profile_id,
    COALESCE(p_professional_patch, '{}'::jsonb)
  );

  IF NOT COALESCE((v_patch->>'success')::boolean, false) THEN
    RAISE EXCEPTION 'professional_create_patch_failed'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN v_create;
END;
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_create_professional(
  uuid, text, text, text, text, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_create_professional(
  uuid, text, text, text, text, jsonb, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION private.profile_deactivate_professional(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = p_profile_id
      AND profile.profile_type = 'professional'
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

  UPDATE public.professional_data
  SET is_accepting_clients = false,
      updated_by_user_id = p_actor_user_id,
      updated_at = now()
  WHERE profile_id = p_profile_id;

  UPDATE public.profiles
  SET is_active = false,
      updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$$;

REVOKE ALL ON FUNCTION private.profile_deactivate_professional(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_deactivate_professional(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_deactivate_professional(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_deactivate_professional(p_actor_user_id, p_profile_id);
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_deactivate_professional(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_deactivate_professional(uuid, uuid)
  TO service_role;

COMMENT ON FUNCTION public.profile_rpc_create_professional(uuid, text, text, text, text, jsonb, jsonb)
  IS 'Service-role target for atomic professional profile creation through profile-rpc.';
COMMENT ON FUNCTION public.profile_rpc_update_professional_data(uuid, uuid, jsonb)
  IS 'Service-role target for allowlisted professional_data updates through profile-rpc.';
COMMENT ON FUNCTION public.profile_rpc_deactivate_professional(uuid, uuid)
  IS 'Service-role target for atomic professional/profile deactivation through profile-rpc.';

-- Compatibility window:
-- authenticated DML grants on professional_data/professional_stats are not
-- revoked here because the currently published web build predates this broker
-- cutover. The cutover migration must revoke them only after the new web SHA
-- is proven live.
