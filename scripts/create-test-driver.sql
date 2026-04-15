-- Script para criar perfil motorista de teste
-- Execute via SQL Editor do Supabase

-- PASSO 1: Primeiro, crie o usuário via Dashboard
-- Vá para: Supabase Dashboard > Authentication > Users > Add User
-- Email: test-driver@acheguese.local
-- Password: TestDriver123!@#
-- Auto Confirm: SIM

-- PASSO 2: Execute este script para criar o perfil
-- Ele vai buscar automaticamente o usuário pelo email

DO $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_email TEXT := 'test-driver@acheguese.local';
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado. Crie via Dashboard primeiro.', v_email;
  END IF;
  
  RAISE NOTICE 'Usuário encontrado: %', v_user_id;
  
  -- Verificar se profile já existe
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = v_user_id;
  
  IF v_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Profile já existe: %', v_profile_id;
  ELSE
    -- Criar perfil
    INSERT INTO profiles (user_id, username, full_name, profile_type)
    VALUES (v_user_id, 'test_driver', 'Test Driver', 'driver')
    RETURNING id INTO v_profile_id;
    
    RAISE NOTICE 'Profile criado: %', v_profile_id;
  END IF;
  
  -- Verificar se driver_data já existe
  IF EXISTS (SELECT 1 FROM driver_data WHERE driver_profile_id = v_profile_id) THEN
    RAISE NOTICE 'Driver data já existe';
  ELSE
    -- Criar driver_data
    INSERT INTO driver_data (driver_profile_id, is_online, is_available)
    VALUES (v_profile_id, true, true);
    
    RAISE NOTICE 'Driver data criado';
  END IF;
  
  -- Mostrar IDs finais
  RAISE NOTICE '===================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Profile ID: %', v_profile_id;
  RAISE NOTICE '===================';
END $$;

-- PASSO 3: Validar
SELECT 
  p.id as profile_id,
  p.user_id,
  p.username,
  p.profile_type,
  dd.is_online,
  dd.is_available
FROM profiles p
LEFT JOIN driver_data dd ON dd.driver_profile_id = p.id
WHERE p.username = 'test_driver';
