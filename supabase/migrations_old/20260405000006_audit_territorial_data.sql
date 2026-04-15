-- ============================================
-- AUDITORIA TERRITORIAL - Análise de Dados
-- Data: 2026-04-05
-- Descrição: Identifica registros sem location_id válido
-- ============================================

-- Função auxiliar para contar registros sem location_id por tabela
CREATE OR REPLACE FUNCTION audit_territorial_coverage()
RETURNS TABLE (
  table_name TEXT,
  total_records BIGINT,
  with_location_id BIGINT,
  without_location_id BIGINT,
  coverage_percent NUMERIC(5,2)
) AS $$
BEGIN
  -- Profiles
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(location_id)::BIGINT,
    COUNT(*) FILTER (WHERE location_id IS NULL)::BIGINT,
    ROUND((COUNT(location_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
  FROM profiles;

  -- Posts
  RETURN QUERY
  SELECT 
    'posts'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(location_id)::BIGINT,
    COUNT(*) FILTER (WHERE location_id IS NULL)::BIGINT,
    ROUND((COUNT(location_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
  FROM posts;

  -- Community Issues
  RETURN QUERY
  SELECT 
    'community_issues'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(location_id)::BIGINT,
    COUNT(*) FILTER (WHERE location_id IS NULL)::BIGINT,
    ROUND((COUNT(location_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
  FROM community_issues;

  -- Businesses
  RETURN QUERY
  SELECT 
    'businesses'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(location_id)::BIGINT,
    COUNT(*) FILTER (WHERE location_id IS NULL)::BIGINT,
    ROUND((COUNT(location_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
  FROM businesses;

  -- Classifieds
  RETURN QUERY
  SELECT 
    'classifieds'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(location_id)::BIGINT,
    COUNT(*) FILTER (WHERE location_id IS NULL)::BIGINT,
    ROUND((COUNT(location_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
  FROM classifieds;

  -- Tourist Points
  RETURN QUERY
  SELECT 
    'tourist_points'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(location_id)::BIGINT,
    COUNT(*) FILTER (WHERE location_id IS NULL)::BIGINT,
    ROUND((COUNT(location_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
  FROM tourist_points;

  -- Community Alerts
  RETURN QUERY
  SELECT 
    'community_alerts'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(location_id)::BIGINT,
    COUNT(*) FILTER (WHERE location_id IS NULL)::BIGINT,
    ROUND((COUNT(location_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
  FROM community_alerts;

END;
$$ LANGUAGE plpgsql;

-- Executar auditoria
SELECT * FROM audit_territorial_coverage();

-- ============================================
-- Análise de Dados Territoriais Inválidos
-- ============================================

-- Profiles com city/neighborhood mas sem location_id
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM profiles
  WHERE (city IS NOT NULL OR neighborhood IS NOT NULL)
  AND location_id IS NULL;

  RAISE NOTICE 'Profiles com city/neighborhood mas sem location_id: %', invalid_count;
END $$;

-- Posts com city/neighborhood mas sem location_id
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM posts
  WHERE (city IS NOT NULL OR neighborhood IS NOT NULL)
  AND location_id IS NULL;

  RAISE NOTICE 'Posts com city/neighborhood mas sem location_id: %', invalid_count;
END $$;

-- ============================================
-- Identificar Valores Únicos de city/neighborhood
-- ============================================

-- Cidades únicas em profiles
DO $$
DECLARE
  unique_cities TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT city ORDER BY city) INTO unique_cities
  FROM profiles
  WHERE city IS NOT NULL;

  RAISE NOTICE 'Cidades únicas em profiles: %', array_length(unique_cities, 1);
  RAISE NOTICE 'Exemplos: %', unique_cities[1:10];
END $$;

-- Bairros únicos em profiles
DO $$
DECLARE
  unique_neighborhoods TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT neighborhood ORDER BY neighborhood) INTO unique_neighborhoods
  FROM profiles
  WHERE neighborhood IS NOT NULL
  LIMIT 20;

  RAISE NOTICE 'Bairros únicos em profiles (primeiros 20): %', unique_neighborhoods;
END $$;

-- ============================================
-- Verificar Integridade de location_id Existentes
-- ============================================

-- Profiles com location_id inválido (não existe em locations)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM profiles p
  WHERE p.location_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = p.location_id
  );

  RAISE NOTICE 'Profiles com location_id inválido: %', invalid_count;
END $$;

-- Posts com location_id inválido
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM posts p
  WHERE p.location_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = p.location_id
  );

  RAISE NOTICE 'Posts com location_id inválido: %', invalid_count;
END $$;

-- ============================================
-- Resumo Final
-- ============================================

DO $$
DECLARE
  total_tables INTEGER := 7;
  tables_with_location_id INTEGER;
  tables_with_not_null INTEGER;
BEGIN
  -- Contar tabelas que têm coluna location_id
  SELECT COUNT(*) INTO tables_with_location_id
  FROM information_schema.columns
  WHERE column_name = 'location_id'
  AND table_name IN ('profiles', 'posts', 'community_issues', 'businesses', 'classifieds', 'tourist_points', 'community_alerts');

  -- Contar tabelas onde location_id é NOT NULL
  SELECT COUNT(*) INTO tables_with_not_null
  FROM information_schema.columns
  WHERE column_name = 'location_id'
  AND is_nullable = 'NO'
  AND table_name IN ('profiles', 'posts', 'community_issues', 'businesses', 'classifieds', 'tourist_points', 'community_alerts');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO DA AUDITORIA TERRITORIAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabelas críticas analisadas: %', total_tables;
  RAISE NOTICE 'Tabelas com coluna location_id: %', tables_with_location_id;
  RAISE NOTICE 'Tabelas com location_id NOT NULL: %', tables_with_not_null;
  RAISE NOTICE 'Cobertura: % de %', tables_with_location_id, total_tables;
  RAISE NOTICE '========================================';
END $$;
