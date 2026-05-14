-- Seed idempotente de eventos demo (mock ativo) para validação com investidor.
-- Atualiza/insere 2 eventos canônicos na tabela `events`.

DO $$
DECLARE
  v_location_id UUID;
  v_organizer_profile_id UUID;
BEGIN
  -- 1) Resolver location_id preferindo Nordeste de Amaralina; fallback Salvador.
  SELECT id INTO v_location_id
  FROM locations
  WHERE type = 'district' AND slug = 'nordeste-de-amaralina'
  LIMIT 1;

  IF v_location_id IS NULL THEN
    SELECT id INTO v_location_id
    FROM locations
    WHERE type = 'city' AND slug = 'salvador'
    LIMIT 1;
  END IF;

  IF v_location_id IS NULL THEN
    SELECT id INTO v_location_id
    FROM locations
    LIMIT 1;
  END IF;

  -- 2) Resolver organizer_profile_id (usa qualquer profile válido).
  SELECT id INTO v_organizer_profile_id
  FROM profiles
  LIMIT 1;

  IF v_organizer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum profile encontrado para organizer_profile_id';
  END IF;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma location encontrada para location_id';
  END IF;

  -- 3) Upsert dos eventos mock ativos.
  INSERT INTO events (
    id,
    organizer_profile_id,
    title,
    description,
    date,
    end_date,
    location,
    location_id,
    category,
    image_url,
    max_participants,
    current_participants,
    status,
    is_free,
    price
  )
  VALUES
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      v_organizer_profile_id,
      'Grande Roda de Samba do Nordeste',
      'Samba de roda com artistas locais e feira de empreendedores do Complexo.',
      NOW() + INTERVAL '7 days',
      NULL,
      'Largo do Nordeste de Amaralina',
      v_location_id,
      'cultural',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      600,
      343,
      'upcoming',
      false,
      30.00
    ),
    (
      '22222222-2222-4222-8222-222222222222'::uuid,
      v_organizer_profile_id,
      'Workshop de Empreendedorismo Digital',
      'Workshop prático sobre empreendedorismo digital e vendas online.',
      NOW() + INTERVAL '14 days',
      NULL,
      'Centro Social Urbano - Nordeste',
      v_location_id,
      'educacional',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      50,
      38,
      'upcoming',
      true,
      0.00
    )
  ON CONFLICT (id) DO UPDATE SET
    organizer_profile_id = EXCLUDED.organizer_profile_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    date = EXCLUDED.date,
    end_date = EXCLUDED.end_date,
    location = EXCLUDED.location,
    location_id = EXCLUDED.location_id,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    is_free = EXCLUDED.is_free,
    price = EXCLUDED.price,
    updated_at = NOW();

  RAISE NOTICE 'Seed de eventos mock ativo aplicado. location_id=%, organizer_profile_id=%', v_location_id, v_organizer_profile_id;
END $$;

