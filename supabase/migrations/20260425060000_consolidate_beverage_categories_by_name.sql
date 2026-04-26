-- ============================================================================
-- Consolida categorias de bebidas por NOME (não por id)
-- ----------------------------------------------------------------------------
-- A migration anterior (20260425050000) consolidava por id determinístico do
-- seed. Os dados de produção da Bella Napoli (e outros estabelecimentos) foram
-- inseridos via scripts/complete-bella-menu.mjs com UUIDs aleatórios — então
-- aquela migration foi no-op para os itens reais.
--
-- Esta migration percorre todos os menus que tenham qualquer categoria
-- "Refrigerantes", "Sucos e Águas", "Cervejas" ou "Vinhos" e:
--   1. Pega (ou promove) UMA categoria "Bebidas" por menu.
--   2. Reaponta todos os itens para essa categoria.
--   3. Remove as categorias antigas órfãs.
--
-- Idempotente: rodar múltiplas vezes não causa efeito colateral.
-- ============================================================================

DO $$
DECLARE
  v_menu_id        UUID;
  v_target_id      UUID;
  v_old_ids        UUID[];
  v_target_order   INTEGER;
BEGIN
  FOR v_menu_id IN
    SELECT DISTINCT menu_id
      FROM menu_categories
     WHERE name IN ('Refrigerantes', 'Sucos e Águas', 'Cervejas', 'Vinhos', 'Bebidas')
  LOOP
    -- 1. Já existe uma categoria "Bebidas" neste menu?
    SELECT id INTO v_target_id
      FROM menu_categories
     WHERE menu_id = v_menu_id
       AND name    = 'Bebidas'
     LIMIT 1;

    -- 2. Senão, promove a categoria de menor display_order entre as antigas.
    IF v_target_id IS NULL THEN
      SELECT id, display_order
        INTO v_target_id, v_target_order
        FROM menu_categories
       WHERE menu_id = v_menu_id
         AND name IN ('Refrigerantes', 'Sucos e Águas', 'Cervejas', 'Vinhos')
       ORDER BY display_order, name
       LIMIT 1;

      IF v_target_id IS NOT NULL THEN
        UPDATE menu_categories
           SET name        = 'Bebidas',
               description = 'Refrigerantes, sucos, águas, cervejas e vinhos'
         WHERE id = v_target_id;
      END IF;
    END IF;

    -- 3. Sem categoria-alvo nada a fazer neste menu.
    CONTINUE WHEN v_target_id IS NULL;

    -- 4. Reaponta itens das demais categorias de bebidas para a alvo.
    SELECT array_agg(id) INTO v_old_ids
      FROM menu_categories
     WHERE menu_id = v_menu_id
       AND name IN ('Refrigerantes', 'Sucos e Águas', 'Cervejas', 'Vinhos')
       AND id <> v_target_id;

    IF v_old_ids IS NOT NULL THEN
      UPDATE menu_items
         SET category_id = v_target_id
       WHERE category_id = ANY(v_old_ids);

      DELETE FROM menu_categories
       WHERE id = ANY(v_old_ids);
    END IF;

    -- Reseta a variável para a próxima iteração.
    v_target_id := NULL;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Cleanup adicional: itens em que `description = name` (poluição inserida
-- pelo script complete-bella-menu.mjs nas bebidas) têm a descrição zerada
-- para que o `<SheetDescription>` não mostre o nome duplicado no modal.
-- ----------------------------------------------------------------------------
UPDATE menu_items
   SET description = NULL
 WHERE description IS NOT NULL
   AND description = name;

