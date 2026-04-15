-- ============================================================================
-- CRIAR USUÁRIO DE TESTE - SSOT
-- ============================================================================
-- Este script cria um usuário de teste funcional com perfil associado
-- Execute no SQL Editor do Supabase (com service_role ou admin)

-- IMPORTANTE: Substitua os valores abaixo antes de executar
-- Email: teste@exemplo.com
-- Senha: Teste123! (você definirá no painel)

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'teste@exemplo.com'; -- ALTERE AQUI
BEGIN
  -- 1. Verificar se o usuário já existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Usuário já existe: %', v_user_id;
    
    -- Confirmar email se não estiver confirmado
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = v_user_id
      AND email_confirmed_at IS NULL;
    
    RAISE NOTICE 'Email confirmado para: %', v_email;
  ELSE
    RAISE NOTICE 'Usuário não existe. Crie manualmente no painel do Supabase:';
    RAISE NOTICE '1. Vá em Authentication > Users';
    RAISE NOTICE '2. Clique em "Add user" > "Create new user"';
    RAISE NOTICE '3. Email: %', v_email;
    RAISE NOTICE '4. Password: Teste123!';
    RAISE NOTICE '5. MARQUE "Auto Confirm User"';
    RAISE NOTICE '6. Clique em "Create user"';
  END IF;
END $$;

-- ============================================================================
-- VERIFICAÇÃO PÓS-CRIAÇÃO
-- ============================================================================
-- Execute após criar o usuário no painel para verificar

SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ PROBLEMA: Email não confirmado'
    ELSE '✅ OK: Email confirmado'
  END as status_email,
  CASE 
    WHEN p.id IS NULL THEN '⚠️ PROBLEMA: Sem perfil (será criado no primeiro login)'
    ELSE '✅ OK: Perfil existe'
  END as status_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'teste@exemplo.com'; -- ALTERE AQUI

-- ============================================================================
-- RESETAR SENHA (se necessário)
-- ============================================================================
-- Se você esqueceu a senha, use a função de reset no painel:
-- Authentication > Users > Clique no usuário > "Send password recovery"
