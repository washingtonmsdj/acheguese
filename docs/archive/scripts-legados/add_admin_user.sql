-- ============================================================================
-- Script: Criar usuário admin washingtonmsdj@gmail.com
-- Como usar: Copie e cole este script no Supabase Studio > SQL Editor
-- URL local: http://localhost:54323 (ou a porta do seu Supabase local)
-- 
-- Email: washingtonmsdj@gmail.com
-- Senha: admin12345678
-- ============================================================================

-- Criar usuário e adicionar role de admin
DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Buscar se o usuário já existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'washingtonmsdj@gmail.com';

  -- Se o usuário NÃO existe, criar
  IF v_user_id IS NULL THEN
    -- Gerar hash da senha usando crypt do pgcrypto
    v_encrypted_password := crypt('admin12345678', gen_salt('bf'));
    
    -- Inserir usuário na tabela auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'washingtonmsdj@gmail.com',
      v_encrypted_password,
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'User created with ID: %', v_user_id;
  ELSE
    RAISE NOTICE 'User already exists with ID: %', v_user_id;
  END IF;

  -- Adicionar role de admin (ON CONFLICT para evitar duplicatas)
  INSERT INTO user_roles (user_id, role, granted_at, is_active)
  VALUES (v_user_id, 'admin', NOW(), true)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = true,
    granted_at = NOW();

  RAISE NOTICE 'Admin role granted to user: %', v_user_id;
END $$;

-- Verificar se foi adicionado com sucesso
SELECT 
  u.email,
  ur.role,
  ur.granted_at,
  ur.is_active
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'washingtonmsdj@gmail.com';
