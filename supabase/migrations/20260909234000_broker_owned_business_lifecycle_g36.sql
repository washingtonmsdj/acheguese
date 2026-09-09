-- G36B: broker-owned Business lifecycle through the existing profile-rpc.
-- Address remains a separate owned aggregate. This migration atomically owns
-- Profile + membership + business_data + business_stats + hours + contacts.

CREATE UNIQUE INDEX IF NOT EXISTS business_data_profile_id_uidx
  ON public.business_data(profile_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.business_data'::regclass
      AND conname = 'business_data_profile_id_key'
  ) THEN
    ALTER TABLE public.business_data
      ADD CONSTRAINT business_data_profile_id_key
      UNIQUE USING INDEX business_data_profile_id_uidx;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.business_data_ensure_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.business_stats (
    profile_id,
    business_id,
    views_count,
    favorites_count,
    shares_count
  ) VALUES (
    NEW.profile_id,
    NEW.id,
    0,
    0,
    0
  )
  ON CONFLICT (profile_id) DO UPDATE
  SET business_id = COALESCE(public.business_stats.business_id, EXCLUDED.business_id);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.business_data_ensure_stats()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.business_data_ensure_stats()
  TO service_role;

DROP TRIGGER IF EXISTS business_data_ensure_stats ON public.business_data;
CREATE TRIGGER business_data_ensure_stats
AFTER INSERT ON public.business_data
FOR EACH ROW
EXECUTE FUNCTION private.business_data_ensure_stats();

INSERT INTO public.business_stats (
  profile_id,
  business_id,
  views_count,
  favorites_count,
  shares_count
)
SELECT
  business.profile_id,
  business.id,
  0,
  0,
  0
FROM public.business_data AS business
ON CONFLICT (profile_id) DO UPDATE
SET business_id = COALESCE(public.business_stats.business_id, EXCLUDED.business_id);

CREATE OR REPLACE FUNCTION private.business_slug_is_reserved(p_slug text)
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
      'empresas',
      'business',
      'empresa',
      'company',
      'companies',
      'loja',
      'store',
      'shop',
      'lojas',
      'stores',
      'comercio',
      'commerce',
      'marketplace',
      'mercado',
      'servico',
      'service',
      'servicos',
      'services',
      'produto',
      'product',
      'produtos',
      'products',
      'catalogo',
      'catalog',
      'catalogue',
      'oferta',
      'ofertas',
      'offer',
      'offers',
      'promocao',
      'promocoes',
      'promo',
      'sale',
      'sales',
      'restaurante',
      'restaurant',
      'bar',
      'cafe',
      'hotel',
      'pousada',
      'hostel',
      'motel',
      'clinica',
      'clinic',
      'hospital',
      'consultorio',
      'escola',
      'school',
      'curso',
      'course',
      'academia',
      'gym',
      'fitness'
    ]::text[]
  );
$$;

REVOKE ALL ON FUNCTION private.business_slug_is_reserved(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.business_slug_is_reserved(text)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_patch_business_data(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_business public.business_data%ROWTYPE;
  v_unknown_key text;
  v_effective_location_id uuid;
  v_effective_address_id uuid;
  v_address_location_id uuid;
  v_address_owner_user_id uuid;
  v_profile_patch jsonb := '{}'::jsonb;
  v_profile_result jsonb;
  v_hours_shadow jsonb := NULL;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users AS actor WHERE actor.id = p_actor_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid business patch');
  END IF;

  SELECT business.*
  INTO v_business
  FROM public.business_data AS business
  JOIN public.profiles AS profile ON profile.id = business.profile_id
  WHERE business.profile_id = p_profile_id
    AND profile.profile_type = 'business'
    AND (
      profile.user_id = p_actor_user_id
      OR EXISTS (
        SELECT 1
        FROM public.profile_members AS member
        WHERE member.profile_id = business.profile_id
          AND member.user_id = p_actor_user_id
          AND member.role IN ('owner', 'admin')
          AND COALESCE(member.is_active, true)
      )
    )
  FOR UPDATE OF business;

  IF v_business.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business not found or permission denied');
  END IF;

  SELECT keys.key_name
  INTO v_unknown_key
  FROM jsonb_object_keys(p_patch) AS keys(key_name)
  WHERE keys.key_name NOT IN (
    'business_name',
    'legal_name',
    'cnpj',
    'company_type',
    'industry',
    'employee_count',
    'founded_year',
    'description',
    'category',
    'subcategory',
    'website',
    'instagram',
    'facebook',
    'payment_methods',
    'specialties',
    'facilities',
    'status',
    'slug',
    'metadata',
    'location_id',
    'address_id',
    'business_address',
    'business_city',
    'business_state',
    'business_zip',
    'can_post_vagas'
  )
  LIMIT 1;

  IF v_unknown_key IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported business field: ' || v_unknown_key
    );
  END IF;

  IF p_patch ? 'business_name' AND (
    jsonb_typeof(p_patch->'business_name') <> 'string'
    OR length(btrim(p_patch->>'business_name')) NOT BETWEEN 3 AND 100
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid business_name');
  END IF;

  FOR v_unknown_key IN
    SELECT keys.key_name
    FROM (VALUES
      ('legal_name', 150),
      ('cnpj', 32),
      ('industry', 100),
      ('description', 1000),
      ('category', 100),
      ('subcategory', 80),
      ('website', 2048),
      ('instagram', 120),
      ('facebook', 200),
      ('business_address', 240),
      ('business_city', 100),
      ('business_state', 100),
      ('business_zip', 16)
    ) AS keys(key_name, max_length)
    WHERE p_patch ? keys.key_name
      AND p_patch->keys.key_name <> 'null'::jsonb
      AND (
        jsonb_typeof(p_patch->keys.key_name) <> 'string'
        OR length(p_patch->>keys.key_name) > keys.max_length
      )
  LOOP
    RETURN jsonb_build_object('success', false, 'error', 'Invalid ' || v_unknown_key);
  END LOOP;

  IF p_patch ? 'company_type'
     AND p_patch->'company_type' <> 'null'::jsonb
     AND p_patch->>'company_type' NOT IN ('mei', 'ltda', 'sa', 'eireli', 'other') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid company_type');
  END IF;

  IF p_patch ? 'employee_count'
     AND p_patch->'employee_count' <> 'null'::jsonb
     AND p_patch->>'employee_count' NOT IN ('1-10', '11-50', '51-200', '201-500', '500+') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid employee_count');
  END IF;

  IF p_patch ? 'founded_year'
     AND p_patch->'founded_year' <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'founded_year') <> 'number'
       OR (p_patch->>'founded_year')::integer < 1800
       OR (p_patch->>'founded_year')::integer > EXTRACT(YEAR FROM CURRENT_DATE)::integer
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid founded_year');
  END IF;

  IF p_patch ? 'status'
     AND p_patch->'status' <> 'null'::jsonb
     AND p_patch->>'status' NOT IN ('active', 'inactive', 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid owner business status');
  END IF;

  IF p_patch ? 'can_post_vagas'
     AND p_patch->'can_post_vagas' <> 'null'::jsonb
     AND jsonb_typeof(p_patch->'can_post_vagas') <> 'boolean' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid can_post_vagas');
  END IF;

  IF p_patch ? 'slug' THEN
    IF p_patch->'slug' = 'null'::jsonb
       OR jsonb_typeof(p_patch->'slug') <> 'string'
       OR length(p_patch->>'slug') NOT BETWEEN 3 AND 60
       OR p_patch->>'slug' !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
       OR position('--' in p_patch->>'slug') > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid business slug');
    END IF;

    IF private.business_slug_is_reserved(p_patch->>'slug') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Reserved business slug');
    END IF;
  END IF;

  FOR v_unknown_key IN
    SELECT keys.key_name
    FROM (VALUES ('location_id'), ('address_id')) AS keys(key_name)
    WHERE p_patch ? keys.key_name
      AND p_patch->keys.key_name <> 'null'::jsonb
      AND (p_patch->>keys.key_name) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  LOOP
    RETURN jsonb_build_object('success', false, 'error', 'Invalid ' || v_unknown_key);
  END LOOP;

  IF p_patch ? 'metadata'
     AND p_patch->'metadata' <> 'null'::jsonb
     AND jsonb_typeof(p_patch->'metadata') <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid metadata');
  END IF;

  IF p_patch ? 'metadata'
     AND EXISTS (
       SELECT 1
       FROM jsonb_object_keys(COALESCE(p_patch->'metadata', '{}'::jsonb)) AS metadata_key(key_name)
       WHERE metadata_key.key_name NOT IN (
         'logo_url',
         'banner_url',
         'modos_atendimento',
         'tem_delivery',
         'aceita_cartao',
         'aceita_pix',
         'neighborhood',
         'cep',
         'city',
         'state'
       )
     ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported business metadata field'
    );
  END IF;

  IF p_patch ? 'metadata'
     AND EXISTS (
       SELECT 1
       FROM jsonb_each(COALESCE(p_patch->'metadata', '{}'::jsonb)) AS metadata_item(key_name, field_value)
       WHERE metadata_item.key_name IN ('tem_delivery', 'aceita_cartao', 'aceita_pix')
         AND metadata_item.field_value <> 'null'::jsonb
         AND jsonb_typeof(metadata_item.field_value) <> 'boolean'
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid business metadata boolean');
  END IF;

  IF p_patch ? 'metadata'
     AND COALESCE(p_patch->'metadata'->'modos_atendimento', 'null'::jsonb) <> 'null'::jsonb
     AND (
       jsonb_typeof(p_patch->'metadata'->'modos_atendimento') <> 'array'
       OR jsonb_array_length(p_patch->'metadata'->'modos_atendimento') > 20
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid business service modes');
  END IF;

  FOR v_unknown_key IN
    SELECT keys.key_name
    FROM (VALUES ('payment_methods'), ('specialties'), ('facilities')) AS keys(key_name)
    WHERE p_patch ? keys.key_name
      AND p_patch->keys.key_name <> 'null'::jsonb
      AND (
        jsonb_typeof(p_patch->keys.key_name) <> 'array'
        OR jsonb_array_length(p_patch->keys.key_name) > 100
      )
  LOOP
    RETURN jsonb_build_object('success', false, 'error', 'Invalid ' || v_unknown_key);
  END LOOP;

  v_effective_location_id := CASE
    WHEN p_patch ? 'location_id'
      THEN NULLIF(p_patch->>'location_id', '')::uuid
    ELSE v_business.location_id
  END;

  v_effective_address_id := CASE
    WHEN p_patch ? 'address_id'
      THEN NULLIF(p_patch->>'address_id', '')::uuid
    ELSE v_business.address_id
  END;

  IF v_business.business_role IN ('standalone', 'branch')
     AND v_effective_location_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business location is required');
  END IF;

  IF v_business.business_role = 'brand_hub'
     AND v_effective_location_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Brand hub cannot have territorial location');
  END IF;

  IF v_effective_address_id IS NOT NULL
     AND (p_patch ? 'address_id' OR p_patch ? 'location_id') THEN
    SELECT address.location_id, address.owner_user_id
    INTO v_address_location_id, v_address_owner_user_id
    FROM public.addresses AS address
    WHERE address.id = v_effective_address_id;

    IF v_address_location_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Address not found');
    END IF;

    IF v_address_owner_user_id IS DISTINCT FROM p_actor_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Address is not owned by actor');
    END IF;

    IF v_effective_location_id IS DISTINCT FROM v_address_location_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Address territory mismatch');
    END IF;
  END IF;

  IF p_contact_channels IS NOT NULL THEN
    IF jsonb_typeof(p_contact_channels) <> 'array'
       OR jsonb_array_length(p_contact_channels) > 3 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid contact channels');
    END IF;
  END IF;

  IF p_business_hours IS NOT NULL THEN
    IF jsonb_typeof(p_business_hours) <> 'array'
       OR jsonb_array_length(p_business_hours) > 7 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid business hours');
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_business_hours) AS item(value)
      WHERE jsonb_typeof(item.value) <> 'object'
         OR COALESCE(item.value->>'day_of_week', '') !~ '^[0-6]$'
         OR COALESCE(item.value->>'opens_at', '') !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
         OR COALESCE(item.value->>'closes_at', '') !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
         OR (
           item.value ? 'is_closed'
           AND jsonb_typeof(item.value->'is_closed') <> 'boolean'
         )
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid business hours row');
    END IF;

    IF (
      SELECT count(*) FROM jsonb_array_elements(p_business_hours)
    ) <> (
      SELECT count(DISTINCT (item.value->>'day_of_week')::integer)
      FROM jsonb_array_elements(p_business_hours) AS item(value)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Duplicate business hours day');
    END IF;

    SELECT COALESCE(
      jsonb_object_agg(
        CASE (item.value->>'day_of_week')::integer
          WHEN 0 THEN 'domingo'
          WHEN 1 THEN 'segunda'
          WHEN 2 THEN 'terca'
          WHEN 3 THEN 'quarta'
          WHEN 4 THEN 'quinta'
          WHEN 5 THEN 'sexta'
          WHEN 6 THEN 'sabado'
        END,
        jsonb_build_object(
          'open', item.value->>'opens_at',
          'close', item.value->>'closes_at',
          'closed', COALESCE((item.value->>'is_closed')::boolean, false)
        )
        ORDER BY (item.value->>'day_of_week')::integer
      ),
      '{}'::jsonb
    )
    INTO v_hours_shadow
    FROM jsonb_array_elements(p_business_hours) AS item(value);
  END IF;

  IF p_patch ? 'business_name' THEN
    v_profile_patch := v_profile_patch || jsonb_build_object(
      'name', btrim(p_patch->>'business_name'),
      'display_name', btrim(p_patch->>'business_name')
    );
  END IF;

  IF p_patch ? 'description' THEN
    v_profile_patch := v_profile_patch || jsonb_build_object('bio', p_patch->'description');
  END IF;

  IF p_patch ? 'business_city' THEN
    v_profile_patch := v_profile_patch || jsonb_build_object('city', p_patch->'business_city');
  END IF;

  IF p_patch ? 'location_id' THEN
    v_profile_patch := v_profile_patch || jsonb_build_object('location_id', p_patch->'location_id');
  END IF;

  IF v_profile_patch <> '{}'::jsonb THEN
    v_profile_result := private.profile_patch_owned(
      p_actor_user_id,
      p_profile_id,
      v_profile_patch,
      NULL
    );

    IF NOT COALESCE((v_profile_result->>'success')::boolean, false) THEN
      RAISE EXCEPTION 'profile_patch_failed: %', COALESCE(v_profile_result->>'error', 'unknown');
    END IF;
  END IF;

  UPDATE public.business_data AS business
  SET
    business_name = CASE WHEN p_patch ? 'business_name' THEN btrim(p_patch->>'business_name') ELSE business.business_name END,
    legal_name = CASE WHEN p_patch ? 'legal_name' THEN NULLIF(btrim(p_patch->>'legal_name'), '') ELSE business.legal_name END,
    cnpj = CASE WHEN p_patch ? 'cnpj' THEN NULLIF(btrim(p_patch->>'cnpj'), '') ELSE business.cnpj END,
    company_type = CASE WHEN p_patch ? 'company_type' THEN NULLIF(p_patch->>'company_type', '') ELSE business.company_type END,
    industry = CASE WHEN p_patch ? 'industry' THEN NULLIF(btrim(p_patch->>'industry'), '') ELSE business.industry END,
    employee_count = CASE WHEN p_patch ? 'employee_count' THEN NULLIF(p_patch->>'employee_count', '') ELSE business.employee_count END,
    founded_year = CASE WHEN p_patch ? 'founded_year' THEN NULLIF(p_patch->>'founded_year', '')::integer ELSE business.founded_year END,
    description = CASE WHEN p_patch ? 'description' THEN NULLIF(p_patch->>'description', '') ELSE business.description END,
    category = CASE WHEN p_patch ? 'category' THEN NULLIF(btrim(p_patch->>'category'), '') ELSE business.category END,
    subcategory = CASE WHEN p_patch ? 'subcategory' THEN NULLIF(btrim(p_patch->>'subcategory'), '') ELSE business.subcategory END,
    website = CASE WHEN p_patch ? 'website' THEN NULLIF(btrim(p_patch->>'website'), '') ELSE business.website END,
    instagram = CASE WHEN p_patch ? 'instagram' THEN NULLIF(btrim(p_patch->>'instagram'), '') ELSE business.instagram END,
    facebook = CASE WHEN p_patch ? 'facebook' THEN NULLIF(btrim(p_patch->>'facebook'), '') ELSE business.facebook END,
    payment_methods = CASE WHEN p_patch ? 'payment_methods' THEN COALESCE(p_patch->'payment_methods', '[]'::jsonb) ELSE business.payment_methods END,
    specialties = CASE WHEN p_patch ? 'specialties' THEN COALESCE(p_patch->'specialties', '[]'::jsonb) ELSE business.specialties END,
    facilities = CASE WHEN p_patch ? 'facilities' THEN COALESCE(p_patch->'facilities', '[]'::jsonb) ELSE business.facilities END,
    status = CASE WHEN p_patch ? 'status' THEN p_patch->>'status' ELSE business.status END,
    slug = CASE WHEN p_patch ? 'slug' THEN p_patch->>'slug' ELSE business.slug END,
    metadata = CASE
      WHEN p_patch ? 'metadata'
        THEN COALESCE(business.metadata, '{}'::jsonb) || COALESCE(p_patch->'metadata', '{}'::jsonb)
      ELSE business.metadata
    END,
    location_id = CASE WHEN p_patch ? 'location_id' THEN NULLIF(p_patch->>'location_id', '')::uuid ELSE business.location_id END,
    address_id = CASE WHEN p_patch ? 'address_id' THEN NULLIF(p_patch->>'address_id', '')::uuid ELSE business.address_id END,
    business_address = CASE WHEN p_patch ? 'business_address' THEN NULLIF(btrim(p_patch->>'business_address'), '') ELSE business.business_address END,
    business_city = CASE WHEN p_patch ? 'business_city' THEN NULLIF(btrim(p_patch->>'business_city'), '') ELSE business.business_city END,
    business_state = CASE WHEN p_patch ? 'business_state' THEN NULLIF(btrim(p_patch->>'business_state'), '') ELSE business.business_state END,
    business_zip = CASE WHEN p_patch ? 'business_zip' THEN NULLIF(btrim(p_patch->>'business_zip'), '') ELSE business.business_zip END,
    can_post_vagas = CASE WHEN p_patch ? 'can_post_vagas' THEN COALESCE((p_patch->>'can_post_vagas')::boolean, business.can_post_vagas) ELSE business.can_post_vagas END,
    opening_hours = CASE WHEN p_business_hours IS NOT NULL THEN v_hours_shadow ELSE business.opening_hours END,
    business_hours = CASE WHEN p_business_hours IS NOT NULL THEN v_hours_shadow ELSE business.business_hours END,
    updated_at = now()
  WHERE business.id = v_business.id;

  INSERT INTO public.business_stats (
    profile_id,
    business_id,
    views_count,
    favorites_count,
    shares_count
  ) VALUES (
    v_business.profile_id,
    v_business.id,
    0,
    0,
    0
  )
  ON CONFLICT (profile_id) DO UPDATE
  SET business_id = COALESCE(public.business_stats.business_id, EXCLUDED.business_id);

  IF p_business_hours IS NOT NULL THEN
    DELETE FROM public.business_hours AS hours
    WHERE hours.business_id = v_business.id;

    INSERT INTO public.business_hours (
      business_id,
      day_of_week,
      opens_at,
      closes_at,
      is_closed
    )
    SELECT
      v_business.id,
      (item.value->>'day_of_week')::integer,
      (item.value->>'opens_at')::time,
      (item.value->>'closes_at')::time,
      COALESCE((item.value->>'is_closed')::boolean, false)
    FROM jsonb_array_elements(p_business_hours) AS item(value);
  END IF;

  IF p_contact_channels IS NOT NULL THEN
    PERFORM public.contact_rpc_patch_owned_channels(
      p_actor_user_id,
      'business',
      v_business.id,
      p_contact_channels
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', v_business.profile_id,
      'business_data_id', v_business.id,
      'slug', CASE WHEN p_patch ? 'slug' THEN p_patch->>'slug' ELSE v_business.slug END,
      'status', CASE WHEN p_patch ? 'status' THEN p_patch->>'status' ELSE v_business.status END
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.profile_patch_business_data(uuid, uuid, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_patch_business_data(uuid, uuid, jsonb, jsonb, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_create_business(
  p_actor_user_id uuid,
  p_business_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_business_name text;
  v_slug text;
  v_handle text;
  v_attempt integer := 0;
  v_extension jsonb;
  v_create jsonb;
  v_patch jsonb;
  v_profile_id uuid;
BEGIN
  v_business_name := NULLIF(btrim(COALESCE(p_business_patch->>'business_name', '')), '');
  v_slug := NULLIF(btrim(COALESCE(p_business_patch->>'slug', '')), '');

  IF v_business_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'business_name is required');
  END IF;

  IF v_slug IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'slug is required');
  END IF;

  IF NULLIF(p_business_patch->>'location_id', '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'location_id is required');
  END IF;

  v_handle := v_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles AS profile WHERE profile.handle = v_handle
  ) LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt > 8 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Could not allocate business handle');
    END IF;
    v_handle := left(v_slug, 88) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END LOOP;

  v_extension := jsonb_strip_nulls(
    jsonb_build_object(
      'legal_name', COALESCE(NULLIF(btrim(p_business_patch->>'legal_name'), ''), v_business_name),
      'cnpj', NULLIF(btrim(p_business_patch->>'cnpj'), ''),
      'company_type', NULLIF(p_business_patch->>'company_type', ''),
      'industry', NULLIF(btrim(p_business_patch->>'industry'), ''),
      'address_id', NULLIF(p_business_patch->>'address_id', ''),
      'location_id', NULLIF(p_business_patch->>'location_id', '')
    )
  );

  BEGIN
    v_create := private.profile_create_profile_with_extension(
      p_actor_user_id,
      'business',
      v_handle,
      v_business_name,
      NULL,
      NULLIF(p_business_patch->>'description', ''),
      v_extension
    );

    IF NOT COALESCE((v_create->>'success')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_create->>'error', 'Business profile create failed');
    END IF;

    v_profile_id := (v_create->'data'->>'profile_id')::uuid;

    v_patch := private.profile_patch_business_data(
      p_actor_user_id,
      v_profile_id,
      p_business_patch,
      p_contact_channels,
      p_business_hours
    );

    IF NOT COALESCE((v_patch->>'success')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_patch->>'error', 'Business patch failed');
    END IF;

    RETURN v_patch;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

REVOKE ALL ON FUNCTION private.profile_create_business(uuid, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_create_business(uuid, jsonb, jsonb, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_deactivate_business(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_business_id uuid;
  v_profile_result jsonb;
BEGIN
  SELECT business.id
  INTO v_business_id
  FROM public.business_data AS business
  JOIN public.profiles AS profile ON profile.id = business.profile_id
  WHERE business.profile_id = p_profile_id
    AND profile.profile_type = 'business'
    AND (
      profile.user_id = p_actor_user_id
      OR EXISTS (
        SELECT 1
        FROM public.profile_members AS member
        WHERE member.profile_id = business.profile_id
          AND member.user_id = p_actor_user_id
          AND member.role IN ('owner', 'admin')
          AND COALESCE(member.is_active, true)
      )
    )
  FOR UPDATE OF business;

  IF v_business_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business not found or permission denied');
  END IF;

  v_profile_result := private.profile_patch_owned(
    p_actor_user_id,
    p_profile_id,
    '{"is_active":false}'::jsonb,
    NULL
  );

  IF NOT COALESCE((v_profile_result->>'success')::boolean, false) THEN
    RAISE EXCEPTION 'profile_deactivate_failed: %', COALESCE(v_profile_result->>'error', 'unknown');
  END IF;

  UPDATE public.business_data AS business
  SET status = 'deleted',
      updated_at = now()
  WHERE business.id = v_business_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', p_profile_id,
      'business_data_id', v_business_id,
      'status', 'deleted'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.profile_deactivate_business(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_deactivate_business(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_create_business(
  p_actor_user_id uuid,
  p_business_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_create_business(
    p_actor_user_id,
    p_business_patch,
    p_contact_channels,
    p_business_hours
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_rpc_update_business(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_business_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_patch_business_data(
    p_actor_user_id,
    p_profile_id,
    p_business_patch,
    p_contact_channels,
    p_business_hours
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_rpc_deactivate_business(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_deactivate_business(p_actor_user_id, p_profile_id);
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_create_business(uuid, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_update_business(uuid, uuid, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_deactivate_business(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.profile_rpc_create_business(uuid, jsonb, jsonb, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_update_business(uuid, uuid, jsonb, jsonb, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_deactivate_business(uuid, uuid)
  TO service_role;

COMMENT ON FUNCTION public.profile_rpc_create_business(uuid, jsonb, jsonb, jsonb)
  IS 'Service-role target for atomic owner Business creation through profile-rpc.';
COMMENT ON FUNCTION public.profile_rpc_update_business(uuid, uuid, jsonb, jsonb, jsonb)
  IS 'Service-role target for atomic non-structural owner Business updates through profile-rpc.';
COMMENT ON FUNCTION public.profile_rpc_deactivate_business(uuid, uuid)
  IS 'Service-role target for atomic owner Business soft-delete through profile-rpc.';

-- Compatibility window:
-- business_data is already fail-closed for browser DML. business_stats and
-- business_hours grants are retained until their remaining direct callers are
-- brokerized and the replacement web release is proven live.
