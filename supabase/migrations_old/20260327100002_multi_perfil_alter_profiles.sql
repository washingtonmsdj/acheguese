-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - ALTER PROFILES
-- ============================================================================
-- Adicionar campos necessários para multi-perfil real na tabela profiles existente
-- ============================================================================

-- Adicionar handle (case-insensitive, único globalmente)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS handle CITEXT;

-- Adicionar campos de privacidade granular
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_contact_email BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_linked_profiles BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_business_links BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_professional_links BOOLEAN DEFAULT true;

-- Adicionar campos de status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Adicionar campos de contato público (separados do email da conta)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;

-- Adicionar campos de localização
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR';

-- Adicionar campos de reputação
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score DECIMAL(10,2) DEFAULT 0;

-- Comentários de auditoria
COMMENT ON COLUMN profiles.handle IS 'Multi-perfil: identificador público único (sem @)';
COMMENT ON COLUMN profiles.show_contact_email IS 'Multi-perfil: controla exibição pública de contact_email';
COMMENT ON COLUMN profiles.show_phone IS 'Multi-perfil: controla exibição pública de phone';
COMMENT ON COLUMN profiles.show_linked_profiles IS 'Multi-perfil: controla exibição de profile_links';
COMMENT ON COLUMN profiles.show_business_links IS 'Multi-perfil: controla exibição de links business';
COMMENT ON COLUMN profiles.show_professional_links IS 'Multi-perfil: controla exibição de links professional';
COMMENT ON COLUMN profiles.is_public IS 'Multi-perfil: controla descoberta pública e acesso à página';
COMMENT ON COLUMN profiles.contact_email IS 'Multi-perfil: email público do perfil (diferente de auth.users.email)';
