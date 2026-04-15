-- ══════════════════════════════════════════════════════════════════════════
-- GASTRONOMY MENU CATEGORIES
-- ══════════════════════════════════════════════════════════════════════════
-- Categorias de cardápio para organização de itens

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(menu_id, name)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu ON menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(menu_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON menu_categories(is_active);

-- RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Público pode ver categorias ativas
DROP POLICY IF EXISTS "Public can view active categories" ON menu_categories;
DROP POLICY IF EXISTS "Public can view active categories" ON menu_categories;
CREATE POLICY "Public can view active categories" ON menu_categories FOR SELECT
  USING (is_active = TRUE);

-- Donos de empresas podem gerenciar suas categorias
DROP POLICY IF EXISTS "Business owners can manage categories" ON menu_categories;
DROP POLICY IF EXISTS "Business owners can manage categories" ON menu_categories;
CREATE POLICY "Business owners can manage categories" ON menu_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM menus gm
      JOIN gastronomy_profiles gp ON gm.business_id = gp.business_id
      JOIN business_data bd ON gp.business_id = bd.id
      WHERE gm.id = menu_id
        AND bd.profile_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE menu_categories IS 'Categorias de cardápio para organização de itens';
COMMENT ON COLUMN menu_categories.display_order IS 'Ordem de exibição (menor = primeiro)';
