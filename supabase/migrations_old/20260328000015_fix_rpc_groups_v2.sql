-- Migration: Fix RPC to handle territorial groups correctly (v2)
-- Description: Force update of rpc_get_location_descendants_ids to use territorial_groups table
-- Author: Kiro AI
-- Date: 2026-03-28

DROP FUNCTION IF EXISTS rpc_get_location_descendants_ids(UUID);

CREATE FUNCTION rpc_get_location_descendants_ids(p_location_id UUID)
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

COMMENT ON FUNCTION rpc_get_location_descendants_ids(UUID) IS 
  'RPC v2: Retorna descendentes hierárquicos (parent_id) ou membros de grupo (territorial_group_members)';
