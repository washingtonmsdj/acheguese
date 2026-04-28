-- ============================================================================
-- MIGRATION: Criar tabela education_profiles
-- ============================================================================
-- Tabela principal para perfis de instituicoes de educacao.
-- Cada registro representa uma escola/instituicao vinculada a um business.
-- ============================================================================

-- Criar tipo enum para status do perfil
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_profile_status') THEN
    CREATE TYPE education_profile_status AS ENUM ('draft', 'published', 'paused');
  END IF;
END $$;

-- Criar tabela education_profiles
CREATE TABLE IF NOT EXISTS education_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Dados da instituicao
  institution_type VARCHAR(50) NOT NULL DEFAULT 'school',
  niche_key VARCHAR(50) NOT NULL DEFAULT 'regular_school',
  support_level VARCHAR(50) NOT NULL DEFAULT 'basic_enabled',
  
  -- Conteudo
  summary TEXT,
  whatsapp_number VARCHAR(20),
  
  -- Status e publicacao
  status education_profile_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  
  -- Configuracao por nicho (overrides)
  niche_config_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE education_profiles IS 'Perfis de instituicoes de educacao vinculadas a businesses';
COMMENT ON COLUMN education_profiles.niche_key IS 'Chave do nicho (regular_school, daycare, language_school, etc)';
COMMENT ON COLUMN education_profiles.support_level IS 'Nivel de suporte: full_enabled, basic_enabled, beta, planned';
COMMENT ON COLUMN education_profiles.niche_config_overrides IS 'Overrides de configuracao do nicho (JSONB)';

-- Constraint para validar niche_key
ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_niche_key 
  CHECK (niche_key IN (
    'regular_school', 'daycare', 'language_school', 'prep_course',
    'technical_school', 'tutoring_center', 'music_school', 'sports_school'
  ));

-- Constraint para validar support_level
ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_support_level 
  CHECK (support_level IN ('full_enabled', 'basic_enabled', 'beta', 'planned'));

-- Constraint: apenas um perfil por business
CREATE UNIQUE INDEX idx_education_profiles_business_unique 
  ON education_profiles(business_id) 
  WHERE status != 'draft';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_education_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_education_profiles_updated_at ON education_profiles;
CREATE TRIGGER trg_education_profiles_updated_at
  BEFORE UPDATE ON education_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_education_profiles_updated_at();

-- RLS
ALTER TABLE education_profiles ENABLE ROW LEVEL SECURITY;

-- Politica: leitura publica para perfis publicados
CREATE POLICY education_profiles_select_public
  ON education_profiles
  FOR SELECT
  USING (status = 'published');

-- Politica: owner/manager pode ler/escrever seus proprios perfis
CREATE POLICY education_profiles_owner_all
  ON education_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_data bd
      WHERE bd.id = education_profiles.business_id
        AND bd.profile_id = auth.uid()
    )
  );
