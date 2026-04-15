-- =============================================================================
-- Migration: Adicionar subcategoria "outros" para categoria "outros"
-- Data: 2026-03-30
--
-- OBJETIVO:
--   Corrigir migration anterior que não criou subcategoria padrão
-- =============================================================================

-- Adicionar subcategoria "outros" para a categoria "outros"
INSERT INTO classified_subcategories (category_id, slug, name, order_num)
SELECT id, 'outros', 'Outros', 1 
  FROM classified_categories 
 WHERE slug = 'outros'
ON CONFLICT DO NOTHING;

-- Validar
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM classified_subcategories s
    JOIN classified_categories c ON s.category_id = c.id
   WHERE c.slug = 'outros' AND s.slug = 'outros';
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Falha ao criar subcategoria "outros" para categoria "outros"';
  END IF;
  
  RAISE NOTICE '✅ Subcategoria "outros" criada com sucesso';
END $$;
