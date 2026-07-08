-- Add default pizza addons for Pizzaria Bella Napoli.

DO $$
DECLARE
  v_business_id UUID;
  v_pizza_item RECORD;
BEGIN
  SELECT bd.id INTO v_business_id
  FROM business_data bd
  WHERE bd.slug = 'pizzaria-bella-napoli'
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE NOTICE 'Pizzaria Bella Napoli not found. Skipping migration.';
    RETURN;
  END IF;

  FOR v_pizza_item IN
    SELECT mi.id, mi.name
    FROM menu_items mi
    JOIN menu_categories mc ON mi.category_id = mc.id
    JOIN menus m ON mc.menu_id = m.id
    WHERE m.business_id = v_business_id
      AND mc.name ILIKE '%pizza%'
      AND mi.is_available = true
  LOOP
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

    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Milho',
      'Milho verde em graos',
      3.00,
      3,
      true,
      1
    )
    ON CONFLICT DO NOTHING;

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

    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Azeitona',
      'Azeitona preta sem caroco',
      2.50,
      3,
      true,
      3
    )
    ON CONFLICT DO NOTHING;

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

    INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
    VALUES (
      gen_random_uuid(),
      v_pizza_item.id,
      'Oregano',
      'Oregano seco temperado',
      1.00,
      1,
      true,
      6
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Pizza addons added for Pizzaria Bella Napoli.';
END $$;
