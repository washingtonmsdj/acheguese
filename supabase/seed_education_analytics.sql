-- ============================================================================
-- SEED: Dados de Analytics para Education (Teste do Funil de Matrícula)
-- ============================================================================
-- Popula education_analytics_events com eventos simulados para testar
-- o dashboard de analytics e o funil de conversão.
-- 
-- Cenário: Escola Horizonte (regular_school) com 30 dias de atividade
-- - 150 visualizações de perfil
-- - 45 cliques em WhatsApp
-- - 30 cliques em CTA de matrícula
-- - 20 leads enviados
-- - 15 leads contactados
-- - 10 visitas agendadas/completadas
-- - 5 matrículas confirmadas
-- ============================================================================

-- Limpar dados existentes para o profile de teste (se houver)
-- DELETE FROM education_analytics_events 
-- WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001';

-- ============================================================================
-- NOTE: Este seed assume que existem:
-- 1. Um business em business_data com id '550e8400-e29b-41d4-a716-446655440000'
-- 2. Um education_profile em education_profiles com id '550e8400-e29b-41d4-a716-446655440001'
-- 3. Alguns programs em education_programs para o profile
-- 4. Alguns events em education_events para o profile
-- 
-- Se não existirem, rode primeiro o seed principal ou crie manualmente.
-- ============================================================================

DO $$
DECLARE
  v_business_id UUID := '550e8400-e29b-41d4-a716-446655440000';
  v_profile_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  v_niche_key VARCHAR(50) := 'regular_school';
  v_now TIMESTAMPTZ := NOW();
  v_i INTEGER;
  v_session_id TEXT;
  v_program_ids UUID[];
  v_event_ids UUID[];
  v_lead_ids UUID[];
BEGIN
  -- Verificar se o profile existe
  IF NOT EXISTS (SELECT 1 FROM education_profiles WHERE id = v_profile_id) THEN
    RAISE NOTICE 'Profile % não encontrado. Pulando seed de analytics.', v_profile_id;
    RETURN;
  END IF;

  -- Buscar IDs de programas e eventos existentes
  SELECT ARRAY_AGG(id) INTO v_program_ids 
  FROM education_programs 
  WHERE education_profile_id = v_profile_id;
  
  SELECT ARRAY_AGG(id) INTO v_event_ids 
  FROM education_events 
  WHERE education_profile_id = v_profile_id;

  -- Criar leads de teste
  FOR v_i IN 1..20 LOOP
    INSERT INTO education_leads (
      education_profile_id,
      full_name,
      email,
      phone,
      child_name,
      child_age,
      interest_note,
      status,
      desired_grade,
      desired_shift,
      created_at
    ) VALUES (
      v_profile_id,
      'Responsável Teste ' || v_i,
      'responsavel' || v_i || '@teste.com',
      '(71) 99999-' || LPAD(v_i::TEXT, 4, '0'),
      'Aluno Teste ' || v_i,
      6 + (v_i % 12),
      CASE 
        WHEN v_i <= 5 THEN 'Interesse em matrícula imediata'
        WHEN v_i <= 10 THEN 'Quero visitar a escola'
        WHEN v_i <= 15 THEN 'Comparando opções'
        ELSE 'Entrar em contato'
      END,
      CASE 
        WHEN v_i <= 5 THEN 'enrolled'::education_lead_status
        WHEN v_i <= 8 THEN 'proposal_sent'
        WHEN v_i <= 12 THEN 'visited'
        WHEN v_i <= 15 THEN 'contacted'
        ELSE 'new'
      END,
      CASE (v_i % 5) 
        WHEN 0 THEN '1º Ano'
        WHEN 1 THEN '2º Ano'
        WHEN 2 THEN '3º Ano'
        WHEN 3 THEN '4º Ano'
        ELSE '5º Ano'
      END,
      CASE (v_i % 3)
        WHEN 0 THEN 'manha'
        WHEN 1 THEN 'tarde'
        ELSE 'integral'
      END,
      v_now - INTERVAL '1 day' * (v_i * 2)
    )
    RETURNING id INTO v_lead_ids[v_i];
  END LOOP;

  -- ============================================================================
  -- PROFILE VIEWS (150 eventos)
  -- Distribuídos ao longo de 30 dias
  -- ============================================================================
  
  FOR v_i IN 1..150 LOOP
    v_session_id := 'session_' || md5(v_i::TEXT || '_profile') || '_' || (v_now - INTERVAL '1 day' * (v_i % 30))::DATE;
    
    INSERT INTO education_analytics_events (
      education_profile_id,
      business_id,
      niche_key,
      event_type,
      source_page,
      session_id,
      metadata,
      created_at
    ) VALUES (
      v_profile_id,
      v_business_id,
      v_niche_key,
      'profile_view',
      '/educacao/ba/salvador/escola-horizonte',
      v_session_id,
      jsonb_build_object(
        'referrer', CASE (v_i % 4)
          WHEN 0 THEN 'https://google.com'
          WHEN 1 THEN 'https://instagram.com'
          WHEN 2 THEN 'direct'
          ELSE 'https://achegue.se'
        END
      ),
      v_now - INTERVAL '1 hour' * v_i
    );
  END LOOP;

  -- ============================================================================
  -- WHATSAPP CLICKS (45 eventos)
  -- ~30% dos que visualizaram o perfil
  -- ============================================================================
  
  FOR v_i IN 1..45 LOOP
    v_session_id := 'session_' || md5((v_i * 3)::TEXT || '_whatsapp') || '_' || (v_now - INTERVAL '1 day' * (v_i % 30))::DATE;
    
    INSERT INTO education_analytics_events (
      education_profile_id,
      business_id,
      niche_key,
      event_type,
      source_page,
      session_id,
      metadata,
      created_at
    ) VALUES (
      v_profile_id,
      v_business_id,
      v_niche_key,
      'whatsapp_click',
      '/educacao/ba/salvador/escola-horizonte',
      v_session_id,
      jsonb_build_object(
        'button_location', CASE (v_i % 3)
          WHEN 0 THEN 'hero_section'
          WHEN 1 THEN 'sidebar'
          ELSE 'sticky_header'
        END
      ),
      v_now - INTERVAL '1 hour' * (v_i * 3.3)
    );
  END LOOP;

  -- ============================================================================
  -- ENROLLMENT CTA CLICKS (30 eventos)
  -- Botões "Agendar visita" e "Solicitar orçamento"
  -- ============================================================================
  
  FOR v_i IN 1..30 LOOP
    v_session_id := 'session_' || md5((v_i * 5)::TEXT || '_cta') || '_' || (v_now - INTERVAL '1 day' * (v_i % 30))::DATE;
    
    INSERT INTO education_analytics_events (
      education_profile_id,
      business_id,
      niche_key,
      event_type,
      source_page,
      session_id,
      metadata,
      created_at
    ) VALUES (
      v_profile_id,
      v_business_id,
      v_niche_key,
      'enrollment_cta_click',
      '/educacao/ba/salvador/escola-horizonte',
      v_session_id,
      jsonb_build_object(
        'ctaLabel', CASE (v_i % 2)
          WHEN 0 THEN 'Agendar visita'
          ELSE 'Solicitar orcamento'
        END,
        'button_location', CASE (v_i % 3)
          WHEN 0 THEN 'programs_section'
          WHEN 1 THEN 'events_section'
          ELSE 'sidebar'
        END
      ),
      v_now - INTERVAL '1 hour' * (v_i * 5)
    );
  END LOOP;

  -- ============================================================================
  -- PROGRAM VIEWS (60 eventos)
  -- Visualizações de turmas específicas
  -- ============================================================================
  
  IF v_program_ids IS NOT NULL AND array_length(v_program_ids, 1) > 0 THEN
    FOR v_i IN 1..60 LOOP
      v_session_id := 'session_' || md5((v_i * 2)::TEXT || '_program') || '_' || (v_now - INTERVAL '1 day' * (v_i % 30))::DATE;
      
      INSERT INTO education_analytics_events (
        education_profile_id,
        business_id,
        niche_key,
        event_type,
        program_id,
        source_page,
        session_id,
        metadata,
        created_at
      ) VALUES (
        v_profile_id,
        v_business_id,
        v_niche_key,
        'program_view',
        v_program_ids[1 + (v_i % array_length(v_program_ids, 1))],
        '/educacao/ba/salvador/escola-horizonte',
        v_session_id,
        jsonb_build_object(
          'program_name', 'Turma ' || (v_i % 9 + 1) || 'º Ano'
        ),
        v_now - INTERVAL '1 hour' * (v_i * 2.5)
      );
    END LOOP;
  END IF;

  -- ============================================================================
  -- EVENT VIEWS (25 eventos)
  -- Visualizações de eventos/visitas
  -- ============================================================================
  
  IF v_event_ids IS NOT NULL AND array_length(v_event_ids, 1) > 0 THEN
    FOR v_i IN 1..25 LOOP
      v_session_id := 'session_' || md5((v_i * 4)::TEXT || '_event') || '_' || (v_now - INTERVAL '1 day' * (v_i % 30))::DATE;
      
      INSERT INTO education_analytics_events (
        education_profile_id,
        business_id,
        niche_key,
        event_type,
        education_event_id,
        source_page,
        session_id,
        metadata,
        created_at
      ) VALUES (
        v_profile_id,
        v_business_id,
        v_niche_key,
        'event_view',
        v_event_ids[1 + (v_i % array_length(v_event_ids, 1))],
        '/educacao/ba/salvador/escola-horizonte',
        v_session_id,
        jsonb_build_object(
          'event_title', CASE (v_i % 3)
            WHEN 0 THEN 'Visita Guiada'
            WHEN 1 THEN 'Aula Experimental'
            ELSE 'Feira de Matrícula'
          END
        ),
        v_now - INTERVAL '1 hour' * (v_i * 6)
      );
    END LOOP;
  END IF;

  -- ============================================================================
  -- LEAD SUBMITTED (20 eventos - correspondem aos leads criados)
  -- ============================================================================
  
  FOR v_i IN 1..20 LOOP
    v_session_id := 'session_' || md5((v_i * 7)::TEXT || '_lead') || '_' || (v_now - INTERVAL '1 day' * (v_i % 30))::DATE;
    
    INSERT INTO education_analytics_events (
      education_profile_id,
      business_id,
      niche_key,
      event_type,
      lead_id,
      source_page,
      session_id,
      metadata,
      created_at
    ) VALUES (
      v_profile_id,
      v_business_id,
      v_niche_key,
      'lead_submitted',
      v_lead_ids[v_i],
      '/educacao/ba/salvador/escola-horizonte',
      v_session_id,
      jsonb_build_object(
        'form_location', 'lead_modal',
        'hasGuardian', v_i <= 15,
        'desiredGrade', CASE (v_i % 5) 
          WHEN 0 THEN '1º Ano'
          WHEN 1 THEN '2º Ano'
          WHEN 2 THEN '3º Ano'
          WHEN 3 THEN '4º Ano'
          ELSE '5º Ano'
        END
      ),
      v_now - INTERVAL '1 day' * (v_i * 2)
    );
  END LOOP;

  -- ============================================================================
  -- EVENT INTEREST (15 eventos)
  -- Demonstração de interesse em eventos específicos
  -- ============================================================================
  
  IF v_event_ids IS NOT NULL AND array_length(v_event_ids, 1) > 0 THEN
    FOR v_i IN 1..15 LOOP
      v_session_id := 'session_' || md5((v_i * 8)::TEXT || '_interest') || '_' || (v_now - INTERVAL '1 day' * (v_i % 30))::DATE;
      
      INSERT INTO education_analytics_events (
        education_profile_id,
        business_id,
        niche_key,
        event_type,
        education_event_id,
        source_page,
        session_id,
        metadata,
        created_at
      ) VALUES (
        v_profile_id,
        v_business_id,
        v_niche_key,
        'event_interest',
        v_event_ids[1 + (v_i % array_length(v_event_ids, 1))],
        '/educacao/ba/salvador/escola-horizonte',
        v_session_id,
        jsonb_build_object(
          'interest_type', CASE (v_i % 3)
            WHEN 0 THEN 'confirmed_attendance'
            WHEN 1 THEN 'request_info'
            ELSE 'share_event'
          END
        ),
        v_now - INTERVAL '1 day' * (v_i * 2)
      );
    END LOOP;
  END IF;

  RAISE NOTICE 'Seed de analytics concluído!';
  RAISE NOTICE '  - Profile Views: 150';
  RAISE NOTICE '  - WhatsApp Clicks: 45';
  RAISE NOTICE '  - CTA Clicks: 30';
  RAISE NOTICE '  - Program Views: 60';
  RAISE NOTICE '  - Event Views: 25';
  RAISE NOTICE '  - Leads Submitted: 20';
  RAISE NOTICE '  - Event Interests: 15';
  RAISE NOTICE '  - Leads Criados: 20 (varios status)';

END $$;
