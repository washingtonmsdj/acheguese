-- Migration: Update territorial group ID to match what the app expects
-- Date: 2026-03-25

DO $$
DECLARE
  v_old_id UUID := '57a5a11e-0f55-48c0-a9c2-1a455c370d2f';
  v_new_id UUID := 'fc322564-17cf-4de0-95f1-d78672750e8d';
  v_count INTEGER;
BEGIN
  -- Check if group with old ID exists
  SELECT COUNT(*) INTO v_count FROM territorial_groups WHERE id = v_old_id;
  
  IF v_count > 0 THEN
    -- Update the group ID
    UPDATE territorial_groups 
    SET id = v_new_id 
    WHERE id = v_old_id;
    
    -- Update group members
    UPDATE territorial_group_members 
    SET group_id = v_new_id 
    WHERE group_id = v_old_id;
    
    RAISE NOTICE 'Grupo ID atualizado de % para %', v_old_id, v_new_id;
  ELSE
    RAISE NOTICE 'Grupo com ID % não encontrado', v_old_id;
  END IF;
END $$;