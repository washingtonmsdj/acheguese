-- Migration: Add function to get location descendants
-- Description: Recursive function to get all child locations for hierarchical queries
-- Author: Kiro AI
-- Date: 2026-03-28

/**
 * get_location_descendants
 * 
 * Retorna todos os IDs de descendentes de uma localização (recursivo)
 * Inclui o próprio location_id no resultado
 * 
 * Exemplo:
 *   Salvador (city) → retorna [salvador_id, nordeste_amaralina_id, pituba_id, ...]
 *   Nordeste de Amaralina (district) → retorna [nordeste_amaralina_id]
 * 
 * Uso em queries:
 *   WHERE location_id = ANY(get_location_descendants('uuid-here'))
 */
CREATE OR REPLACE FUNCTION get_location_descendants(p_location_id UUID)
RETURNS UUID[] AS $$
  WITH RECURSIVE descendants AS (
    -- Base: o próprio location
    SELECT id
    FROM locations
    WHERE id = p_location_id
    
    UNION ALL
    
    -- Recursivo: todos os filhos
    SELECT l.id
    FROM locations l
    INNER JOIN descendants d ON l.parent_id = d.id
  )
  SELECT ARRAY_AGG(id) FROM descendants;
$$ LANGUAGE SQL STABLE;

-- Comentário
COMMENT ON FUNCTION get_location_descendants(UUID) IS 
  'Retorna array com location_id + todos os descendentes (recursivo)';
