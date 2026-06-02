-- Seed official public education records for Complexo do Nordeste de Amaralina.
-- The data used to live only as frontend preview data. This migration materializes
-- it into the database SSOT: profiles -> business_data -> education_profiles.
-- Ownership model:
-- - each school receives its own business profile, so control can be transferred
--   later by updating profiles.user_id and/or adding official users to profile_members.
-- - metadata records the public authority currently responsible for the school.
-- - no runtime mock or redirect is required.

DO $$
DECLARE
  v_platform_custody_user_id uuid;
  v_published_at timestamptz := '2026-04-29T00:00:00Z';
  v_authority_profile_id uuid;
  v_school_profile_id uuid;
  v_business_id uuid;
  v_education_profile_id uuid;
  v_location_id uuid;
  v_program_name text;
  v_level text;
  v_order int;
  school record;
BEGIN
  SELECT ur.user_id
  INTO v_platform_custody_user_id
  FROM public.user_roles ur
  WHERE ur.role_enum IN ('super_admin', 'admin')
  ORDER BY CASE ur.role_enum WHEN 'super_admin' THEN 0 ELSE 1 END, ur.created_at NULLS LAST
  LIMIT 1;

  IF v_platform_custody_user_id IS NULL THEN
    RAISE NOTICE 'No admin user found; seeding public education profiles without initial user custody.';
  END IF;

  -- Institutional custody profiles. They are public placeholders until an
  -- authenticated official account is linked by operations.
  SELECT id INTO v_authority_profile_id
  FROM public.profiles
  WHERE slug = 'prefeitura-de-salvador-educacao'
  LIMIT 1;

  IF v_authority_profile_id IS NULL THEN
    INSERT INTO public.profiles (
      user_id,
      profile_type,
      name,
      display_name,
      handle,
      username,
      slug,
      bio,
      is_active,
      is_public,
      verified,
      verified_at,
      reputation_score,
      trust_score
    )
    VALUES (
      v_platform_custody_user_id,
      'business',
      'Prefeitura de Salvador - Educacao',
      'Prefeitura de Salvador - Educacao',
      'prefeitura-de-salvador-educacao',
      'prefeitura-de-salvador-educacao',
      'prefeitura-de-salvador-educacao',
      'Perfil institucional de custodia para unidades educacionais municipais de Salvador.',
      true,
      true,
      true,
      now(),
      80,
      80
    );
  ELSE
    UPDATE public.profiles
    SET
      profile_type = 'business',
      name = 'Prefeitura de Salvador - Educacao',
      display_name = 'Prefeitura de Salvador - Educacao',
      handle = 'prefeitura-de-salvador-educacao',
      username = 'prefeitura-de-salvador-educacao',
      bio = 'Perfil institucional de custodia para unidades educacionais municipais de Salvador.',
      is_active = true,
      is_public = true,
      verified = true,
      verified_at = COALESCE(verified_at, now()),
      updated_at = now()
    WHERE id = v_authority_profile_id;
  END IF;

  SELECT id INTO v_authority_profile_id
  FROM public.profiles
  WHERE slug = 'governo-da-bahia-educacao'
  LIMIT 1;

  IF v_authority_profile_id IS NULL THEN
    INSERT INTO public.profiles (
      user_id,
      profile_type,
      name,
      display_name,
      handle,
      username,
      slug,
      bio,
      is_active,
      is_public,
      verified,
      verified_at,
      reputation_score,
      trust_score
    )
    VALUES (
      v_platform_custody_user_id,
      'business',
      'Governo da Bahia - Educacao',
      'Governo da Bahia - Educacao',
      'governo-da-bahia-educacao',
      'governo-da-bahia-educacao',
      'governo-da-bahia-educacao',
      'Perfil institucional de custodia para unidades educacionais estaduais da Bahia.',
      true,
      true,
      true,
      now(),
      80,
      80
    );
  ELSE
    UPDATE public.profiles
    SET
      profile_type = 'business',
      name = 'Governo da Bahia - Educacao',
      display_name = 'Governo da Bahia - Educacao',
      handle = 'governo-da-bahia-educacao',
      username = 'governo-da-bahia-educacao',
      bio = 'Perfil institucional de custodia para unidades educacionais estaduais da Bahia.',
      is_active = true,
      is_public = true,
      verified = true,
      verified_at = COALESCE(verified_at, now()),
      updated_at = now()
    WHERE id = v_authority_profile_id;
  END IF;

  FOR school IN
    SELECT *
    FROM jsonb_to_recordset(
      '[
        {"slug":"cmei-dalia-de-menezes","name":"Centro Municipal de Educacao Infantil Dalia de Menezes","network":"municipal","district":"nordeste-de-amaralina","address":"Rua Sao Jose do Nordeste, SN, Nordeste de Amaralina","phone":"(71) 3202-0120","email":"cmeidaliademenezes.creorla@gmail.com","inep":"29412277","levels":["early_childhood"],"shifts":["morning","afternoon"],"source_slug":"centro-municipal-de-educacao-infantil-dalia-de-menezes"},
        {"slug":"colegio-estadual-professor-carlos-sant-anna-tempo-integral","name":"Colegio Estadual Professor Carlos Sant Anna Tempo Integral","network":"state","district":"nordeste-de-amaralina","address":"Rua Alto dos Coqueiros, 372, Nordeste de Amaralina","phone":"(71) 3346-1969","email":null,"inep":"29191084","levels":["elementary_2","middle_school"],"shifts":["morning","afternoon","evening"],"source_slug":"colegio-estadual-professor-carlos-sant-anna-tempo-integral"},
        {"slug":"escola-municipal-maria-amalia-paiva","name":"Escola Municipal Maria Amalia Paiva","network":"municipal","district":"nordeste-de-amaralina","address":"Rua Doutor Edgard Barros, 40, Nordeste de Amaralina","phone":"(71) 3202-0119","email":"esc-mariaamaliapaiva@salvador.ba.gov.br","inep":"29193559","levels":["elementary_1","elementary_2","middle_school"],"shifts":["morning","afternoon","evening"],"source_slug":"escola-municipal-maria-amalia-paiva"},
        {"slug":"escola-municipal-professora-anita-barbuda","name":"Escola Municipal Professora Anita Barbuda","network":"municipal","district":"nordeste-de-amaralina","address":"Rua Sao Policarpo, SN, Nordeste de Amaralina","phone":"(71) 3202-0117","email":"esc-anitabarbuda@salvador.ba.gov.br","inep":"29336597","levels":["elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-professora-anita-barbuda"},
        {"slug":"cmei-vale-das-pedrinhas","name":"Centro Municipal de Educacao Infantil Vale das Pedrinhas","network":"municipal","district":"santa-cruz","address":"Rua Gilberto Maltez, SN, Santa Cruz","phone":"(71) 3202-0136","email":null,"inep":"29474590","levels":["early_childhood"],"shifts":["morning","afternoon"],"source_slug":"centro-municipal-de-educacao-infantil-vale-das-pedrinhas"},
        {"slug":"colegio-estadual-general-dionisio-cerqueira-tempo-integral","name":"Colegio Estadual General Dionisio Cerqueira Tempo Integral","network":"state","district":"santa-cruz","address":"Rua do Futuro Alto Santa Cruz, 475, Santa Cruz","phone":"(71) 3354-9400","email":null,"inep":"29192617","levels":["elementary_2","high_school"],"shifts":["morning","afternoon"],"source_slug":"colegio-estadual-general-dionisio-cerqueira-tempo-integral"},
        {"slug":"escola-municipal-artur-de-sales","name":"Escola Municipal Artur de Sales","network":"municipal","district":"santa-cruz","address":"Rua Antonio Carlos Magalhaes, 393, Santa Cruz","phone":"(71) 3202-0127","email":null,"inep":"29186315","levels":["early_childhood","elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-artur-de-sales"},
        {"slug":"escola-municipal-centro-social-neusa-nery","name":"Escola Municipal Centro Social Neusa Nery","network":"municipal","district":"santa-cruz","address":"Rua Catargo, 44, Santa Cruz","phone":"(71) 3202-0134","email":"esc-csneusanery@salvador.ba.gov.br","inep":"29181224","levels":["elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-centro-social-neusa-nery"},
        {"slug":"escola-municipal-comunitaria-cristo-redentor","name":"Escola Municipal Comunitaria Cristo Redentor","network":"municipal","district":"santa-cruz","address":"Rua Doutor Antonio Cavalcante, 19, Santa Cruz","phone":"(71) 3202-0133","email":"esc-ccristoredentor@salvador.ba.gov.br","inep":"29190240","levels":["early_childhood","elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-comunitaria-cristo-redentor"},
        {"slug":"escola-municipal-cristo-e-vida","name":"Escola Municipal Cristo e Vida","network":"municipal","district":"santa-cruz","address":"Rua Antonio Carlos Pedreira, 01, Santa Cruz","phone":"(71) 3202-0132","email":"esc-cristovida@salvador.ba.gov.br","inep":"29415497","levels":["early_childhood","elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-cristo-e-vida"},
        {"slug":"escola-municipal-jose-calazans-brandao-da-silva","name":"Escola Municipal Jose Calazans Brandao da Silva","network":"municipal","district":"santa-cruz","address":"Rua do Futuro, SN, Santa Cruz","phone":"(71) 3202-0135","email":"esc-josecalazans@salvador.ba.gov.br","inep":"29193168","levels":["elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-jose-calazans-brandao-da-silva"},
        {"slug":"escola-municipal-santo-andre","name":"Escola Municipal Santo Andre","network":"municipal","district":"santa-cruz","address":"Rua Vinte e Seis de Abril, 133, Santa Cruz","phone":"(71) 3202-0129","email":null,"inep":"29188318","levels":["elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-santo-andre"},
        {"slug":"escola-municipal-sao-pedro-nolasco","name":"Escola Municipal Sao Pedro Nolasco","network":"municipal","district":"santa-cruz","address":"Rua Doutor Benjamin Goncalves, 248, Santa Cruz","phone":"(71) 3202-0131","email":"esc-spedronolasco@salvador.ba.gov.br","inep":"29187982","levels":["early_childhood","elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-sao-pedro-nolasco"},
        {"slug":"escola-municipal-teodoro-sampaio","name":"Escola Municipal Teodoro Sampaio","network":"municipal","district":"santa-cruz","address":"Rua Doutor Armando Colavolpe, 265, Santa Cruz","phone":"(71) 3202-0130","email":"esc-tsampaio@salvador.ba.gov.br","inep":"29198836","levels":["middle_school"],"shifts":["morning","afternoon","evening"],"source_slug":"escola-municipal-teodoro-sampaio"},
        {"slug":"escola-municipal-vale-das-pedrinhas","name":"Escola Municipal Vale das Pedrinhas","network":"municipal","district":"santa-cruz","address":"Rua Vinte e Um de Agosto, 140, Vale das Pedrinhas, Santa Cruz","phone":"(71) 3202-0128","email":"esc-valepedrinhas@salvador.ba.gov.br","inep":"29194547","levels":["early_childhood","elementary_1"],"shifts":["morning","afternoon"],"source_slug":"escola-municipal-vale-das-pedrinhas"}
      ]'::jsonb
    ) AS s(
      slug text,
      name text,
      network text,
      district text,
      address text,
      phone text,
      email text,
      inep text,
      levels text[],
      shifts text[],
      source_slug text
    )
  LOOP
    SELECT id INTO v_location_id
    FROM public.locations
    WHERE geographic_path = '/br/ba/salvador/' || school.district
    LIMIT 1;

    IF v_location_id IS NULL THEN
      RAISE NOTICE 'Skipping school %, location not found: %', school.name, school.district;
      CONTINUE;
    END IF;

    SELECT id INTO v_authority_profile_id
    FROM public.profiles
    WHERE slug = CASE
      WHEN school.network = 'state' THEN 'governo-da-bahia-educacao'
      ELSE 'prefeitura-de-salvador-educacao'
    END
    LIMIT 1;

    SELECT id INTO v_school_profile_id
    FROM public.profiles
    WHERE slug = school.slug
    LIMIT 1;

    IF v_school_profile_id IS NULL THEN
      INSERT INTO public.profiles (
        user_id,
        profile_type,
        name,
        display_name,
        handle,
        username,
        slug,
        bio,
        contact_email,
        phone,
        whatsapp,
        location_id,
        main_territory_location_id,
        city,
        state,
        is_active,
        is_public,
        verified,
        verified_at,
        show_contact_email,
        show_phone,
        reputation_score,
        trust_score
      )
      VALUES (
        v_platform_custody_user_id,
        'business',
        school.name,
        school.name,
        school.slug,
        school.slug,
        school.slug,
        CASE
          WHEN school.network = 'state' THEN 'Unidade escolar da rede estadual da Bahia.'
          ELSE 'Unidade escolar da rede municipal de Salvador.'
        END,
        school.email,
        school.phone,
        school.phone,
        v_location_id,
        v_location_id,
        'Salvador',
        'BA',
        true,
        true,
        true,
        now(),
        school.email IS NOT NULL,
        true,
        70,
        70
      )
      RETURNING id INTO v_school_profile_id;
    ELSE
      UPDATE public.profiles
      SET
        profile_type = 'business',
        name = school.name,
        display_name = school.name,
        handle = school.slug,
        username = school.slug,
        bio = CASE
          WHEN school.network = 'state' THEN 'Unidade escolar da rede estadual da Bahia.'
          ELSE 'Unidade escolar da rede municipal de Salvador.'
        END,
        contact_email = school.email,
        phone = school.phone,
        whatsapp = school.phone,
        location_id = v_location_id,
        main_territory_location_id = v_location_id,
        city = 'Salvador',
        state = 'BA',
        is_active = true,
        is_public = true,
        verified = true,
        verified_at = COALESCE(verified_at, now()),
        show_contact_email = school.email IS NOT NULL,
        show_phone = true,
        reputation_score = 70,
        trust_score = 70,
        updated_at = now()
      WHERE id = v_school_profile_id;
    END IF;

    SELECT id INTO v_business_id
    FROM public.business_data
    WHERE profile_id = v_school_profile_id OR slug = school.slug
    ORDER BY CASE WHEN profile_id = v_school_profile_id THEN 0 ELSE 1 END
    LIMIT 1;

    IF v_business_id IS NULL THEN
      INSERT INTO public.business_data (
        profile_id,
        business_name,
        description,
        slug,
        category,
        subcategory,
        address,
        business_address,
        business_city,
        business_state,
        email,
        location_id,
        status,
        business_role,
        is_verified,
        can_post_vagas,
        metadata
      )
      VALUES (
        v_school_profile_id,
        school.name,
        CASE
          WHEN school.network = 'state' THEN 'Unidade escolar publica da rede estadual da Bahia.'
          ELSE 'Unidade escolar publica da rede municipal de Salvador.'
        END,
        school.slug,
        'educacao',
        'escola-publica',
        school.address,
        school.address,
        'Salvador',
        'BA',
        school.email,
        v_location_id,
        'active',
        'standalone',
        true,
        false,
        jsonb_build_object(
          'source', 'public_education_seed',
          'source_reviewed_at', v_published_at,
          'source_authority_network', school.network,
          'source_authority_profile_id', v_authority_profile_id,
          'source_authority_profile_slug', CASE
            WHEN school.network = 'state' THEN 'governo-da-bahia-educacao'
            ELSE 'prefeitura-de-salvador-educacao'
          END,
          'custody_status', 'platform_curated_pending_official_claim',
          'transfer_model', 'profile_members_or_profile_owner_user_id',
          'inep', school.inep
        )
      )
      RETURNING id INTO v_business_id;
    ELSE
      UPDATE public.business_data
      SET
        profile_id = v_school_profile_id,
        business_name = school.name,
        description = CASE
          WHEN school.network = 'state' THEN 'Unidade escolar publica da rede estadual da Bahia.'
          ELSE 'Unidade escolar publica da rede municipal de Salvador.'
        END,
        slug = school.slug,
        category = 'educacao',
        subcategory = 'escola-publica',
        address = school.address,
        business_address = school.address,
        business_city = 'Salvador',
        business_state = 'BA',
        email = school.email,
        location_id = v_location_id,
        status = 'active',
        business_role = 'standalone',
        is_verified = true,
        can_post_vagas = false,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'source', 'public_education_seed',
          'source_reviewed_at', v_published_at,
          'source_authority_network', school.network,
          'source_authority_profile_id', v_authority_profile_id,
          'source_authority_profile_slug', CASE
            WHEN school.network = 'state' THEN 'governo-da-bahia-educacao'
            ELSE 'prefeitura-de-salvador-educacao'
          END,
          'custody_status', 'platform_curated_pending_official_claim',
          'transfer_model', 'profile_members_or_profile_owner_user_id',
          'inep', school.inep
        ),
        updated_at = now()
      WHERE id = v_business_id;
    END IF;

    SELECT id INTO v_education_profile_id
    FROM public.education_profiles
    WHERE school_inep_code = school.inep
    LIMIT 1;

    IF v_education_profile_id IS NULL THEN
      INSERT INTO public.education_profiles (
        business_id,
        institution_type,
        niche_key,
        support_level,
        summary,
        whatsapp_number,
        status,
        published_at,
        school_type,
        school_network,
        school_inep_code,
        school_source_url,
        school_source_updated_at,
        education_levels,
        shifts,
        enrollment_open,
        school_basic_resources,
        school_accessibility_features,
        school_equipment_features,
        school_facility_features
      )
      VALUES (
        v_school_profile_id,
        'school',
        'regular_school',
        'basic_enabled',
        CASE
          WHEN school.network = 'state' THEN 'Rede estadual. INEP: ' || school.inep || '.'
          ELSE 'Rede municipal. INEP: ' || school.inep || '.'
        END,
        school.phone,
        'published',
        v_published_at,
        'public',
        school.network,
        school.inep,
        'https://escolas.com.br/' || school.source_slug || '-' || school.inep,
        v_published_at,
        school.levels,
        school.shifts,
        false,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb
      )
      RETURNING id INTO v_education_profile_id;
    ELSE
      UPDATE public.education_profiles
      SET
        business_id = v_school_profile_id,
        institution_type = 'school',
        niche_key = 'regular_school',
        support_level = 'basic_enabled',
        summary = CASE
          WHEN school.network = 'state' THEN 'Rede estadual. INEP: ' || school.inep || '.'
          ELSE 'Rede municipal. INEP: ' || school.inep || '.'
        END,
        whatsapp_number = school.phone,
        status = 'published',
        published_at = COALESCE(published_at, v_published_at),
        school_type = 'public',
        school_network = school.network,
        school_source_url = 'https://escolas.com.br/' || school.source_slug || '-' || school.inep,
        school_source_updated_at = v_published_at,
        education_levels = school.levels,
        shifts = school.shifts,
        enrollment_open = false,
        updated_at = now()
      WHERE id = v_education_profile_id;
    END IF;

    -- Rebuild only the public-seed program catalogue for this seeded profile.
    DELETE FROM public.education_programs
    WHERE education_profile_id = v_education_profile_id
      AND description IS NULL
      AND price_from IS NULL
      AND current_enrollment IS NULL;

    v_order := 0;
    FOREACH v_level IN ARRAY school.levels
    LOOP
      FOR v_program_name IN
        SELECT name
        FROM (
          VALUES
            ('early_childhood', 'Creche'),
            ('early_childhood', 'Pre-escola'),
            ('elementary_1', '1o ano'),
            ('elementary_1', '2o ano'),
            ('elementary_1', '3o ano'),
            ('elementary_1', '4o ano'),
            ('elementary_1', '5o ano'),
            ('elementary_2', '6o ano'),
            ('elementary_2', '7o ano'),
            ('elementary_2', '8o ano'),
            ('elementary_2', '9o ano'),
            ('middle_school', 'EJA'),
            ('high_school', '1a serie do Ensino Medio'),
            ('high_school', '2a serie do Ensino Medio'),
            ('high_school', '3a serie do Ensino Medio'),
            ('technical', 'Curso Tecnico')
        ) AS programs(level_key, name)
        WHERE level_key = v_level
      LOOP
        v_order := v_order + 1;

        INSERT INTO public.education_programs (
          education_profile_id,
          name,
          description,
          age_group,
          shift,
          modality,
          available_slots,
          price_from,
          is_active,
          display_order,
          education_level,
          grade,
          class_name,
          max_capacity,
          current_enrollment,
          schedule
        )
        VALUES (
          v_education_profile_id,
          v_program_name,
          null,
          null,
          array_to_string(school.shifts, ', '),
          'Presencial',
          null,
          null,
          true,
          v_order,
          v_level,
          null,
          null,
          null,
          null,
          array_to_string(school.shifts, ', ')
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Align RLS with the corrected Education SSOT:
-- education_profiles.business_id references profiles.id, not business_data.id.
-- Management access must work for profile owners and delegated profile_members.

DROP POLICY IF EXISTS "Owners manage own business" ON public.business_data;
CREATE POLICY "Owners manage own business"
  ON public.business_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = business_data.profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profile_members pm
      WHERE pm.profile_id = business_data.profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = business_data.profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profile_members pm
      WHERE pm.profile_id = business_data.profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS education_profiles_owner_all ON public.education_profiles;
CREATE POLICY education_profiles_owner_all
  ON public.education_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = education_profiles.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profile_members pm
      WHERE pm.profile_id = education_profiles.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = education_profiles.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profile_members pm
      WHERE pm.profile_id = education_profiles.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS education_programs_owner_all ON public.education_programs;
CREATE POLICY education_programs_owner_all
  ON public.education_programs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_programs.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_programs.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_programs.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_programs.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS education_leads_owner_all ON public.education_leads;
CREATE POLICY education_leads_owner_all
  ON public.education_leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_leads.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_leads.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_leads.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_leads.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS education_lead_events_owner_all ON public.education_lead_events;
CREATE POLICY education_lead_events_owner_all
  ON public.education_lead_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.education_leads el
      JOIN public.education_profiles ep ON ep.id = el.education_profile_id
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE el.id = education_lead_events.lead_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_leads el
      JOIN public.education_profiles ep ON ep.id = el.education_profile_id
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE el.id = education_lead_events.lead_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.education_leads el
      JOIN public.education_profiles ep ON ep.id = el.education_profile_id
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE el.id = education_lead_events.lead_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_leads el
      JOIN public.education_profiles ep ON ep.id = el.education_profile_id
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE el.id = education_lead_events.lead_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS education_events_owner_all ON public.education_events;
CREATE POLICY education_events_owner_all
  ON public.education_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_events.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_events.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_events.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_events.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS "allow_owner_read_analytics" ON public.education_analytics_events;
CREATE POLICY "allow_owner_read_analytics"
  ON public.education_analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_analytics_events.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_analytics_events.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS "allow_owner_delete_analytics" ON public.education_analytics_events;
CREATE POLICY "allow_owner_delete_analytics"
  ON public.education_analytics_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profiles p ON p.id = ep.business_id
      WHERE ep.id = education_analytics_events.education_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.education_profiles ep
      JOIN public.profile_members pm ON pm.profile_id = ep.business_id
      WHERE ep.id = education_analytics_events.education_profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );
