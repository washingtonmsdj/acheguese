-- ============================================================================
-- GASTRONOMY NICHE: PIZZARIA
-- ============================================================================
-- Estrutura nativa para pizzas compostas sem special_instructions/metadata.
-- Mantem carrinho, checkout, pedidos, delivery e pagamentos compartilhados.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pizza_niche_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  default_price_rule TEXT NOT NULL DEFAULT 'highest_price' CHECK (
    default_price_rule IN (
      'highest_price',
      'average_price',
      'weighted_average',
      'fixed_base_plus_flavors'
    )
  ),
  allow_half_half BOOLEAN NOT NULL DEFAULT true,
  allow_three_flavors BOOLEAN NOT NULL DEFAULT true,
  allow_four_flavors BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pizza_niche_configs_business_unique UNIQUE (business_id)
);

CREATE TABLE IF NOT EXISTS pizza_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  slices INTEGER CHECK (slices IS NULL OR slices > 0),
  diameter_cm INTEGER CHECK (diameter_cm IS NULL OR diameter_cm > 0),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  max_flavors INTEGER NOT NULL DEFAULT 1 CHECK (max_flavors BETWEEN 1 AND 4),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pizza_sizes_business_slug_unique UNIQUE (business_id, slug)
);

CREATE TABLE IF NOT EXISTS pizza_flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_vegan BOOLEAN NOT NULL DEFAULT false,
  is_spicy BOOLEAN NOT NULL DEFAULT false,
  allergens TEXT[] NOT NULL DEFAULT '{}',
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pizza_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pizza_doughs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_adjustment >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pizza_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  is_buildable BOOLEAN NOT NULL DEFAULT true,
  default_size_id UUID REFERENCES pizza_sizes(id) ON DELETE SET NULL,
  default_edge_id UUID REFERENCES pizza_edges(id) ON DELETE SET NULL,
  default_dough_id UUID REFERENCES pizza_doughs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pizza_menu_items_menu_item_unique UNIQUE (menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_pizza_sizes_business ON pizza_sizes(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pizza_flavors_business ON pizza_flavors(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pizza_edges_business ON pizza_edges(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pizza_doughs_business ON pizza_doughs(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pizza_menu_items_business ON pizza_menu_items(business_id);

ALTER TABLE gastronomy_profiles
  ADD COLUMN IF NOT EXISTS niche_key TEXT;

UPDATE gastronomy_profiles
SET niche_key = 'pizza'
WHERE niche_key IS NULL AND cuisine_type IN ('pizzaria', 'pizza');
