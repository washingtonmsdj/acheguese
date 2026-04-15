-- ============================================================================
-- FASE 7: SEED COMPLETO — Profile Fixture + Posts (ordem correta)
-- ============================================================================
-- Consolida 20260405000025 e 20260405000026 em sequência única e determinística.
-- Ordem de execução:
--   1. User fixture (auth.users)
--   2. Profile fixture (profiles, via UPDATE no profile criado pelo trigger)
--   3. Posts seed (posts, ancorando author_profile_id no user fixture)
--
-- UUIDs canônicos:
--   USER_SEED_ID = 'f0000000-0000-0000-0000-000000000000'
--   email        = 'seed-fixture@test.local'
--   CITY_ID      = '00000000-0000-0000-0000-000000000001' (Salvador Teste Fase2)
--   BARRA_ID     = '00000000-0000-0000-0000-000000000002' (Barra Teste Fase2)
--   PELO_ID      = '00000000-0000-0000-0000-000000000003' (Pelourinho Teste Fase2)
-- ============================================================================

-- ── PASSO 1: User fixture ─────────────────────────────────────────────────────

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  'f0000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'seed-fixture@test.local',
  '$2a$10$abcdefghijklmnopqrstuuVGmFpAqEW6MoAGIAWVvtSOeN4bHe9Iq',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- ── PASSO 2: Profile fixture ──────────────────────────────────────────────────
-- O trigger auto_create_personal_profile cria um profile ao inserir o user.
-- Atualizamos esse profile com location_id fixo.

UPDATE profiles
SET
  name        = 'Seed Fixture User',
  location_id = '00000000-0000-0000-0000-000000000002',
  updated_at  = NOW()
WHERE user_id     = 'f0000000-0000-0000-0000-000000000000'
  AND profile_type = 'personal';

-- Validar profile — falha explícita se não existir
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id     = 'f0000000-0000-0000-0000-000000000000'
    AND profile_type = 'personal'
    AND location_id  = '00000000-0000-0000-0000-000000000002';

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION
      'SEED FALHOU (passo 2): profile fixture para user_id=f0000000-0000-0000-0000-000000000000 '
      'não existe ou location_id incorreto. Verifique o trigger auto_create_personal_profile.';
  END IF;

  RAISE NOTICE 'Profile fixture OK: id=%', v_profile_id;
END $$;

-- ── PASSO 3: Posts seed ───────────────────────────────────────────────────────

DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Resolver profile pelo user_id fixo — sem fallback silencioso
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id     = 'f0000000-0000-0000-0000-000000000000'
    AND profile_type = 'personal';

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION
      'SEED FALHOU (passo 3): profile fixture não encontrado. '
      'O passo 2 deve ter falhado silenciosamente.';
  END IF;

  -- Post 1: district, reach neighborhood
  INSERT INTO posts (
    id, author_profile_id, content, type, location_id, reach,
    images, tags, likes_count, comments_count, confirmations_count,
    is_verified, is_published, created_at, updated_at
  ) VALUES (
    '10000000-0000-0000-0000-000000000001',
    v_profile_id,
    'Post seed — Barra Teste Fase2 (bairro, reach neighborhood)',
    'text',
    '00000000-0000-0000-0000-000000000002',
    'neighborhood',
    '[]'::jsonb, '[]'::jsonb,
    0, 0, 0, false, true,
    NOW() - INTERVAL '2 hours', NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    author_profile_id = EXCLUDED.author_profile_id,
    updated_at        = NOW();

  -- Post 2: city, reach city
  INSERT INTO posts (
    id, author_profile_id, content, type, location_id, reach,
    images, tags, likes_count, comments_count, confirmations_count,
    is_verified, is_published, created_at, updated_at
  ) VALUES (
    '10000000-0000-0000-0000-000000000002',
    v_profile_id,
    'Post seed — Salvador Teste Fase2 (cidade, reach city)',
    'text',
    '00000000-0000-0000-0000-000000000001',
    'city',
    '[]'::jsonb, '[]'::jsonb,
    0, 0, 0, false, true,
    NOW() - INTERVAL '1 hour', NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    author_profile_id = EXCLUDED.author_profile_id,
    updated_at        = NOW();

  -- Post 3: district, reach street
  INSERT INTO posts (
    id, author_profile_id, content, type, location_id, reach,
    images, tags, likes_count, comments_count, confirmations_count,
    is_verified, is_published, created_at, updated_at
  ) VALUES (
    '10000000-0000-0000-0000-000000000003',
    v_profile_id,
    'Post seed — Pelourinho Teste Fase2 (bairro, reach street)',
    'text',
    '00000000-0000-0000-0000-000000000003',
    'street',
    '[]'::jsonb, '[]'::jsonb,
    0, 0, 0, false, true,
    NOW(), NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    author_profile_id = EXCLUDED.author_profile_id,
    updated_at        = NOW();

  RAISE NOTICE 'Posts seed OK: author_profile_id=%', v_profile_id;
END $$;

-- ── PASSO 4: Validação final ──────────────────────────────────────────────────

DO $$
DECLARE
  post_count   INTEGER;
  user_id_ok   BOOLEAN;
BEGIN
  -- Contar posts seed
  SELECT COUNT(*) INTO post_count
  FROM posts
  WHERE id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003'
  );

  IF post_count <> 3 THEN
    RAISE EXCEPTION 'SEED FALHOU (validação): esperado 3 posts, encontrado %', post_count;
  END IF;

  -- Confirmar que todos os posts têm o user_id fixture
  SELECT bool_and(pr.user_id = 'f0000000-0000-0000-0000-000000000000') INTO user_id_ok
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_profile_id
  WHERE p.id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003'
  );

  IF NOT user_id_ok THEN
    RAISE EXCEPTION 'SEED FALHOU (validação): nem todos os posts têm user_id=f0000000-0000-0000-0000-000000000000';
  END IF;

  RAISE NOTICE 'Validação final OK: 3/3 posts com user_id fixture correto';
END $$;
