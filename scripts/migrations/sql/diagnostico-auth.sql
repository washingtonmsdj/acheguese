-- ============================================================================
-- DIAGNÓSTICO DE AUTENTICAÇÃO - SSOT
-- ============================================================================
-- Este script verifica o estado real dos usuários no banco de dados
-- Execute no SQL Editor do Supabase para diagnosticar problemas de login

-- 1. Verificar usuários existentes no auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  banned_until,
  deleted_at,
  is_sso_user,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '🚫 Usuário banido'
    WHEN deleted_at IS NOT NULL THEN '🗑️ Usuário deletado'
    ELSE '✅ Usuário OK'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- 2. Verificar se há usuários sem email confirmado
SELECT 
  COUNT(*) as total_nao_confirmados,
  STRING_AGG(email, ', ') as emails
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND deleted_at IS NULL;

-- 3. Verificar configuração de confirmação de email
-- (Isso precisa ser verificado no painel: Authentication > Settings > Email Auth)

-- 4. Verificar perfis associados aos usuários
SELECT 
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.name,
  p.profile_type,
  p.is_active
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 20;

-- 5. Verificar se há usuários órfãos (sem perfil)
SELECT 
  u.id,
  u.email,
  u.created_at,
  '⚠️ Usuário sem perfil' as problema
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL
  AND u.deleted_at IS NULL;
