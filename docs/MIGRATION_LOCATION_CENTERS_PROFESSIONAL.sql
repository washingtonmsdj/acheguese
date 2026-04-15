-- ============================================================================
-- MIGRATION: Professional Location Centers System
-- Description: Sistema profissional AAA para garantir coordenadas em todos locations
-- Author: Location System
-- Date: 2026-04-05
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNÇÃO DE VALIDAÇÃO
-- ============================================================================

-- Função para validar se metadata tem coordenadas válidas
CREATE OR REPLACE FUNCTION validate_location_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para city e district (country e state são opcionais)
  IF NEW.type IN ('city', 'district') THEN
    -- Verificar se coordenadas existem
    IF (NEW.metadata->>'center_latitude') IS NULL OR 
       (NEW.metadata->>'center_longitude') IS NULL THEN
      RAISE EXCEPTION 'Location do tipo % requer center_latitude e center_longitude na metadata', NEW.type
        USING HINT = 'Adicione coordenadas válidas: {"center_latitude": -12.971111, "center_longitude": -38.510833}';
    END IF;
    
    -- Validar se são números válidos
    BEGIN
      IF (NEW.metadata->>'center_latitude')::NUMERIC NOT BETWEEN -90 AND 90 THEN
        RAISE EXCEPTION 'center_latitude deve estar entre -90 e 90';
      END IF;
      IF (NEW.metadata->>'center_longitude')::NUMERIC NOT BETWEEN -180 AND 180 THEN
        RAISE EXCEPTION 'center_longitude deve estar entre -180 e 180';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Coordenadas inválidas na metadata: center_latitude e center_longitude devem ser números válidos';
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 2: TRIGGER PARA VALIDAÇÃO (desabilitado inicialmente para backfill)
-- ============================================================================

-- Criar trigger (inicialmente desabilitado)
DROP TRIGGER IF EXISTS trg_validate_location_coordinates ON locations;

-- Comentário: O trigger será habilitado após o backfill
COMMENT ON FUNCTION validate_location_coordinates() IS 
'Valida que locations do tipo city e district tenham coordenadas válidas na metadata. Trigger será habilitado após backfill inicial.';

-- ============================================================================
-- PARTE 3: FUNÇÃO DE GEOCODING AUTOMÁTICO (para integração futura)
-- ============================================================================

-- Função para obter coordenadas aproximadas baseadas no parent
CREATE OR REPLACE FUNCTION get_inherited_coordinates(p_parent_id UUID)
RETURNS TABLE(lat NUMERIC, lng NUMERIC) AS $$
BEGIN
  -- Buscar coordenadas do parent (cidade ou estado)
  RETURN QUERY
  SELECT 
    (metadata->>'center_latitude')::NUMERIC,
    (metadata->>'center_longitude')::NUMERIC
  FROM locations
  WHERE id = p_parent_id
    AND (metadata->>'center_latitude') IS NOT NULL
    AND (metadata->>'center_longitude') IS NOT NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para auto-preencher coordenadas de novos locations (fallback para parent)
CREATE OR REPLACE FUNCTION auto_populate_location_coordinates()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_lat NUMERIC;
  v_parent_lng NUMERIC;
BEGIN
  -- Se já tem coordenadas, não fazer nada
  IF (NEW.metadata->>'center_latitude') IS NOT NULL AND 
     (NEW.metadata->>'center_longitude') IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Para city e district, tentar herdar do parent
  IF NEW.type IN ('city', 'district') AND NEW.parent_id IS NOT NULL THEN
    SELECT lat, lng INTO v_parent_lat, v_parent_lng
    FROM get_inherited_coordinates(NEW.parent_id);
    
    IF v_parent_lat IS NOT NULL AND v_parent_lng IS NOT NULL THEN
      -- Adicionar pequena variação para não sobrepor exatamente
      NEW.metadata = NEW.metadata || jsonb_build_object(
        'center_latitude', v_parent_lat + (random() * 0.01 - 0.005),
        'center_longitude', v_parent_lng + (random() * 0.01 - 0.005),
        'coordinates_source', 'inherited_from_parent',
        'coordinates_needs_refinement', true
      );
      
      RAISE NOTICE 'Auto-populated coordinates for % from parent (needs refinement)', NEW.name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-população (sempre ativo)
DROP TRIGGER IF EXISTS trg_auto_populate_location_coordinates ON locations;
CREATE TRIGGER trg_auto_populate_location_coordinates
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_location_coordinates();

COMMENT ON FUNCTION auto_populate_location_coordinates() IS 
'Auto-popula coordenadas de novos locations herdando do parent quando não fornecidas. Marca como needs_refinement para posterior geocoding preciso.';

-- ============================================================================
-- PARTE 4: VIEW PARA MONITORAMENTO
-- ============================================================================

CREATE OR REPLACE VIEW locations_coordinates_status AS
SELECT 
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (metadata->>'center_latitude') IS NOT NULL) as with_coordinates,
  COUNT(*) FILTER (WHERE (metadata->>'center_latitude') IS NULL) as missing_coordinates,
  COUNT(*) FILTER (WHERE (metadata->>'coordinates_needs_refinement')::boolean = true) as needs_refinement,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE (metadata->>'center_latitude') IS NOT NULL) / COUNT(*),
    2
  ) as coverage_percentage
FROM locations
GROUP BY type
ORDER BY type;

COMMENT ON VIEW locations_coordinates_status IS 
'Monitoramento de cobertura de coordenadas por tipo de location';

-- ============================================================================
-- PARTE 5: FUNÇÃO PARA BACKFILL DE LOCATIONS SEM COORDENADAS
-- ============================================================================

CREATE OR REPLACE FUNCTION backfill_missing_coordinates()
RETURNS TABLE(
  location_id UUID,
  location_name TEXT,
  location_type TEXT,
  action TEXT
) AS $$
DECLARE
  v_location RECORD;
  v_parent_lat NUMERIC;
  v_parent_lng NUMERIC;
BEGIN
  -- Processar todos os locations sem coordenadas
  FOR v_location IN 
    SELECT id, name, type, parent_id, metadata
    FROM locations
    WHERE type IN ('city', 'district')
      AND (metadata->>'center_latitude') IS NULL
  LOOP
    -- Tentar herdar do parent
    IF v_location.parent_id IS NOT NULL THEN
      SELECT lat, lng INTO v_parent_lat, v_parent_lng
      FROM get_inherited_coordinates(v_location.parent_id);
      
      IF v_parent_lat IS NOT NULL AND v_parent_lng IS NOT NULL THEN
        -- Atualizar com coordenadas herdadas
        UPDATE locations
        SET metadata = metadata || jsonb_build_object(
          'center_latitude', v_parent_lat,
          'center_longitude', v_parent_lng,
          'coordinates_source', 'inherited_from_parent',
          'coordinates_needs_refinement', true
        )
        WHERE id = v_location.id;
        
        location_id := v_location.id;
        location_name := v_location.name;
        location_type := v_location.type;
        action := 'inherited_from_parent';
        RETURN NEXT;
      ELSE
        location_id := v_location.id;
        location_name := v_location.name;
        location_type := v_location.type;
        action := 'parent_missing_coordinates';
        RETURN NEXT;
      END IF;
    ELSE
      location_id := v_location.id;
      location_name := v_location.name;
      location_type := v_location.type;
      action := 'no_parent';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_missing_coordinates() IS 
'Preenche coordenadas faltantes herdando do parent. Retorna relatório de ações executadas.';

-- ============================================================================
-- PARTE 6: FUNÇÃO PARA HABILITAR VALIDAÇÃO ESTRITA
-- ============================================================================

CREATE OR REPLACE FUNCTION enable_strict_coordinate_validation()
RETURNS TEXT AS $$
BEGIN
  -- Verificar se há locations sem coordenadas
  IF EXISTS (
    SELECT 1 FROM locations 
    WHERE type IN ('city', 'district') 
      AND (metadata->>'center_latitude') IS NULL
  ) THEN
    RETURN 'ERRO: Ainda existem locations sem coordenadas. Execute backfill_missing_coordinates() primeiro.';
  END IF;
  
  -- Criar trigger de validação
  CREATE TRIGGER trg_validate_location_coordinates
    BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION validate_location_coordinates();
  
  RETURN 'Validação estrita habilitada com sucesso. Todos os novos locations do tipo city/district devem ter coordenadas.';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION enable_strict_coordinate_validation() IS 
'Habilita validação estrita que requer coordenadas em todos os locations do tipo city/district. Execute após backfill.';

-- ============================================================================
-- PARTE 7: EXECUTAR BACKFILL INICIAL
-- ============================================================================

DO $$
DECLARE
  v_result RECORD;
  v_total INTEGER := 0;
  v_success INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Iniciando backfill de coordenadas...';
  RAISE NOTICE '========================================';
  
  -- Executar backfill
  FOR v_result IN SELECT * FROM backfill_missing_coordinates() LOOP
    v_total := v_total + 1;
    
    IF v_result.action = 'inherited_from_parent' THEN
      v_success := v_success + 1;
      RAISE NOTICE '[OK] % (%) - herdou coordenadas do parent', v_result.location_name, v_result.location_type;
    ELSE
      v_failed := v_failed + 1;
      RAISE WARNING '[FALHA] % (%) - %', v_result.location_name, v_result.location_type, v_result.action;
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Backfill concluído:';
  RAISE NOTICE '  Total processado: %', v_total;
  RAISE NOTICE '  Sucesso: %', v_success;
  RAISE NOTICE '  Falhas: %', v_failed;
  RAISE NOTICE '========================================';
  
  -- Mostrar status atual
  RAISE NOTICE '';
  RAISE NOTICE 'Status de cobertura de coordenadas:';
  FOR v_result IN SELECT * FROM locations_coordinates_status LOOP
    RAISE NOTICE '  % - %/%% (%/%)', 
      v_result.type, 
      v_result.coverage_percentage,
      v_result.with_coordinates,
      v_result.total;
  END LOOP;
END $$;

-- ============================================================================
-- PARTE 8: INSTRUÇÕES FINAIS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Revise os locations que falharam no backfill';
  RAISE NOTICE '2. Adicione coordenadas manualmente ou via geocoding API';
  RAISE NOTICE '3. Execute: SELECT enable_strict_coordinate_validation();';
  RAISE NOTICE '4. A partir daí, todos os novos locations precisarão de coordenadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Monitoramento:';
  RAISE NOTICE '  SELECT * FROM locations_coordinates_status;';
  RAISE NOTICE '';
  RAISE NOTICE 'Locations que precisam refinamento:';
  RAISE NOTICE '  SELECT name, type FROM locations WHERE (metadata->>''coordinates_needs_refinement'')::boolean = true;';
  RAISE NOTICE '========================================';
END $$;
