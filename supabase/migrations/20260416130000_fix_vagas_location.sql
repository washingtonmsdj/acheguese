-- ══════════════════════════════════════════════════════════════════════════
-- FIX VAGAS LOCATION — Atualizar para Salvador
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Descrição: Atualiza location_id das vagas para Salvador
--            Corrige problema de filtro territorial
-- 
-- Autor: Sistema de Auditoria SSOT
-- Data: 2026-04-16
-- 
-- ══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  salvador_id UUID;
  vagas_count INTEGER;
BEGIN
  -- Buscar ID de Salvador
  SELECT id INTO salvador_id 
  FROM locations 
  WHERE name ILIKE '%salvador%' 
  LIMIT 1;

  IF salvador_id IS NULL THEN
    RAISE NOTICE '⚠️  Salvador não encontrado em locations';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Salvador encontrado: %', salvador_id;

  -- Atualizar todas as vagas para Salvador
  UPDATE vagas 
  SET location_id = salvador_id
  WHERE location_id != salvador_id;

  GET DIAGNOSTICS vagas_count = ROW_COUNT;

  RAISE NOTICE '✅ % vagas atualizadas para Salvador', vagas_count;

END $$;
