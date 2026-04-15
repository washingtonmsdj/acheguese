-- ============================================
-- CRIAR PERFIL DE MOTORISTA PARA ADMIN
-- ============================================
-- Execute no SQL Editor:
-- https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'a3ea040f-6f7a-44dd-b778-10eff4295303';
  v_profile_id UUID;
  v_driver_profile_id UUID;
BEGIN

  -- 1. Verificar se já existe profile de motorista
  SELECT id INTO v_driver_profile_id
  FROM profiles
  WHERE user_id = v_user_id
    AND profile_type = 'driver'
  LIMIT 1;

  IF v_driver_profile_id IS NOT NULL THEN
    RAISE NOTICE '✅ Profile de motorista já existe: %', v_driver_profile_id;
  ELSE
    -- 2. Criar profile de motorista
    INSERT INTO profiles (user_id, profile_type, name, display_name, is_active)
    VALUES (v_user_id, 'driver', 'Admin Motorista', 'Admin (Motorista)', true)
    RETURNING id INTO v_driver_profile_id;

    RAISE NOTICE '✅ Profile de motorista criado: %', v_driver_profile_id;
  END IF;

  -- 3. Verificar se já existe driver_data
  IF NOT EXISTS (
    SELECT 1 FROM driver_data WHERE profile_id = v_driver_profile_id
  ) THEN
    -- 4. Criar driver_data para o profile
    INSERT INTO driver_data (
      profile_id,
      is_online,
      is_verified,
      subscription_active,
      rating,
      total_rides,
      total_rides_completed,
      total_rides_cancelled,
      acceptance_rate,
      cancellation_rate
    ) VALUES (
      v_driver_profile_id,
      false,
      true,  -- Admin é verificado automaticamente
      true,  -- Admin tem assinatura ativa
      5.0,
      0, 0, 0, 100.0, 0.0
    );

    RAISE NOTICE '✅ driver_data criado para profile: %', v_driver_profile_id;
  ELSE
    RAISE NOTICE '✅ driver_data já existe para profile: %', v_driver_profile_id;
  END IF;

END $$;

-- Verificar resultado
SELECT
  p.id as profile_id,
  p.profile_type,
  p.display_name,
  d.is_verified,
  d.subscription_active,
  d.rating
FROM profiles p
LEFT JOIN driver_data d ON d.profile_id = p.id
WHERE p.user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
  AND p.profile_type = 'driver';

SELECT '✅ Perfil de motorista admin criado!' AS status;
