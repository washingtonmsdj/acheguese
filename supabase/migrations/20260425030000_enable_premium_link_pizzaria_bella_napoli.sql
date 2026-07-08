-- Enable the premium short link for pizzaria-bella-napoli.

DO $$
DECLARE
  v_business_id UUID;
  v_target_slug TEXT := 'pizzaria-bella-napoli';
  v_short_slug TEXT := 'pizzaria-bella-napoli';
BEGIN
  SELECT bd.id
  INTO v_business_id
  FROM business_data bd
  WHERE bd.slug = v_target_slug
    AND bd.status = 'active'
  ORDER BY bd.updated_at DESC
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'business_data not found for slug %', v_target_slug;
  END IF;

  UPDATE business_data
  SET is_premium = true,
      updated_at = NOW()
  WHERE id = v_business_id;

  IF EXISTS (
    SELECT 1
    FROM business_premium_links bpl
    WHERE bpl.slug = v_short_slug
      AND bpl.business_id <> v_business_id
  ) THEN
    v_short_slug := 'pizzaria-bella-napoli-premium';
  END IF;

  INSERT INTO business_premium_links (business_id, slug)
  VALUES (v_business_id, v_short_slug)
  ON CONFLICT (business_id)
  DO UPDATE
    SET slug = EXCLUDED.slug,
        updated_at = NOW();
END $$;
