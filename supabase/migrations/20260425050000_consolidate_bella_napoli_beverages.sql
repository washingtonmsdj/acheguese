-- ============================================================================
-- Consolida categorias de bebidas do seed Bella Napoli em uma única "Bebidas"
-- ----------------------------------------------------------------------------
-- O seed criava 4 abas separadas no cardápio público (Refrigerantes, Sucos
-- e Águas, Cervejas, Vinhos), o que poluía o `CategoryNav` da página de
-- detalhe. Esta migração consolida tudo em uma única categoria "Bebidas"
-- (id `...225`), reaponta os itens e remove as 3 categorias órfãs.
--
-- Idempotente: se já tiver sido aplicada (categorias antigas já não
-- existirem), o UPDATE/DELETE são no-op.
-- ============================================================================

-- 1. Renomeia a categoria 225 (antiga "Refrigerantes") para "Bebidas".
UPDATE menu_categories
   SET name        = 'Bebidas',
       description = 'Refrigerantes, sucos, águas, cervejas e vinhos',
       display_order = 4
 WHERE id = 'c2222222-2222-2222-2222-222222222225';

-- 2. Reaponta itens das antigas categorias para a categoria consolidada.
UPDATE menu_items
   SET category_id = 'c2222222-2222-2222-2222-222222222225'
 WHERE category_id IN (
   'c2222222-2222-2222-2222-222222222226',  -- Sucos e Águas
   'c2222222-2222-2222-2222-222222222227',  -- Cervejas
   'c2222222-2222-2222-2222-222222222228'   -- Vinhos
 );

-- 3. Remove categorias órfãs.
DELETE FROM menu_categories
 WHERE id IN (
   'c2222222-2222-2222-2222-222222222226',
   'c2222222-2222-2222-2222-222222222227',
   'c2222222-2222-2222-2222-222222222228'
 );

-- 4. Reposiciona "Sobremesas" logo após "Bebidas".
UPDATE menu_categories
   SET display_order = 5
 WHERE id = 'c2222222-2222-2222-2222-222222222229';
