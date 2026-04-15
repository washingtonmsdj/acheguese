-- Migration: Seed territorial highlights for Complexo do Nordeste de Amaralina
-- Date: 2026-03-25

DO $$
DECLARE
  v_complexo_id UUID;
BEGIN
  -- Get the territorial group ID
  SELECT id INTO v_complexo_id 
  FROM territorial_groups 
  WHERE slug = 'complexo-do-nordeste-de-amaralina';

  IF v_complexo_id IS NOT NULL THEN
    -- Insert sample highlights
    INSERT INTO territorial_highlights (
      territory_type,
      territory_ref_id,
      title,
      description,
      icon,
      color,
      position,
      status
    ) VALUES
    (
      'group',
      v_complexo_id,
      'Feira Livre do Nordeste',
      'Feira semanal com produtos frescos e artesanato local',
      'shopping-bag',
      '#10b981',
      1,
      'active'
    ),
    (
      'group',
      v_complexo_id,
      'Projeto Social Juventude Ativa',
      'Oficinas de capacitação para jovens da comunidade',
      'users',
      '#3b82f6',
      2,
      'active'
    ),
    (
      'group',
      v_complexo_id,
      'Campanha de Vacinação',
      'Posto de saúde com vacinação gratuita até dia 30',
      'heart',
      '#ef4444',
      3,
      'active'
    ),
    (
      'group',
      v_complexo_id,
      'Biblioteca Comunitária',
      'Espaço de leitura e estudo com acervo renovado',
      'book-open',
      '#8b5cf6',
      4,
      'active'
    );

    RAISE NOTICE 'Highlights criados para o Complexo do Nordeste de Amaralina';
  ELSE
    RAISE NOTICE 'Grupo territorial não encontrado';
  END IF;
END $$;