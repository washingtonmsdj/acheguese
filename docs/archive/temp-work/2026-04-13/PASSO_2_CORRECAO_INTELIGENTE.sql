-- ============================================================
-- PASSO 2: CORREÇÃO INTELIGENTE (Baseada no Diagnóstico)
-- ============================================================
-- Este script:
-- 1. Verifica o que existe
-- 2. Corrige apenas o necessário
-- 3. Preserva dados válidos
-- 4. NÃO deleta tudo cegamente
-- ============================================================

DO $$
DECLARE
  v_brasil_id UUID;
  v_bahia_id UUID;
  v_salvador_id UUID;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== INICIANDO CORREÇÃO INTELIGENTE ===';
  
  -- ============================================================
  -- 1. VERIFICAR E CRIAR BRASIL (COUNTRY)
  -- ============================================================
  SELECT id INTO v_brasil_id 
  FROM locations 
  WHERE type = 'country' AND (slug = 'brasil' OR name ILIKE '%brasil%')
  LIMIT 1;
  
  IF v_brasil_id IS NULL THEN
    RAISE NOTICE '❌ Brasil não existe. Criando...';
    
    INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'Brasil',
      'Brasil',
      'brasil',
      'country',
      NULL,
      'active',
      '{"code": "BR", "iso": "BRA", "continent": "South America"}'::jsonb
    )
    RETURNING id INTO v_brasil_id;
    
    RAISE NOTICE '✅ Brasil criado: %', v_brasil_id;
  ELSE
    RAISE NOTICE '✅ Brasil já existe: %', v_brasil_id;
  END IF;
  
  -- ============================================================
  -- 2. VERIFICAR E CRIAR/CORRIGIR BAHIA (STATE)
  -- ============================================================
  SELECT id INTO v_bahia_id 
  FROM locations 
  WHERE type = 'state' AND (slug = 'bahia' OR name ILIKE '%bahia%')
  LIMIT 1;
  
  IF v_bahia_id IS NULL THEN
    RAISE NOTICE '❌ Bahia não existe. Criando...';
    
    INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Bahia',
      'Bahia, Brasil',
      'bahia',
      'state',
      v_brasil_id,
      'active',
      '{"code": "BA", "region": "Nordeste"}'::jsonb
    )
    RETURNING id INTO v_bahia_id;
    
    RAISE NOTICE '✅ Bahia criada: %', v_bahia_id;
  ELSE
    -- Verificar se parent está correto
    SELECT COUNT(*) INTO v_count
    FROM locations
    WHERE id = v_bahia_id AND parent_id = v_brasil_id;
    
    IF v_count = 0 THEN
      RAISE NOTICE '⚠️  Bahia existe mas parent está incorreto. Corrigindo...';
      
      UPDATE locations
      SET parent_id = v_brasil_id,
          full_name = 'Bahia, Brasil',
          updated_at = NOW()
      WHERE id = v_bahia_id;
      
      RAISE NOTICE '✅ Bahia corrigida: %', v_bahia_id;
    ELSE
      RAISE NOTICE '✅ Bahia já existe com parent correto: %', v_bahia_id;
    END IF;
  END IF;
  
  -- ============================================================
  -- 3. VERIFICAR E CRIAR/CORRIGIR SALVADOR (CITY)
  -- ============================================================
  SELECT id INTO v_salvador_id 
  FROM locations 
  WHERE type = 'city' AND (slug = 'salvador' OR name ILIKE '%salvador%')
  LIMIT 1;
  
  IF v_salvador_id IS NULL THEN
    RAISE NOTICE '❌ Salvador não existe. Criando...';
    
    INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      'Salvador',
      'Salvador, Bahia, Brasil',
      'salvador',
      'city',
      v_bahia_id,
      'active',
      '{"population": 2900000, "capital": true}'::jsonb
    )
    RETURNING id INTO v_salvador_id;
    
    RAISE NOTICE '✅ Salvador criada: %', v_salvador_id;
  ELSE
    -- Verificar se parent está correto
    SELECT COUNT(*) INTO v_count
    FROM locations
    WHERE id = v_salvador_id AND parent_id = v_bahia_id;
    
    IF v_count = 0 THEN
      RAISE NOTICE '⚠️  Salvador existe mas parent está incorreto. Corrigindo...';
      
      UPDATE locations
      SET parent_id = v_bahia_id,
          full_name = 'Salvador, Bahia, Brasil',
          updated_at = NOW()
      WHERE id = v_salvador_id;
      
      RAISE NOTICE '✅ Salvador corrigida: %', v_salvador_id;
    ELSE
      RAISE NOTICE '✅ Salvador já existe com parent correto: %', v_salvador_id;
    END IF;
  END IF;
  
  -- ============================================================
  -- 4. CRIAR/ATUALIZAR BAIRROS (DISTRICTS)
  -- ============================================================
  RAISE NOTICE '=== PROCESSANDO BAIRROS ===';
  
  -- Itaigara
  INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
  VALUES (
    '00000000-0000-0000-0000-000000000003',
    'Itaigara',
    'Itaigara, Salvador, Bahia, Brasil',
    'itaigara',
    'district',
    v_salvador_id,
    'active',
    '{"zone": "Orla", "upscale": true}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    full_name = EXCLUDED.full_name,
    type = EXCLUDED.type,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Itaigara processado';
  
  -- Pelourinho
  INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
  VALUES (
    '00000000-0000-0000-0000-000000000004',
    'Pelourinho',
    'Pelourinho, Salvador, Bahia, Brasil',
    'pelourinho',
    'district',
    v_salvador_id,
    'active',
    '{"zone": "Centro Histórico", "unesco_heritage": true, "tourist_area": true}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    full_name = EXCLUDED.full_name,
    type = EXCLUDED.type,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Pelourinho processado';
  
  -- Barra
  INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
  VALUES (
    '00000000-0000-0000-0000-000000000005',
    'Barra',
    'Barra, Salvador, Bahia, Brasil',
    'barra',
    'district',
    v_salvador_id,
    'active',
    '{"zone": "Orla", "beach": true, "lighthouse": true}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    full_name = EXCLUDED.full_name,
    type = EXCLUDED.type,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Barra processado';
  
  -- Rio Vermelho
  INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
  VALUES (
    '00000000-0000-0000-0000-000000000006',
    'Rio Vermelho',
    'Rio Vermelho, Salvador, Bahia, Brasil',
    'rio-vermelho',
    'district',
    v_salvador_id,
    'active',
    '{"zone": "Orla", "bohemian": true, "nightlife": true}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    full_name = EXCLUDED.full_name,
    type = EXCLUDED.type,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Rio Vermelho processado';
  
  -- ============================================================
  -- 5. VERIFICAR RESULTADO FINAL
  -- ============================================================
  RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
  
  SELECT COUNT(*) INTO v_count FROM locations WHERE type = 'country';
  RAISE NOTICE 'Countries: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM locations WHERE type = 'state';
  RAISE NOTICE 'States: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM locations WHERE type = 'city';
  RAISE NOTICE 'Cities: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM locations WHERE type = 'district';
  RAISE NOTICE 'Districts: %', v_count;
  
  RAISE NOTICE '=== CORREÇÃO CONCLUÍDA ===';
END $$;

-- ============================================================
-- VERIFICAR RESULTADO
-- ============================================================
SELECT 
  id,
  name,
  type,
  geographic_path,
  (SELECT type FROM locations p WHERE p.id = l.parent_id) as parent_type
FROM locations l
ORDER BY geographic_path;
