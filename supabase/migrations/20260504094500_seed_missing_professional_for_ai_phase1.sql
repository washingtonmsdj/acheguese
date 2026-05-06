-- ============================================================================
-- Migration: Seed one extra professional for AI Phase 1 validation (idempotent)
-- Date: 2026-05-04
-- ============================================================================

DO $mig$
DECLARE
  v_profile_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM professional_data pd
    WHERE pd.slug = 'encanador-carlos-ai-seed'
  ) THEN
    RETURN;
  END IF;

  SELECT p.id
  INTO v_profile_id
  FROM profiles p
  LEFT JOIN professional_data pd ON pd.profile_id = p.id
  WHERE pd.profile_id IS NULL
    AND p.profile_type = 'professional'
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE NOTICE 'No available professional profile_id to seed professional_data; skipping.';
    RETURN;
  END IF;

  INSERT INTO professional_data (
    profile_id,
    professional_name,
    slug,
    service_category,
    description,
    location_id,
    is_accepting_clients,
    is_verified,
    price_range,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Carlos Santos - Encanador',
    'encanador-carlos-ai-seed',
    'encanador',
    'Atendimento hidraulico residencial e comercial.',
    '384add59-4e53-489d-a7b5-97dea2b3f442',
    true,
    false,
    '$$',
    jsonb_build_object('latitude', -12.9978, 'longitude', -38.4503),
    now(),
    now()
  );
END
$mig$;

NOTIFY pgrst, 'reload schema';
