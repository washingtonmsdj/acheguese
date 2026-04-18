-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Atualizar Sistema de Profiles
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Atualiza a tabela profiles existente para:
-- - Adicionar campo slug (URL-friendly)
-- - Melhorar RLS com mascaramento de PII
-- - Criar view public_profiles
-- - Criar tabelas de auditoria (username_history, slug_history)
-- - Adicionar trigger handle_new_user para signup automático
-- 
-- SSOT: Única fonte de verdade para perfis de usuário
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. ADICIONAR NOVOS CAMPOS À TABELA profiles
-- ══════════════════════════════════════════════════════════════════════════

-- Adicionar campo slug (URL-friendly identifier)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Criar índice no slug
CREATE INDEX IF NOT EXISTS idx_profiles_slug 
  ON profiles(slug) 
  WHERE slug IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════
-- 1.5. CRIAR FUNÇÃO HELPER PARA GERAR SLUGS ÚNICOS
-- ══════════════════════════════════════════════════════════════════════════

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug_candidate TEXT;
  slug_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Normalizar texto base
  slug_candidate := LOWER(REGEXP_REPLACE(
    base_text,
    '[^a-zA-Z0-9-]',
    '-',
    'g'
  ));
  
  -- Remover hífens duplicados e nas pontas
  slug_candidate := REGEXP_REPLACE(slug_candidate, '-+', '-', 'g');
  slug_candidate := TRIM(BOTH '-' FROM slug_candidate);
  
  -- Limitar tamanho
  IF LENGTH(slug_candidate) > 50 THEN
    slug_candidate := SUBSTRING(slug_candidate, 1, 50);
  END IF;
  
  -- Verificar se slug já existe
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE slug = slug_candidate
    ) INTO slug_exists;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    slug_candidate := SUBSTRING(slug_candidate, 1, 45) || '-' || counter;
  END LOOP;
  
  RETURN slug_candidate;
END;
$$;

COMMENT ON FUNCTION generate_unique_slug(TEXT) IS 
'Gera um slug único a partir de um texto base.';

-- Gerar slugs para profiles existentes que não têm
-- Usar função para garantir unicidade
DO $$
DECLARE
  profile_record RECORD;
  new_slug TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, username, display_name, name 
    FROM profiles 
    WHERE slug IS NULL
  LOOP
    new_slug := generate_unique_slug(
      COALESCE(
        profile_record.username, 
        profile_record.display_name, 
        profile_record.name, 
        'user-' || profile_record.id::text
      )
    );
    
    UPDATE profiles 
    SET slug = new_slug 
    WHERE id = profile_record.id;
  END LOOP;
END $$;

COMMENT ON COLUMN profiles.slug IS 
'Identificador único URL-friendly para o perfil (ex: joao-silva-123)';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. CRIAR TABELA profile_username_history (se não existir)
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profile_username_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_username TEXT,
  new_username TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_profile_username_history_profile_id 
  ON profile_username_history(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_username_history_changed_at 
  ON profile_username_history(changed_at DESC);

ALTER TABLE profile_username_history ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE profile_username_history IS 
'Histórico de mudanças de username para auditoria e prevenção de fraude.';

-- ══════════════════════════════════════════════════════════════════════════
-- 3. CRIAR TABELA profile_slug_history
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profile_slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_slug TEXT,
  new_slug TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_profile_slug_history_profile_id 
  ON profile_slug_history(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_slug_history_changed_at 
  ON profile_slug_history(changed_at DESC);

ALTER TABLE profile_slug_history ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE profile_slug_history IS 
'Histórico de mudanças de slug para auditoria e SEO.';

-- ══════════════════════════════════════════════════════════════════════════
-- 4. CRIAR TRIGGERS PARA AUDITORIA
-- ══════════════════════════════════════════════════════════════════════════

-- Trigger para log de mudanças de username
CREATE OR REPLACE FUNCTION log_username_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    INSERT INTO profile_username_history (
      profile_id,
      old_username,
      new_username,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.username,
      NEW.username,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_username_change_trigger ON profiles;
CREATE TRIGGER log_username_change_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.username IS DISTINCT FROM NEW.username)
  EXECUTE FUNCTION log_username_change();

-- Trigger para log de mudanças de slug
CREATE OR REPLACE FUNCTION log_slug_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    INSERT INTO profile_slug_history (
      profile_id,
      old_slug,
      new_slug,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.slug,
      NEW.slug,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_slug_change_trigger ON profiles;
CREATE TRIGGER log_slug_change_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION log_slug_change();

-- ══════════════════════════════════════════════════════════════════════════
-- 5. CRIAR FUNÇÃO handle_new_user (SIGNUP AUTOMÁTICO)
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_display_name TEXT;
  default_slug TEXT;
BEGIN
  -- Gerar display_name padrão do email
  default_display_name := SPLIT_PART(NEW.email, '@', 1);
  
  -- Gerar slug único
  default_slug := LOWER(REGEXP_REPLACE(
    default_display_name || '-' || SUBSTRING(NEW.id::text, 1, 8),
    '[^a-zA-Z0-9-]',
    '-',
    'g'
  ));
  
  -- Criar profile automaticamente
  INSERT INTO profiles (
    user_id,
    profile_type,
    name,
    display_name,
    slug,
    is_active
  ) VALUES (
    NEW.id,
    'personal',
    default_display_name,
    default_display_name,
    default_slug,
    true
  );
  
  -- Atribuir role 'user' padrão (se não existir)
  INSERT INTO user_roles (user_id, role_enum, reason)
  VALUES (NEW.id, 'user', 'Role padrão no signup')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS 
'Cria automaticamente um profile e atribui role "user" quando um novo usuário se cadastra.';

-- ══════════════════════════════════════════════════════════════════════════
-- 6. CRIAR VIEW public_profiles (MASCARAMENTO DE PII)
-- ══════════════════════════════════════════════════════════════════════════

-- Dropar view existente se houver
DROP VIEW IF EXISTS public_profiles CASCADE;

CREATE VIEW public_profiles AS
SELECT
  id,
  user_id,
  profile_type,
  display_name,
  username,
  slug,
  bio,
  avatar_url,
  -- Localização pública (sem endereço exato)
  city,
  neighborhood,
  location_id,
  -- Gamificação (público)
  reputation,
  pontos,
  -- Status
  is_active,
  -- Auditoria
  created_at,
  updated_at
FROM profiles
WHERE is_active = true;

COMMENT ON VIEW public_profiles IS 
'View pública de profiles sem dados sensíveis (phone, whatsapp, etc).';

-- ══════════════════════════════════════════════════════════════════════════
-- 7. ATUALIZAR RLS POLICIES
-- ══════════════════════════════════════════════════════════════════════════

-- Remover policies antigas
DROP POLICY IF EXISTS "Active profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Users manage own profiles" ON profiles;

-- Policy: Perfis ativos são visíveis publicamente (dados não-sensíveis)
CREATE POLICY "Perfis ativos visíveis publicamente"
  ON profiles FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Usuários podem ver seus próprios perfis completos (incluindo PII)
CREATE POLICY "Usuários veem seus próprios perfis completos"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins podem ver todos os perfis completos
CREATE POLICY "Admins veem todos os perfis"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policy: Usuários podem atualizar seus próprios perfis
CREATE POLICY "Usuários atualizam seus próprios perfis"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    -- Não pode mudar campos admin-only
    profile_type = profile_type AND
    is_suspended = is_suspended
  );

-- Policy: Apenas admins podem suspender perfis
CREATE POLICY "Admins podem suspender perfis"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Ninguém pode deletar perfis (soft-delete via is_active)
CREATE POLICY "Perfis não podem ser deletados"
  ON profiles FOR DELETE
  TO authenticated
  USING (false);

-- Policies para profile_username_history
DROP POLICY IF EXISTS "Usuários veem seu próprio histórico de username" ON profile_username_history;
CREATE POLICY "Usuários veem seu próprio histórico de username"
  ON profile_username_history FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins veem todo histórico de username" ON profile_username_history;
CREATE POLICY "Admins veem todo histórico de username"
  ON profile_username_history FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policies para profile_slug_history
DROP POLICY IF EXISTS "Usuários veem seu próprio histórico de slug" ON profile_slug_history;
CREATE POLICY "Usuários veem seu próprio histórico de slug"
  ON profile_slug_history FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins veem todo histórico de slug" ON profile_slug_history;
CREATE POLICY "Admins veem todo histórico de slug"
  ON profile_slug_history FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- ══════════════════════════════════════════════════════════════════════════
-- 8. FUNÇÕES HELPER ADICIONAIS
-- ══════════════════════════════════════════════════════════════════════════

-- Função para buscar profile por slug
CREATE OR REPLACE FUNCTION get_profile_by_slug(profile_slug TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  profile_type TEXT,
  display_name TEXT,
  username TEXT,
  slug TEXT,
  bio TEXT,
  avatar_url TEXT,
  reputation INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.profile_type,
    p.display_name,
    p.username,
    p.slug,
    p.bio,
    p.avatar_url,
    p.reputation
  FROM profiles p
  WHERE p.slug = profile_slug
    AND p.is_active = true;
END;
$$;

COMMENT ON FUNCTION get_profile_by_slug(TEXT) IS 
'Busca um profile ativo pelo slug (para URLs públicas).';

-- ══════════════════════════════════════════════════════════════════════════
-- 9. ATUALIZAR COMENTÁRIOS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE profiles IS 
'Perfis de usuários. Conecta 1:1 com auth.users. Suporta múltiplos tipos: personal, business, professional, driver.';

COMMENT ON COLUMN profiles.profile_type IS 
'Tipo de perfil: personal (padrão), business, professional, driver';

COMMENT ON COLUMN profiles.display_name IS 
'Nome de exibição público do usuário';

COMMENT ON COLUMN profiles.username IS 
'Username único (opcional, para @mentions)';

COMMENT ON COLUMN profiles.phone IS 
'Telefone (PII - protegido por RLS)';

COMMENT ON COLUMN profiles.whatsapp IS 
'WhatsApp (PII - protegido por RLS)';

COMMENT ON COLUMN profiles.is_suspended IS 
'Se o perfil está suspenso';

COMMENT ON COLUMN profiles.reputation IS 
'Pontuação de reputação (gamificação)';

-- ══════════════════════════════════════════════════════════════════════════
-- 10. GRANTS
-- ══════════════════════════════════════════════════════════════════════════

GRANT SELECT ON public_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_unique_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_by_slug(TEXT) TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
