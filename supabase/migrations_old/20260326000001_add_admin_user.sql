-- ============================================================================
-- Migration: Add admin role to washingtonmsdj@gmail.com
-- Created: 2026-03-26
-- ============================================================================

-- Adicionar role de admin para o usuário washingtonmsdj@gmail.com
-- Esta migration é idempotente (pode ser executada múltiplas vezes sem erro)

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar o user_id do email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'washingtonmsdj@gmail.com';

  -- Se o usuário existe, adicionar role de admin
  IF v_user_id IS NOT NULL THEN
    -- Inserir role de admin (ON CONFLICT para evitar duplicatas)
    INSERT INTO user_roles (user_id, role, granted_at, is_active)
    VALUES (v_user_id, 'admin', NOW(), true)
    ON CONFLICT (user_id, role) 
    DO UPDATE SET 
      is_active = true,
      granted_at = NOW();

    RAISE NOTICE 'Admin role granted to user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User with email washingtonmsdj@gmail.com not found. User must sign up first.';
  END IF;
END $$;
