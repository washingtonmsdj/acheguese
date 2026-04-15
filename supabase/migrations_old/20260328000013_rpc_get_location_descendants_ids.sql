-- Migration: Add RPC to get location descendant IDs
-- Description: Returns array of location IDs including parent and all descendants
-- Author: Kiro AI
-- Date: 2026-03-28

/**
 * rpc_get_location_descendants_ids
 * 
 * Retorna array de UUIDs incluindo o location_id + todos os descendentes
 * Usado para queries hierárquicas (ex: buscar empresas em Salvador inclui todos bairros)
 * 
 * @param p_location_id - UUID da localização pai
 * @returns Array de UUIDs (location + todos descendentes)
 * 
 * Exemplo:
 *   SELECT * FROM rpc_get_location_descendants_ids('salvador-uuid')
 *   → ['salvador-uuid', 'nordeste-amaralina-uuid', 'pituba-uuid', ...]
 */
CREATE OR REPLACE FUNCTION rpc_get_location_descendants_ids(p_location_id UUID)
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
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION rpc_get_location_descendants_ids(UUID) IS 
  'RPC: Retorna array com location_id + todos os descendentes (recursivo) para queries hierárquicas';
