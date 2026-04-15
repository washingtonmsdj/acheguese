-- ============================================================================
-- FIX: Tone Cos Loja - Adicionar slug e geographic_path
-- ============================================================================

DO $$
DECLARE
  v_profile_id UUID;
  v_business_id UUID;
  v_location_id UUID;
  v_district_id UUID;
BEGIN
  -- 1. Buscar o profile_id da Tone Cos Loja
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE username = 'tonecosloja_empresa'
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE NOTICE '❌ Profile tonecosloja_empresa não encontrado';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Profile encontrado: %', v_profile_id;

  -- 2. Buscar o business_id
  SELECT id INTO v_business_id
  FROM business_data
  WHERE profile_id = v_profile_id
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE NOTICE '❌ Business não encontrado para profile %', v_profile_id;
    RETURN;
  END IF;

  RAISE NOTICE '✅ Business encontrado: %', v_business_id;

  -- 3. Buscar ou criar o bairro "Nordeste de Amaralina" em Salvador
  -- Primeiro, buscar Salvador
  SELECT id INTO v_location_id
  FROM locations
  WHERE type = 'city'
    AND name = 'Salvador'
    AND geographic_path = '/br/ba/salvador'
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE NOTICE '❌ Salvador não encontrado';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Salvador encontrado: %', v_location_id;

  -- Buscar ou criar o bairro "Nordeste de Amaralina"
  SELECT id INTO v_district_id
  FROM locations
  WHERE type = 'district'
    AND name = 'Nordeste de Amaralina'
    AND parent_id = v_location_id
  LIMIT 1;

  IF v_district_id IS NULL THEN
    -- Criar o bairro
    INSERT INTO locations (
      name,
      full_name,
      type,
      parent_id,
      geographic_path,
      slug,
      metadata
    ) VALUES (
      'Nordeste de Amaralina',
      'Nordeste de Amaralina, Salvador, BA',
      'district',
      v_location_id,
      '/br/ba/salvador/nordeste-de-amaralina',
      'nordeste-de-amaralina',
      '{}'::jsonb
    )
    RETURNING id INTO v_district_id;

    RAISE NOTICE '✅ Bairro Nordeste de Amaralina criado: %', v_district_id;
  ELSE
    RAISE NOTICE '✅ Bairro Nordeste de Amaralina encontrado: %', v_district_id;
  END IF;

  -- 4. Atualizar business_data com slug e location_id
  UPDATE business_data
  SET 
    slug = 'tone-cos-loja',
    location_id = v_district_id,
    updated_at = NOW()
  WHERE id = v_business_id;

  RAISE NOTICE '✅ Business atualizado com slug=tone-cos-loja e location_id=%', v_district_id;

  -- 5. Verificar o resultado
  RAISE NOTICE '--- VERIFICAÇÃO FINAL ---';
  
  PERFORM 
    bd.id,
    bd.business_name,
    bd.slug,
    bd.location_id,
    l.geographic_path
  FROM business_data bd
  LEFT JOIN locations l ON l.id = bd.location_id
  WHERE bd.id = v_business_id;

  RAISE NOTICE '✅ Tone Cos Loja configurada com sucesso!';
  RAISE NOTICE 'Slug: tone-cos-loja';
  RAISE NOTICE 'Location: Nordeste de Amaralina';
  RAISE NOTICE 'URL: /empresas/ba/salvador/nordeste-de-amaralina/tone-cos-loja';

END $$;
