-- ============================================================================
-- MIGRATION: Adicionar extras/toppings às pizzas da Pizzaria Bella Napoli
-- ============================================================================
-- Adiciona adicionais comuns de pizza: cebola, milho, bacon, etc.
-- aos itens de pizza do cardápio da Bella Napoli.
-- ============================================================================

DO $
DECLARE
  v_business_id UUID;
  v_pizza_item RECORD;
BEGIN
  -- Encontra o business_id da Bella Napoli
  SELECT bd.id INTO v_business_id
  FROM business_data bd
  WHERE bd.slug = 'pizzaria-bella-napoli'
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE NOTICE 'Pizzaria Bella Napoli não encontrada. Pulando migração.';
    RETURN;
  END IF;

  -- Para cada item de pizza da Bella Napoli, adiciona os extras padrão
  FOR v_pizza_item IN
    SELECT mi.id, mi.name
    FROM menu_items mi
    JOIN menu_categories mc ON mi.category_id = mc.id
    JOIN menus m ON mc.menu_id = m.id
    WHERE m.business_id = v_business_id
      AND mc.name ILIKE '%pizza%'
      AND mi.is_available = true
  LOOP
    -- Adiciona extras padrão para cada pizza
    
    -- Cebola (R$ 3,00)
    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Cebola',
      'Cebola roxa em fatias',
      3.00,
      3,
      true,
      0
    )
    ON CONFLICT DO NOTHING;

    -- Milho (R$ 3,00)
    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Milho',
      'Milho verde em grãos',
      3.00,
      3,
      true,
      1
    )
    ON CONFLICT DO NOTHING;

    -- Bacon (R$ 5,00)
    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Bacon',
      'Bacon em cubos crocantes',
      5.00,
      3,
      true,
      2
    )
    ON CONFLICT DO NOTHING;

    -- Azeitona (R$ 2,50)
    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Azeitona',
      'Azeitona preta sem caroço',
      2.50,
      3,
      true,
      3
    )
    ON CONFLICT DO NOTHING;

    -- Tomate (R$ 2,50)
    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Tomate',
      'Tomate cereja fatiado',
      2.50,
      3,
      true,
      4
    )
    ON CONFLICT DO NOTHING;

    -- Catupiry Extra (R$ 6,00)
    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Catupiry Extra',
      'Creme de catupiry cremoso',
      6.00,
      2,
      true,
      5
    )
    ON CONFLICT DO NOTHING;

    -- Orégano (R$ 1,00)
    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Orégano',
      'Orégano seco temperado',
      1.00,
      1,
      true,
      6
    )
    ON CONFLICT DO NOTHING;

  END LOOP;

  RAISE NOTICE 'Extras de pizza adicionados para a Pizzaria Bella Napoli.';
END $;
