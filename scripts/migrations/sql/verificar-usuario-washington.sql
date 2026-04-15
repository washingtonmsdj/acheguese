-- ============================================================================
-- DIAGNÓSTICO ESPECÍFICO - washingtonmsdj@gmail.com
-- ============================================================================
-- Execute no SQL Editor do Supabase

-- 1. Verificar se o usuário existe e seu status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  banned_until,
  deleted_at,
  is_super_admin,
  CASE 
    WHEN deleted_at IS NOT NULL THEN '🗑️ PROBLEMA: Usuário deletado'
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '🚫 PROBLEMA: Usuário banido até ' || banned_until::TEXT
    WHEN email_confirmed_at IS NULL THEN '❌ PROBLEMA: Email não confirmado'
    ELSE '✅ Usuário OK para login'
  END as status_diagnostico
FROM auth.users
WHERE email = 'washingtonmsdj@gmail.com';

-- 2. Verificar perfis associados
SELECT 
  p.id as profile_id,
  p.name,
  p.profile_type,
  p.is_active,
  p.verified,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'washingtonmsdj@gmail.com';

-- 3. Verificar se é admin
SELECT 
  u.email,
  u.is_super_admin,
  CASE 
    WHEN u.is_super_admin = true THEN '✅ É super admin'
    ELSE '❌ NÃO é super admin'
  END as status_admin
FROM auth.users u
WHERE u.email = 'washingtonmsdj@gmail.com';

-- ============================================================================
-- SOLUÇÕES BASEADAS NO RESULTADO
-- ============================================================================

-- Se o resultado da query 1 mostrar "Email não confirmado":
-- EXECUTE ESTE COMANDO:
/*
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'washingtonmsdj@gmail.com'
  AND email_confirmed_at IS NULL;
*/

-- Se o resultado da query 1 mostrar "Usuário banido":
-- EXECUTE ESTE COMANDO:
/*
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'washingtonmsdj@gmail.com';
*/

-- Se o resultado da query 1 mostrar "Usuário deletado":
-- O usuário foi deletado e precisa ser recriado no painel

-- Se a query 1 NÃO retornar nenhum resultado:
-- O usuário não existe e precisa ser criado no painel

-- ============================================================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- ============================================================================
-- Após executar a correção, execute novamente a query 1 para confirmar
