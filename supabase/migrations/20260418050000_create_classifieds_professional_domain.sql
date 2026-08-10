-- ============================================================================
-- MIGRATION: Create Classifieds & Professional Domain Tables
-- ============================================================================
-- Etapa: 1.4.3 - Classifieds & Professional Domain
-- Data: 2026-04-18
-- Descrição: Cria tabelas dos domínios de profissionais e classificados
--
-- SSOT PRINCIPLES:
--   - professional_data é extensão de profiles
--   - classifieds é módulo independente
--   - Reutiliza estruturas existentes (locations, profiles)
--   - RLS habilitado em todas as tabelas
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Status de classificados
CREATE TYPE classified_status AS ENUM (
  'active',
  'inactive',
  'sold',
  'expired',
  'deleted'
);

-- Condição do item
CREATE TYPE item_condition AS ENUM (
  'new',
  'like_new',
  'good',
  'fair',
  'poor'
);

-- Status de trabalhos profissionais
CREATE TYPE job_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

-- Tipo de review
CREATE TYPE review_type AS ENUM (
  'business',
  'professional',
  'service'
);

-- ============================================================================
-- 1. PROFESSIONAL_DATA - Dados de Profissionais
-- ============================================================================

CREATE TABLE IF NOT EXISTS professional_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para profiles
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Identificação
  professional_name TEXT,
  
  -- Categorização
  service_category TEXT,
  service_subcategory TEXT,
  description TEXT,
  
  -- Qualificações
  certifications JSONB DEFAULT '[]',
  experience_years INTEGER CHECK (experience_years >= 0),
  education TEXT,
  
  -- Preço e área de atuação
  price_range TEXT,
  service_areas JSONB DEFAULT '[]',
  service_radius_km DECIMAL(5,2) CHECK (service_radius_km > 0),
  
  -- Disponibilidade
  available_hours JSONB DEFAULT '{}',
  
  -- Contato
  whatsapp TEXT,
  email TEXT,
  
  -- Status
  is_accepting_clients BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Métricas
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  
  -- Localização
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  
  -- Metadados
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT professional_data_profile_id_unique UNIQUE (profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_professional_data_profile_id ON professional_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_data_category ON professional_data(service_category) WHERE service_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_professional_data_accepting ON professional_data(is_accepting_clients) WHERE is_accepting_clients = true;
CREATE INDEX IF NOT EXISTS idx_professional_data_location_id ON professional_data(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_professional_data_verified ON professional_data(is_verified) WHERE is_verified = true;

-- Trigger
DROP TRIGGER IF EXISTS update_professional_data_updated_at ON professional_data;
CREATE TRIGGER update_professional_data_updated_at
  BEFORE UPDATE ON professional_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE professional_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals viewable" ON professional_data;
CREATE POLICY "Professionals viewable"
  ON professional_data FOR SELECT
  TO anon, authenticated
  USING (is_accepting_clients = true);

DROP POLICY IF EXISTS "Owners manage own professional data" ON professional_data;
CREATE POLICY "Owners manage own professional data"
  ON professional_data FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. PROFESSIONAL_STATS - Estatísticas de Profissionais
-- ============================================================================

CREATE TABLE IF NOT EXISTS professional_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contadores
  views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  contacts_count INTEGER NOT NULL DEFAULT 0 CHECK (contacts_count >= 0),
  favorites_count INTEGER NOT NULL DEFAULT 0 CHECK (favorites_count >= 0),
  shares_count INTEGER NOT NULL DEFAULT 0 CHECK (shares_count >= 0),
  jobs_completed INTEGER NOT NULL DEFAULT 0 CHECK (jobs_completed >= 0),
  
  -- Métricas de resposta
  response_rate DECIMAL(5,2) DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 100),
  average_response_time INTEGER DEFAULT 0 CHECK (average_response_time >= 0), -- minutos
  
  -- Timestamp
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT professional_stats_profile_id_unique UNIQUE (profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_professional_stats_profile_id ON professional_stats(profile_id);

-- RLS
ALTER TABLE professional_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional stats viewable" ON professional_stats;
CREATE POLICY "Professional stats viewable"
  ON professional_stats FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners manage own professional stats" ON professional_stats;
CREATE POLICY "Owners manage own professional stats"
  ON professional_stats FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. PROFESSIONAL_FAVORITES - Favoritos de Profissionais
-- ============================================================================

CREATE TABLE IF NOT EXISTS professional_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_professional_favorite UNIQUE (professional_id, profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_professional_favorites_professional_id ON professional_favorites(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_favorites_profile_id ON professional_favorites(profile_id);

-- RLS
ALTER TABLE professional_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own professional favorites" ON professional_favorites;
CREATE POLICY "Users manage own professional favorites"
  ON professional_favorites FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. PROFESSIONAL_JOBS - Trabalhos de Profissionais
-- ============================================================================

CREATE TABLE IF NOT EXISTS professional_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Profissional
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Cliente
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Trabalho
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status job_status NOT NULL DEFAULT 'pending',
  
  -- Preço
  price DECIMAL(10,2) CHECK (price >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_professional_jobs_profile_id ON professional_jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_jobs_client_id ON professional_jobs(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_professional_jobs_status ON professional_jobs(status);

-- Trigger
DROP TRIGGER IF EXISTS update_professional_jobs_updated_at ON professional_jobs;
CREATE TRIGGER update_professional_jobs_updated_at
  BEFORE UPDATE ON professional_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE professional_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job participants can view" ON professional_jobs;
CREATE POLICY "Job participants can view"
  ON professional_jobs FOR SELECT
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Professionals manage own jobs" ON professional_jobs;
CREATE POLICY "Professionals manage own jobs"
  ON professional_jobs FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. REVIEWS - Avaliações
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quem está sendo avaliado
  reviewed_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Quem está avaliando
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Tipo
  review_type review_type NOT NULL DEFAULT 'business',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_review UNIQUE (reviewed_profile_id, reviewer_profile_id, review_type),
  CONSTRAINT no_self_review CHECK (reviewed_profile_id <> reviewer_profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_profile_id ON reviews(reviewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_profile_id ON reviews(reviewer_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(review_type);

-- Trigger
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews viewable" ON reviews;
CREATE POLICY "Reviews viewable"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own reviews" ON reviews;
CREATE POLICY "Users manage own reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (
    reviewer_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. CLASSIFIEDS - Anúncios Classificados
-- ============================================================================

CREATE TABLE IF NOT EXISTS classifieds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp mínimo (sempre presente)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
  -- Anunciante
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'profile_id') THEN
    ALTER TABLE classifieds ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Anúncio
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'title') THEN
    ALTER TABLE classifieds ADD COLUMN title TEXT NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'description') THEN
    ALTER TABLE classifieds ADD COLUMN description TEXT;
  END IF;
  
  -- Preço
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'price') THEN
    ALTER TABLE classifieds ADD COLUMN price DECIMAL(10,2) CHECK (price >= 0);
  END IF;
  
  -- Categorização
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'category') THEN
    ALTER TABLE classifieds ADD COLUMN category TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'condition') THEN
    ALTER TABLE classifieds ADD COLUMN condition item_condition;
  END IF;
  
  -- Mídia
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'photos') THEN
    ALTER TABLE classifieds ADD COLUMN photos JSONB DEFAULT '[]';
  END IF;
  
  -- Localização
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'latitude') THEN
    ALTER TABLE classifieds ADD COLUMN latitude DECIMAL(10,7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'longitude') THEN
    ALTER TABLE classifieds ADD COLUMN longitude DECIMAL(10,7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'neighborhood') THEN
    ALTER TABLE classifieds ADD COLUMN neighborhood TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'location_id') THEN
    ALTER TABLE classifieds ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
  
  -- Status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'status') THEN
    ALTER TABLE classifieds ADD COLUMN status classified_status NOT NULL DEFAULT 'active';
  END IF;
  
  -- Timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classifieds' AND column_name = 'updated_at') THEN
    ALTER TABLE classifieds ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_classifieds_profile_id ON classifieds(profile_id);
CREATE INDEX IF NOT EXISTS idx_classifieds_status ON classifieds(status);
CREATE INDEX IF NOT EXISTS idx_classifieds_category ON classifieds(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classifieds_location_id ON classifieds(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classifieds_condition ON classifieds(condition) WHERE condition IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classifieds_created_at ON classifieds(created_at DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_classifieds_updated_at ON classifieds;
CREATE TRIGGER update_classifieds_updated_at
  BEFORE UPDATE ON classifieds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active classifieds viewable" ON classifieds;
CREATE POLICY "Active classifieds viewable"
  ON classifieds FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Owners manage own classifieds" ON classifieds;
CREATE POLICY "Owners manage own classifieds"
  ON classifieds FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. CLASSIFIED_LIKES - Curtidas em Classificados
-- ============================================================================

CREATE TABLE IF NOT EXISTS classified_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_classified_like UNIQUE (classified_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_classified_likes_classified_id ON classified_likes(classified_id);
CREATE INDEX IF NOT EXISTS idx_classified_likes_user_id ON classified_likes(user_id);

-- RLS
ALTER TABLE classified_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own classified likes" ON classified_likes;
CREATE POLICY "Users manage own classified likes"
  ON classified_likes FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE professional_data IS 'Dados de profissionais - extensão de profiles para prestadores de serviço';
COMMENT ON TABLE professional_stats IS 'Estatísticas agregadas de profissionais';
COMMENT ON TABLE professional_favorites IS 'Favoritos de profissionais por usuários';
COMMENT ON TABLE professional_jobs IS 'Trabalhos e serviços prestados por profissionais';
COMMENT ON TABLE reviews IS 'Avaliações de negócios, profissionais e serviços';
COMMENT ON TABLE classifieds IS 'Anúncios classificados de produtos e serviços';
COMMENT ON TABLE classified_likes IS 'Curtidas em anúncios classificados';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
