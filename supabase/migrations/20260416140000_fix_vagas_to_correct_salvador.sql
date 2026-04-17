-- ══════════════════════════════════════════════════════════════════════════
-- FIX VAGAS TO CORRECT SALVADOR
-- ══════════════════════════════════════════════════════════════════════════

-- Atualizar vagas para o Salvador correto (não o de teste)
UPDATE vagas 
SET location_id = '63c41c29-adce-40f5-a552-e52d176123c3'
WHERE location_id = '00000000-0000-0000-0000-000000000001';
