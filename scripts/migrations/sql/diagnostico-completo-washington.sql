-- ============================================================================
-- DIAGNÓSTICO COMPLETO - washingtonmsdj@gmail.com
-- ============================================================================

-- QUERY ÚNICA COM TODAS AS INFORMAÇÕES
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.last_sign_in_at,
  u.banned_until,
  u.deleted_at,
  u.is_super_admin,
  -- Diagnóstico do problema
  CASE 
    WHEN u.deleted_at IS NOT NULL THEN '🗑️ DELETADO - Precisa recriar'
    WHEN u.banned_until IS NOT NULL AND u.banned_until > NOW() THEN '🚫 BANIDO - Remover ban'
    WHEN u.email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO - Confirmar email'
    ELSE '✅ OK - Senha pode estar incorreta'
  END as problema,
  -- Solução
  CASE 
    WHEN u.deleted_at IS NOT NULL THEN 'Recriar usuário no painel'
    WHEN u.banned_until IS NOT NULL AND u.banned_until > NOW() THEN 'UPDATE auth.users SET banned_until = NULL WHERE email = ''washingtonmsdj@gmail.com'';'
    WHEN u.email_confirmed_at IS NULL THEN 'UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = ''washingtonmsdj@gmail.com'';'
    ELSE 'Resetar senha no painel: Authentication > Users > Reset password'
  END as solucao,
  -- Perfis
  (SELECT COUNT(*) FROM public.profiles p WHERE p.user_id = u.id) as total_perfis
FROM auth.users u
WHERE u.email = 'washingtonmsdj@gmail.com';
