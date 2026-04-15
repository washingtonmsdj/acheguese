-- Migration: Fix RPC to handle groups correctly
-- Description: Updates rpc_get_location_descendants_ids to support groups via location_groups table
-- Author: Kiro AI
-- Date: 2026-03-28

/**
 * rpc_get_location_descendants_ids (VERSÃO 2 - SUPORTA GRUPOS)
 * 
 * Retorna array de UUIDs incluindo o location_id + todos os descendentes
 * 
 * COMPORTAMENTO:
 * - Se location é um GROUP → retorna os membros da tabela location_groups
 * - Se location é CITY/DISTRICT → retorna location + descendentes via parent_id (hierárquico)
 * 
 * @param p_location_id - UUID da localização ou grupo
 * @returns Array de UUIDs
 * 
 * Exemplos:
 *   -- Cidade (hierárquico)
 *   SELECT * FROM rpc_get_location_descendants_ids('salvador-uuid')
 *   → ['salvador-uuid', 'nordeste-amaralina-uuid', 'pituba-uuid', ...]
 * 
 *   -- Grupo (membros)
 *   SELECT * FROM rpc_get_location_descendants_ids('complexo-do-nordeste-uuid')
 *   → ['nordeste-amaralina-uuid', 'vale-das-pedrinhas-uuid', 'santa-cruz-uuid', 'chapada-rio-vermelho-uuid']
 */
CREATE OR REPLACE FUNCTION rpc_get_location_descendants_ids(p_location_id UUID)
RETURNS UUID[] AS $$
DECLARE
  v_is_group BOOLEAN;
  v_result UUID[];
BEGIN
  -- Verificar se o ID é um grupo territorial
  SELECT EXISTS(
    SELECT 1 FROM territorial_groups WHERE id = p_location_id
  ) INTO v_is_group;

  -- Se é um GRUPO → retornar apenas os membros (não o grupo em si)
  IF v_is_group THEN
    SELECT ARRAY_AGG(location_id)
    INTO v_result
    FROM territorial_group_members
    WHERE group_id = p_location_id;
    
    RETURN COALESCE(v_result, ARRAY[]::UUID[]);
  END IF;

  -- Se é LOCATION (city/district) → busca hierárquica via parent_id
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
  SELECT ARRAY_AGG(id) INTO v_result FROM descendants;
  
  RETURN COALESCE(v_result, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION rpc_get_location_descendants_ids(UUID) IS 
  'RPC v2: Retorna descendentes hierárquicos (parent_id) ou membros de grupo (location_groups)';
