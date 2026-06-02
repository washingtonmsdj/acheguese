-- ============================================================================
-- MIGRATION: Create Gastronomy Domain Tables
-- ============================================================================
-- Etapa: 1.4.2 - Gastronomy Domain
-- Data: 2026-04-18
-- Descrição: Cria tabelas do domínio de gastronomia (extensão de business_data)
--
-- SSOT PRINCIPLES:
--   - Gastronomia é especialização, não duplicação
--   - business_data continua sendo SSOT de identidade
--   - Reutiliza: endereço, território, avaliações, galeria
--   - Estende: dados específicos de gastronomia e cardápio robusto
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Status de perfil gastronômico
DO $migration$ BEGIN
  CREATE TYPE gastronomy_status AS ENUM (
    'active',
    'inactive',
    'temporarily_closed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

-- Faixa de preço
DO $migration$ BEGIN
  CREATE TYPE price_range AS ENUM (
    '$',
    '$$',
    '$$$'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

-- Tipo de desconto
DO $migration$ BEGIN
  CREATE TYPE discount_type AS ENUM (
    'percentage',
    'fixed_amount',
    'buy_x_get_y'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

-- ============================================================================
-- 1. GASTRONOMY_PROFILES - Perfil Gastronômico (extensão de business)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gastronomy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para business_data (SSOT de identidade)
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Tipo de culinária
  cuisine_type TEXT NOT NULL,
  cuisine_subtypes TEXT[] DEFAULT '{}',
  
  -- Faixa de preço
  price_range price_range NOT NULL DEFAULT '$',
  
  -- Modos de atendimento
  delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  takeout_enabled BOOLEAN NOT NULL DEFAULT false,
  dine_in_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Informações de entrega
  delivery_fee DECIMAL(10,2),
  delivery_time_min INTEGER CHECK (delivery_time_min > 0), -- minutos
  delivery_time_max INTEGER CHECK (delivery_time_max > 0), -- minutos
  minimum_order DECIMAL(10,2),
  
  -- Recursos
  accepts_reservations BOOLEAN NOT NULL DEFAULT false,
  has_parking BOOLEAN NOT NULL DEFAULT false,
  has_wifi BOOLEAN NOT NULL DEFAULT false,
  has_accessibility BOOLEAN NOT NULL DEFAULT false,
  has_kids_area BOOLEAN NOT NULL DEFAULT false,
  has_live_music BOOLEAN NOT NULL DEFAULT false,
  
  -- Capacidade
  seating_capacity INTEGER CHECK (seating_capacity > 0),
  
  -- Status operacional
  status gastronomy_status NOT NULL DEFAULT 'active',
  
  -- Metadados adicionais
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT gastronomy_profiles_business_id_unique UNIQUE (business_id),
  CONSTRAINT delivery_time_valid CHECK (delivery_time_max IS NULL OR delivery_time_min IS NULL OR delivery_time_max >= delivery_time_min)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_business_id ON gastronomy_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_cuisine_type ON gastronomy_profiles(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_delivery_enabled ON gastronomy_profiles(delivery_enabled) WHERE delivery_enabled = true;
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_status ON gastronomy_profiles(status);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_plan_tier ON gastronomy_profiles(plan_tier);

-- Trigger
DROP TRIGGER IF EXISTS update_gastronomy_profiles_updated_at ON gastronomy_profiles;
CREATE TRIGGER update_gastronomy_profiles_updated_at
  BEFORE UPDATE ON gastronomy_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE gastronomy_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active gastronomy profiles viewable" ON gastronomy_profiles;
CREATE POLICY "Active gastronomy profiles viewable"
  ON gastronomy_profiles FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Owners manage own gastronomy profile" ON gastronomy_profiles;
CREATE POLICY "Owners manage own gastronomy profile"
  ON gastronomy_profiles FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT bd.id FROM business_data bd
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. MENUS - Container do Cardápio
-- ============================================================================

CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para business_data
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  
  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Disponibilidade temporal (opcional)
  available_days INTEGER[] CHECK (
    available_days IS NULL OR 
    (array_length(available_days, 1) IS NULL OR 
     (SELECT bool_and(day >= 0 AND day <= 6) FROM unnest(available_days) AS day))
  ),
  available_start_time TIME,
  available_end_time TIME,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menus_business_id ON menus(business_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON menus(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menus_display_order ON menus(business_id, display_order);

-- Trigger
DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active menus viewable" ON menus;
CREATE POLICY "Active menus viewable"
  ON menus FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners manage own menus" ON menus;
CREATE POLICY "Owners manage own menus"
  ON menus FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT bd.id FROM business_data bd
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. MENU_CATEGORIES - Categorias do Cardápio
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para menu
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  
  -- Ordenação e disponibilidade
  display_order INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_display_order ON menu_categories(menu_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_is_available ON menu_categories(is_available) WHERE is_available = true;

-- Trigger
DROP TRIGGER IF EXISTS update_menu_categories_updated_at ON menu_categories;
CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Available categories viewable" ON menu_categories;
CREATE POLICY "Available categories viewable"
  ON menu_categories FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS "Owners manage own categories" ON menu_categories;
CREATE POLICY "Owners manage own categories"
  ON menu_categories FOR ALL
  TO authenticated
  USING (
    menu_id IN (
      SELECT m.id FROM menus m
      JOIN business_data bd ON bd.id = m.business_id
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. MENU_ITEMS - Itens do Cardápio
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para categoria
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  
  -- Preço base
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  
  -- Mídia
  image_url TEXT,
  
  -- Informações nutricionais e dietéticas
  preparation_time INTEGER CHECK (preparation_time > 0), -- minutos
  calories INTEGER CHECK (calories >= 0),
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_vegan BOOLEAN NOT NULL DEFAULT false,
  is_gluten_free BOOLEAN NOT NULL DEFAULT false,
  is_lactose_free BOOLEAN NOT NULL DEFAULT false,
  is_spicy BOOLEAN NOT NULL DEFAULT false,
  spicy_level INTEGER CHECK (spicy_level BETWEEN 1 AND 5),
  
  -- Ingredientes e alérgenos
  ingredients TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  
  -- Controle
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadados
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_display_order ON menu_items(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_featured ON menu_items(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_vegetarian ON menu_items(is_vegetarian) WHERE is_vegetarian = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_is_vegan ON menu_items(is_vegan) WHERE is_vegan = true;

-- Trigger
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Available items viewable" ON menu_items;
CREATE POLICY "Available items viewable"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS "Owners manage own items" ON menu_items;
CREATE POLICY "Owners manage own items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    category_id IN (
      SELECT mc.id FROM menu_categories mc
      JOIN menus m ON m.id = mc.menu_id
      JOIN business_data bd ON bd.id = m.business_id
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. MENU_ITEM_VARIANTS - Variações (tamanhos, sabores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para item
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL, -- ex: "Pequeno", "Médio", "Grande"
  description TEXT,
  
  -- Ajuste de preço (pode ser negativo para desconto)
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Controle
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_item_variants_item_id ON menu_item_variants(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_variants_display_order ON menu_item_variants(item_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_item_variants_is_default ON menu_item_variants(item_id, is_default) WHERE is_default = true;

-- Trigger
DROP TRIGGER IF EXISTS update_menu_item_variants_updated_at ON menu_item_variants;
CREATE TRIGGER update_menu_item_variants_updated_at
  BEFORE UPDATE ON menu_item_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Available variants viewable" ON menu_item_variants;
CREATE POLICY "Available variants viewable"
  ON menu_item_variants FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS "Owners manage own variants" ON menu_item_variants;
CREATE POLICY "Owners manage own variants"
  ON menu_item_variants FOR ALL
  TO authenticated
  USING (
    item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      JOIN menus m ON m.id = mc.menu_id
      JOIN business_data bd ON bd.id = m.business_id
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. MENU_ITEM_ADDONS - Adicionais
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para item
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL, -- ex: "Queijo extra", "Bacon"
  description TEXT,
  
  -- Preço
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  
  -- Controle de quantidade
  max_quantity INTEGER NOT NULL DEFAULT 1 CHECK (max_quantity > 0),
  
  -- Controle
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_item_addons_item_id ON menu_item_addons(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_addons_display_order ON menu_item_addons(item_id, display_order);

-- Trigger
DROP TRIGGER IF EXISTS update_menu_item_addons_updated_at ON menu_item_addons;
CREATE TRIGGER update_menu_item_addons_updated_at
  BEFORE UPDATE ON menu_item_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menu_item_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Available addons viewable" ON menu_item_addons;
CREATE POLICY "Available addons viewable"
  ON menu_item_addons FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS "Owners manage own addons" ON menu_item_addons;
CREATE POLICY "Owners manage own addons"
  ON menu_item_addons FOR ALL
  TO authenticated
  USING (
    item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      JOIN menus m ON m.id = mc.menu_id
      JOIN business_data bd ON bd.id = m.business_id
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. MENU_ITEM_AVAILABILITY - Disponibilidade Temporal
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_item_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para item
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  
  -- Dia da semana (0=domingo, 6=sábado)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Horário
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Controle
  is_available BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_item_availability_item_id ON menu_item_availability(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_availability_day ON menu_item_availability(day_of_week);

-- Trigger
DROP TRIGGER IF EXISTS update_menu_item_availability_updated_at ON menu_item_availability;
CREATE TRIGGER update_menu_item_availability_updated_at
  BEFORE UPDATE ON menu_item_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menu_item_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Availability viewable" ON menu_item_availability;
CREATE POLICY "Availability viewable"
  ON menu_item_availability FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners manage own availability" ON menu_item_availability;
CREATE POLICY "Owners manage own availability"
  ON menu_item_availability FOR ALL
  TO authenticated
  USING (
    item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      JOIN menus m ON m.id = mc.menu_id
      JOIN business_data bd ON bd.id = m.business_id
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. MENU_PROMOTIONS - Promoções
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para business
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Identificação
  title TEXT NOT NULL,
  description TEXT,
  
  -- Tipo de desconto
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  
  -- Regras (para buy_x_get_y)
  rules JSONB DEFAULT '{}',
  
  -- Itens aplicáveis (array de item_ids, vazio = todos)
  applicable_items UUID[] DEFAULT '{}',
  
  -- Vigência
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (valid_until > valid_from)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_promotions_business_id ON menu_promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_promotions_active ON menu_promotions(business_id, is_active, valid_until) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_promotions_validity ON menu_promotions(valid_from, valid_until);

-- Trigger
DROP TRIGGER IF EXISTS update_menu_promotions_updated_at ON menu_promotions;
CREATE TRIGGER update_menu_promotions_updated_at
  BEFORE UPDATE ON menu_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menu_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active promotions viewable" ON menu_promotions;
CREATE POLICY "Active promotions viewable"
  ON menu_promotions FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND valid_from <= NOW() AND valid_until >= NOW());

DROP POLICY IF EXISTS "Owners manage own promotions" ON menu_promotions;
CREATE POLICY "Owners manage own promotions"
  ON menu_promotions FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT bd.id FROM business_data bd
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para obter itens em destaque de um negócio
CREATE OR REPLACE FUNCTION get_featured_menu_items(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  base_price DECIMAL,
  image_url TEXT,
  category_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.id,
    mi.name,
    mi.description,
    mi.base_price,
    mi.image_url,
    mc.name as category_name
  FROM menu_items mi
  JOIN menu_categories mc ON mc.id = mi.category_id
  JOIN menus m ON m.id = mc.menu_id
  WHERE m.business_id = p_business_id
    AND mi.is_featured = true
    AND mi.is_available = true
    AND mc.is_available = true
    AND m.is_active = true
  ORDER BY mi.display_order;
END;
$$;

-- Função para obter promoções ativas de um negócio
CREATE OR REPLACE FUNCTION get_active_promotions(p_business_id UUID)
RETURNS SETOF menu_promotions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM menu_promotions
  WHERE business_id = p_business_id
    AND is_active = true
    AND valid_from <= NOW()
    AND valid_until >= NOW()
  ORDER BY created_at DESC;
END;
$$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE gastronomy_profiles IS 'Perfis gastronômicos - extensão de business_data para negócios de alimentação';
COMMENT ON TABLE menus IS 'Containers de cardápio - um negócio pode ter múltiplos menus (almoço, jantar, etc)';
COMMENT ON TABLE menu_categories IS 'Categorias do cardápio (entradas, pratos principais, sobremesas, etc)';
COMMENT ON TABLE menu_items IS 'Itens do cardápio com informações nutricionais e dietéticas';
COMMENT ON TABLE menu_item_variants IS 'Variações de itens (tamanhos, sabores, etc)';
COMMENT ON TABLE menu_item_addons IS 'Adicionais disponíveis para itens';
COMMENT ON TABLE menu_item_availability IS 'Disponibilidade temporal de itens (ex: café da manhã apenas até 11h)';
COMMENT ON TABLE menu_promotions IS 'Promoções e descontos aplicáveis ao cardápio';

COMMENT ON FUNCTION get_featured_menu_items(UUID) IS 'Retorna itens em destaque de um negócio gastronômico';
COMMENT ON FUNCTION get_active_promotions(UUID) IS 'Retorna promoções ativas de um negócio gastronômico';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
