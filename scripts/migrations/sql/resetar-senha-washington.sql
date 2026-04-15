-- ============================================================================
-- RESETAR SENHA - washingtonmsdj@gmail.com
-- ============================================================================
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE

-- Passo 1: Habilitar extensão pgcrypto (se necessário)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Passo 2: Atualizar senha
-- A nova senha será: Admin2026!
UPDATE auth.users
SET 
  encrypted_password = crypt('Admin2026!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'washingtonmsdj@gmail.com';

-- Passo 3: Verificar se funcionou
SELECT 
  email,
  email_confirmed_at,
  updated_at,
  '✅ Senha atualizada para: Admin2026!' as mensagem
FROM auth.users
WHERE email = 'washingtonmsdj@gmail.com';

-- ============================================================================
-- IMPORTANTE: TROCAR A SENHA
-- ============================================================================
-- A senha definida acima é: Admin2026!
-- 
-- Para usar uma senha diferente, substitua 'Admin2026!' na linha 15
-- por sua senha desejada (mantenha as aspas simples)
--
-- Exemplo:
-- encrypted_password = crypt('MinhaSenh@Forte123', gen_salt('bf')),
-- ============================================================================

-- ============================================================================
-- MÉTODO ALTERNATIVO (se o método acima não funcionar)
-- ============================================================================
-- Se você receber erro "function crypt does not exist", execute primeiro:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- 
-- Depois execute novamente o UPDATE acima
-- ============================================================================
