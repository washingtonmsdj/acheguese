-- ============================================================================
-- MIGRATION: Create Business Domain Tables
-- ============================================================================
-- Etapa: 1.4.1 - Business Domain
-- Data: 2026-04-18
-- Descrição: Cria tabelas do domínio de negócios (business_data e relacionadas)
--
-- SSOT PRINCIPLES:
--   - business_data é SSOT para identidade de negócios
--   - Mantém compatibilidade com código existente
--   - Usa enums para status e categorias
--   - RLS habilitado em todas as tabelas
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Status de negócios
DO $$ BEGIN
  CREATE TYPE business_status AS ENUM (
    'active',
    'inactive',
    'pending',
    'suspended',
    'deleted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- BUSINESS_DATA - SSOT para identidade de negócios
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_data (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Identificação
  business_name  TEXT NOT NULL,
  description    TEXT,
  slug           TEXT UNIQUE,
  
  -- Categorização
  category       TEXT,
  subcategory    TEXT,
  
  -- Localização (endereço legado - SSOT é locations)
  address        TEXT,
  latitude       DECIMAL(10,7),
  longitude      DECIMAL(10,7),
  location_id    UUID REFERENCES locations(id) ON DELETE SET NULL,
  
  -- Contato
  email          TEXT,
  website        TEXT,
  instagram      TEXT,
  facebook       TEXT,
  
  -- Operação
  opening_hours  JSONB DEFAULT '{}',
  payment_methods JSONB DEFAULT '[]',
  specialties    JSONB DEFAULT '[]',
  facilities     JSONB DEFAULT '[]',
  
  -- Status e verificação
  is_premium     BOOLEAN NOT NULL DEFAULT false,
  is_verified    BOOLEAN NOT NULL DEFAULT false,
  status         business_status NOT NULL DEFAULT 'active',
  
  -- Métricas agregadas (cache)
  rating         DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews  INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  total_products INTEGER NOT NULL DEFAULT 0 CHECK (total_products >= 0),
  
  -- Metadados
  metadata       JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT business_data_profile_id_unique UNIQUE (profile_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_data_profile_id ON business_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_business_data_status ON business_data(status);
CREATE INDEX IF NOT EXISTS idx_business_data_category ON business_data(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_data_is_premium ON business_data(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_business_data_location_id ON business_data(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_data_slug ON business_data(slug) WHERE slug IS NOT NULL;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_business_data_updated_at ON business_data;
CREATE TRIGGER update_business_data_updated_at 
  BEFORE UPDATE ON business_data
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE business_data ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Active businesses viewable" ON business_data;
CREATE POLICY "Active businesses viewable" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (status = 'active');

DROP POLICY IF EXISTS "Owners manage own business" ON business_data;
CREATE POLICY "Owners manage own business" 
  ON business_data FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- BUSINESS_STATS - Estatísticas de negócios
-- ============================================================================

-- Criar tabela se não existir (com profile_id para compatibilidade legada)
CREATE TABLE IF NOT EXISTS business_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contadores
  views_count     INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  favorites_count INTEGER NOT NULL DEFAULT 0 CHECK (favorites_count >= 0),
  shares_count    INTEGER NOT NULL DEFAULT 0 CHECK (shares_count >= 0),
  
  -- Timestamp
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT business_stats_profile_id_unique UNIQUE (profile_id)
);

-- Adicionar business_id se não existir (para nova arquitetura)
DO $$ BEGIN
  ALTER TABLE business_stats ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES business_data(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_stats_profile_id ON business_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_business_stats_business_id ON business_stats(business_id) WHERE business_id IS NOT NULL;

-- RLS
ALTER TABLE business_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business stats viewable" ON business_stats;
CREATE POLICY "Business stats viewable" 
  ON business_stats FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Owners manage own stats" ON business_stats;
CREATE POLICY "Owners manage own stats" 
  ON business_stats FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- BUSINESS_VIEWS - Registro de visualizações
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  viewer_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamp
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_views_business_id ON business_views(business_id);
CREATE INDEX IF NOT EXISTS idx_business_views_viewed_at ON business_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_views_viewer_id ON business_views(viewer_id) WHERE viewer_id IS NOT NULL;

-- RLS
ALTER TABLE business_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business views insertable" ON business_views;
CREATE POLICY "Business views insertable" 
  ON business_views FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners view own business views" ON business_views;
CREATE POLICY "Owners view own business views" 
  ON business_views FOR SELECT 
  TO authenticated
  USING (
    business_id IN (
      SELECT bd.id FROM business_data bd
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- BUSINESS_GALLERY - Galeria de imagens do negócio
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_gallery (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Imagem
  image_url   TEXT NOT NULL,
  caption     TEXT,
  
  -- Ordenação e destaque
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_gallery_business_id ON business_gallery(business_id);
CREATE INDEX IF NOT EXISTS idx_business_gallery_display_order ON business_gallery(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_business_gallery_featured ON business_gallery(business_id, is_featured) WHERE is_featured = true;

-- Trigger
DROP TRIGGER IF EXISTS update_business_gallery_updated_at ON business_gallery;
CREATE TRIGGER update_business_gallery_updated_at 
  BEFORE UPDATE ON business_gallery
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE business_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business gallery viewable" ON business_gallery;
CREATE POLICY "Business gallery viewable" 
  ON business_gallery FOR SELECT 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Owners manage own gallery" ON business_gallery;
CREATE POLICY "Owners manage own gallery" 
  ON business_gallery FOR ALL 
  TO authenticated
  USING (
    business_id IN (
      SELECT bd.id FROM business_data bd
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- BUSINESS_CLAIMS - Reivindicações de propriedade de negócios
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_claims (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Timestamp
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas se não existirem
DO $$ BEGIN
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS claimer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS review_notes TEXT;
  ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN others THEN NULL;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_claims_business_id ON business_claims(business_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_claimer_id ON business_claims(claimer_id) WHERE claimer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_claims_status ON business_claims(status) WHERE status IS NOT NULL;

-- Trigger
DROP TRIGGER IF EXISTS update_business_claims_updated_at ON business_claims;
CREATE TRIGGER update_business_claims_updated_at 
  BEFORE UPDATE ON business_claims
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own claims" ON business_claims;
CREATE POLICY "Users view own claims" 
  ON business_claims FOR SELECT 
  TO authenticated
  USING (claimer_id = auth.uid() OR claimer_id IS NULL);

DROP POLICY IF EXISTS "Users create claims" ON business_claims;
CREATE POLICY "Users create claims" 
  ON business_claims FOR INSERT 
  TO authenticated
  WITH CHECK (claimer_id = auth.uid() OR claimer_id IS NULL);

DROP POLICY IF EXISTS "Users update own pending claims" ON business_claims;
CREATE POLICY "Users update own pending claims" 
  ON business_claims FOR UPDATE 
  TO authenticated
  USING ((claimer_id = auth.uid() OR claimer_id IS NULL) AND (status = 'pending' OR status IS NULL));

-- ============================================================================
-- CATEGORIES - Categorias de negócios (SSOT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hierarquia
  parent_id   UUID REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Identificação
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  
  -- Ordenação e visibilidade
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadados
  metadata    JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Trigger
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active categories viewable" ON categories;
CREATE POLICY "Active categories viewable" 
  ON categories FOR SELECT 
  TO anon, authenticated 
  USING (is_active = true);

-- ============================================================================
-- BUSINESS_PRODUCTS - Produtos de negócios (legado)
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Produto
  nome              TEXT NOT NULL,
  descricao         TEXT,
  categoria         TEXT,
  
  -- Preço
  preco             DECIMAL(10,2),
  preco_promocional DECIMAL(10,2),
  
  -- Mídia
  imagem            TEXT,
  
  -- Estoque e status
  estoque           INTEGER DEFAULT 0 CHECK (estoque >= 0),
  ativo             BOOLEAN NOT NULL DEFAULT true,
  destaque          BOOLEAN NOT NULL DEFAULT false,
  promocao          BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_products_profile_id ON business_products(profile_id);
CREATE INDEX IF NOT EXISTS idx_business_products_ativo ON business_products(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_business_products_categoria ON business_products(categoria) WHERE categoria IS NOT NULL;

-- Trigger
DROP TRIGGER IF EXISTS update_business_products_updated_at ON business_products;
CREATE TRIGGER update_business_products_updated_at 
  BEFORE UPDATE ON business_products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active products viewable" ON business_products;
CREATE POLICY "Active products viewable" 
  ON business_products FOR SELECT 
  TO anon, authenticated 
  USING (ativo = true);

DROP POLICY IF EXISTS "Owners manage own products" ON business_products;
CREATE POLICY "Owners manage own products" 
  ON business_products FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- BUSINESS_SERVICES - Serviços de negócios
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Serviço
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10,2),
  duration    INTEGER CHECK (duration > 0), -- minutos
  
  -- Status
  is_active   BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamp
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_services_business_id ON business_services(business_id);
CREATE INDEX IF NOT EXISTS idx_business_services_is_active ON business_services(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active services viewable" ON business_services;
CREATE POLICY "Active services viewable" 
  ON business_services FOR SELECT 
  TO anon, authenticated 
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners manage own services" ON business_services;
CREATE POLICY "Owners manage own services" 
  ON business_services FOR ALL 
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- BUSINESS_FAVORITES - Favoritos de negócios
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamp
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_business_favorite UNIQUE (business_id, profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_favorites_business_id ON business_favorites(business_id);
CREATE INDEX IF NOT EXISTS idx_business_favorites_profile_id ON business_favorites(profile_id);

-- RLS
ALTER TABLE business_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own business favorites" ON business_favorites;
CREATE POLICY "Users manage own business favorites" 
  ON business_favorites FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE business_data IS 'SSOT para identidade e dados de negócios';
COMMENT ON TABLE business_stats IS 'Estatísticas agregadas de negócios';
COMMENT ON TABLE business_views IS 'Registro de visualizações de negócios';
COMMENT ON TABLE business_gallery IS 'Galeria de imagens de negócios';
COMMENT ON TABLE business_claims IS 'Reivindicações de propriedade de negócios';
COMMENT ON TABLE categories IS 'SSOT para categorias de negócios';
COMMENT ON TABLE business_products IS 'Produtos de negócios (legado)';
COMMENT ON TABLE business_services IS 'Serviços oferecidos por negócios';
COMMENT ON TABLE business_favorites IS 'Favoritos de negócios por usuários';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
