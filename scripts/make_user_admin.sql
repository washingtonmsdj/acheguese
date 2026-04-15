-- ============================================================================
-- Script para tornar usuário admin
-- ============================================================================
-- Usuário: a3ea040f-6f7a-44dd-b778-10eff4295303
-- ============================================================================

-- Inserir role de admin para o usuário (se não existir)
INSERT INTO user_roles (user_id, role, is_active, granted_at)
VALUES (
  'a3ea040f-6f7a-44dd-b778-10eff4295303',
  'admin',
  true,
  NOW()
)
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  is_active = true,
  granted_at = NOW(),
  expires_at = NULL;

-- Verificar se o usuário foi adicionado como admin
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.is_active,
  ur.granted_at,
  ur.expires_at,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303';
