-- Migration: Create locations triggers and validation functions
-- Description: Validação de hierarquia, prevenção de ciclos e atualização automática de path
-- Author: Geographic Foundation
-- Date: 2026-03-24

-- 1. Validar hierarquia de locations
CREATE OR REPLACE FUNCTION validate_location_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_type TEXT;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT type INTO v_parent_type FROM locations WHERE id = NEW.parent_id;
    
    IF v_parent_type IS NULL THEN
      RAISE EXCEPTION 'Parent location not found';
    END IF;
    
    -- Validar hierarquia válida
    IF (NEW.type = 'state' AND v_parent_type != 'country') OR
       (NEW.type = 'city' AND v_parent_type != 'state') OR
       (NEW.type = 'district' AND v_parent_type != 'city') THEN
      RAISE EXCEPTION 'Invalid hierarchy: % cannot be child of %', NEW.type, v_parent_type;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_hierarchy
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION validate_location_hierarchy();

-- 2. Prevenir ciclos na hierarquia
CREATE OR REPLACE FUNCTION prevent_location_cycles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NEW.id IS NOT NULL THEN
    -- Verificar se parent_id não é descendente de NEW.id
    IF EXISTS (
      WITH RECURSIVE ancestors AS (
        SELECT id, parent_id FROM locations WHERE id = NEW.parent_id
        UNION ALL
        SELECT l.id, l.parent_id FROM locations l
        INNER JOIN ancestors a ON l.id = a.parent_id
      )
      SELECT 1 FROM ancestors WHERE id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reference detected in location hierarchy';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_cycles
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_location_cycles();

-- 3. Atualizar geographic_path automaticamente (ÚNICO PONTO DE VERDADE)
CREATE OR REPLACE FUNCTION update_geographic_path()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.geographic_path := '/' || NEW.slug;
  ELSE
    SELECT geographic_path INTO v_parent_path FROM locations WHERE id = NEW.parent_id;
    
    IF v_parent_path IS NULL THEN
      RAISE EXCEPTION 'Parent location path not found';
    END IF;
    
    NEW.geographic_path := v_parent_path || '/' || NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_path
  BEFORE INSERT OR UPDATE OF parent_id, slug ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_geographic_path();

-- Comentários
COMMENT ON FUNCTION validate_location_hierarchy() IS 'Valida hierarquia: state->country, city->state, district->city';
COMMENT ON FUNCTION prevent_location_cycles() IS 'Previne referências circulares na hierarquia';
COMMENT ON FUNCTION update_geographic_path() IS 'Atualiza geographic_path automaticamente (SSOT)';
