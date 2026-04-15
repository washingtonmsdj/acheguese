-- ============================================================================
-- TORNAR USUÁRIO SUPER ADMIN
-- ============================================================================
-- Este script torna washingtonmsdj@gmail.com um super admin

-- PASSO 1: Confirmar email (se necessário)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'washingtonmsdj@gmail.com';

-- PASSO 2: Remover ban (se houver)
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'washingtonmsdj@gmail.com';

-- PASSO 3: Tornar super admin
UPDATE auth.users
SET is_super_admin = true
WHERE email = 'washingtonmsdj@gmail.com';

-- PASSO 4: Verificar se funcionou
SELECT 
  email,
  email_confirmed_at,
  banned_until,
  is_super_admin,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email ainda não confirmado'
    WHEN banned_until IS NOT NULL THEN '🚫 Usuário ainda banido'
    WHEN is_super_admin = true THEN '✅ SUPER ADMIN ATIVADO!'
    ELSE '⚠️ Não é super admin'
  END as status
FROM auth.users
WHERE email = 'washingtonmsdj@gmail.com';

-- ============================================================================
-- IMPORTANTE: RESETAR SENHA
-- ============================================================================
-- Após executar este script, você PRECISA resetar a senha:
--
-- OPÇÃO 1 - Via Painel (Recomendado):
-- 1. Vá em Authentication > Users
-- 2. Encontre washingtonmsdj@gmail.com
-- 3. Clique nos 3 pontinhos > "Reset password"
-- 4. Defina uma nova senha
--
-- OPÇÃO 2 - Via Email:
-- 1. Na tela de login, clique em "Esqueci minha senha"
-- 2. Digite washingtonmsdj@gmail.com
-- 3. Verifique seu email
-- 4. Clique no link e defina nova senha
--
-- ============================================================================
