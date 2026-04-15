-- ============================================================================
-- SEED FIXTURES DETERMINÍSTICAS - FASE 2
-- ============================================================================
-- Fixtures mínimas para validar expansão territorial e rejeição de grupos
-- IDs fixos, sem LIMIT 1, reproduzíveis

-- 0. Criar país (se não existir)
INSERT INTO locations (
  id,
  name,
  full_name,
  slug,
  geographic_path,
  type,
  parent_id,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Brasil',
  'Brasil',
  'brasil',
  '/brasil',
  'country',
  NULL,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 0.1. Criar estado (filho do país)
INSERT INTO locations (
  id,
  name,
  full_name,
  slug,
  geographic_path,
  type,
  parent_id,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Bahia',
  'Bahia, Brasil',
  'bahia',
  '/brasil/bahia',
  'state',
  '00000000-0000-0000-0000-000000000000',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 1. Criar cidade de teste (filha do estado)
INSERT INTO locations (
  id,
  name,
  full_name,
  slug,
  geographic_path,
  type,
  parent_id,
  status,
  metadata,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Salvador Teste Fase2',
  'Salvador Teste Fase2, BA',
  'salvador-teste-fase2',
  '/brasil/bahia/salvador-teste-fase2',
  'city',
  '00000000-0000-0000-0000-000000000010',
  'active',
  '{"center_latitude": -12.971111, "center_longitude": -38.510833}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar distrito 1 (filho da cidade)
INSERT INTO locations (
  id,
  name,
  full_name,
  slug,
  geographic_path,
  type,
  parent_id,
  status,
  metadata,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Barra Teste Fase2',
  'Barra Teste Fase2, Salvador Teste Fase2, BA',
  'barra-teste-fase2',
  '/brasil/bahia/salvador-teste-fase2/barra-teste-fase2',
  'district',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '{"center_latitude": -13.010000, "center_longitude": -38.520000}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Criar distrito 2 (filho da cidade)
INSERT INTO locations (
  id,
  name,
  full_name,
  slug,
  geographic_path,
  type,
  parent_id,
  status,
  metadata,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Pelourinho Teste Fase2',
  'Pelourinho Teste Fase2, Salvador Teste Fase2, BA',
  'pelourinho-teste-fase2',
  '/brasil/bahia/salvador-teste-fase2/pelourinho-teste-fase2',
  'district',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '{"center_latitude": -12.970000, "center_longitude": -38.510000}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Criar grupo territorial de teste
-- NOTA: O banco não suporta type='group' na constraint locations_type_check
-- Tipos válidos: country, state, city, district
-- Este INSERT será comentado pois group não é permitido
-- INSERT INTO locations (...) VALUES (..., 'group', ...) -- NÃO PERMITIDO

-- 5. Profile de teste não é necessário para validar expansão territorial
-- Pulando criação de profile pois user_id já possui profile pessoal

-- 6. Validar fixtures criadas
DO $$
DECLARE
  city_count INTEGER;
  district_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO city_count FROM locations WHERE id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO district_count FROM locations WHERE id IN ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
  
  RAISE NOTICE 'Fixtures criadas:';
  RAISE NOTICE '  - Cidade: % (esperado: 1)', city_count;
  RAISE NOTICE '  - Distritos: % (esperado: 2)', district_count;
  RAISE NOTICE '  - Grupo: 0 (type=group não é permitido pela constraint)';
  
  IF city_count <> 1 OR district_count <> 2 THEN
    RAISE EXCEPTION 'Falha ao criar fixtures. Verifique constraints e RLS.';
  END IF;
END $$;
