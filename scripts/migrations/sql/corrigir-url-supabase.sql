-- ============================================================================
-- CORRIGIR CONFIGURAÇÃO DE URL - Supabase
-- ============================================================================
-- Este script mostra as configurações atuais de URL

-- Verificar configurações atuais
SELECT 
  name,
  value
FROM auth.config
WHERE name IN ('site_url', 'uri_allow_list');

-- ============================================================================
-- IMPORTANTE: CONFIGURAÇÃO VIA PAINEL
-- ============================================================================
-- As URLs não podem ser alteradas via SQL por segurança.
-- Você PRECISA configurar no painel do Supabase:
--
-- 1. Vá em: Authentication > URL Configuration
-- 2. Configure:
--    - Site URL: http://localhost:8080
--    - Redirect URLs: http://localhost:8080/**
--
-- 3. Salve as alterações
--
-- Isso fará com que os links de email apontem para a porta correta
-- ============================================================================
