-- ============================================================================
-- TORNAR washingtonmsdj@gmail.com SUPER ADMIN
-- ============================================================================

-- Tornar super admin
UPDATE auth.users
SET is_super_admin = true
WHERE email = 'washingtonmsdj@gmail.com';

-- Verificar se funcionou
SELECT 
  email,
  is_super_admin,
  CASE 
    WHEN is_super_admin = true THEN '✅ AGORA É SUPER ADMIN!'
    ELSE '❌ Ainda não é super admin'
  END as status
FROM auth.users
WHERE email = 'washingtonmsdj@gmail.com';

-- ============================================================================
-- PRÓXIMOS PASSOS:
-- 1. Execute este script
-- 2. Resete sua senha no painel (Authentication > Users > Reset password)
-- 3. Faça login com a nova senha
-- 4. Você terá acesso total como super admin
-- ============================================================================
