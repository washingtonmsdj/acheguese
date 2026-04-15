-- ============================================
-- GATE 5: SETUP DE FIXTURES PARA TESTES OPERACIONAIS
-- ============================================

-- Este script é idempotente e pode ser executado múltiplas vezes

BEGIN;

-- 1. Criar auth user de teste (se não existir)
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000097';
BEGIN
  -- Verificar se usuário já existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'gate5-test@ordax.com',
      crypt('gate5-test-password', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Auth user criado: %', test_user_id;
  ELSE
    RAISE NOTICE 'Auth user já existe: %', test_user_id;
  END IF;
END $$;

-- 2. Criar perfis de motoristas de teste
INSERT INTO profiles (id, user_id, profile_type, name, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000097', 'driver', 'Driver 1 Gate5', true),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000097', 'driver', 'Driver 2 Gate5', true),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000097', 'driver', 'Driver 3 Gate5', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

SELECT '✅ Perfis de motoristas criados/atualizados' AS status;

-- 3. Criar driver_data
INSERT INTO driver_data (profile_id, rating, can_do_delivery, is_online, is_verified)
VALUES
  ('00000000-0000-0000-0000-000000000001', 5.0, true, false, true),
  ('00000000-0000-0000-0000-000000000002', 4.8, true, false, true),
  ('00000000-0000-0000-0000-000000000003', 4.5, false, false, true)
ON CONFLICT (profile_id) DO UPDATE SET
  rating = EXCLUDED.rating,
  can_do_delivery = EXCLUDED.can_do_delivery,
  updated_at = NOW();

SELECT '✅ driver_data criados/atualizados' AS status;

-- 4. Criar corridas de teste
INSERT INTO ride_requests (id, passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, status)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', -23.5505, -46.6333, -23.5606, -46.6434, 'pending'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', -23.5505, -46.6333, -23.5606, -46.6434, 'pending')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

SELECT '✅ Corridas de teste criadas/atualizadas' AS status;

-- 5. Limpar driver_availability de teste
DELETE FROM driver_availability
WHERE profile_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

SELECT '✅ driver_availability limpo' AS status;

-- 6. Verificar setup
SELECT 
  'Perfis' AS tipo,
  COUNT(*) AS total
FROM profiles
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
UNION ALL
SELECT 
  'driver_data' AS tipo,
  COUNT(*) AS total
FROM driver_data
WHERE profile_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
UNION ALL
SELECT 
  'Corridas' AS tipo,
  COUNT(*) AS total
FROM ride_requests
WHERE id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

COMMIT;

SELECT '✅ Setup completo! Fixtures prontas para testes operacionais.' AS status;
SELECT 'Execute os testes com: npm test tests/operational/gate5-availability-test.test.ts' AS next_step;
