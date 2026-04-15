-- ============================================================================
-- SEED: Users de teste para validação de RLS
-- ============================================================================
-- Cria dois users com senha real para testes de autenticação ponta a ponta.
-- Senhas são fracas intencionalmente — estes users são APENAS para testes.
--
-- USER_A: rls-user-a@test.local / RlsTestA123!
--   UUID: fa000000-0000-0000-0000-000000000001
--   Profile pessoal com location_id = Barra Teste Fase2
--
-- USER_B: rls-user-b@test.local / RlsTestB123!
--   UUID: fb000000-0000-0000-0000-000000000001
--   Profile pessoal com location_id = Salvador Teste Fase2
--   Profile business (multi-profile) sem location_id
-- ============================================================================

-- User A
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
) VALUES (
  'fa000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'rls-user-a@test.local',
  crypt('RlsTestA123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false, 'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- User B
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
) VALUES (
  'fb000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'rls-user-b@test.local',
  crypt('RlsTestB123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false, 'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Atualizar profiles criados pelo trigger com location_id correto
UPDATE profiles
SET name = 'RLS Test User A',
    location_id = '00000000-0000-0000-0000-000000000002', -- Barra Teste Fase2
    updated_at = NOW()
WHERE user_id = 'fa000000-0000-0000-0000-000000000001'
  AND profile_type = 'personal';

UPDATE profiles
SET name = 'RLS Test User B',
    location_id = '00000000-0000-0000-0000-000000000001', -- Salvador Teste Fase2
    updated_at = NOW()
WHERE user_id = 'fb000000-0000-0000-0000-000000000001'
  AND profile_type = 'personal';

-- Criar profile business para User B (multi-profile)
INSERT INTO profiles (
  id, user_id, profile_type, name,
  location_id, is_active, is_suspended, suspended,
  reputation, pontos, verified, created_at, updated_at
) VALUES (
  'fb000000-0000-0000-0000-000000000002',
  'fb000000-0000-0000-0000-000000000001',
  'business',
  'RLS Test User B Business',
  '00000000-0000-0000-0000-000000000001',
  true, false, false, 0, 0, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Validar
DO $$
DECLARE
  profile_a UUID;
  profile_b UUID;
BEGIN
  SELECT id INTO profile_a FROM profiles
  WHERE user_id = 'fa000000-0000-0000-0000-000000000001'
    AND profile_type = 'personal'
    AND location_id = '00000000-0000-0000-0000-000000000002';

  SELECT id INTO profile_b FROM profiles
  WHERE user_id = 'fb000000-0000-0000-0000-000000000001'
    AND profile_type = 'personal'
    AND location_id = '00000000-0000-0000-0000-000000000001';

  IF profile_a IS NULL THEN
    RAISE EXCEPTION 'SEED FALHOU: profile de User A não encontrado';
  END IF;
  IF profile_b IS NULL THEN
    RAISE EXCEPTION 'SEED FALHOU: profile de User B não encontrado';
  END IF;

  RAISE NOTICE 'RLS test users OK: A=%, B=%', profile_a, profile_b;
END $$;
