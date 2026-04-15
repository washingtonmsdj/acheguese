-- ══════════════════════════════════════════════════════════════════════════
-- GASTRONOMY MENU ADDONS & COMBOS
-- ══════════════════════════════════════════════════════════════════════════
-- Adicionais e combos para itens de cardápio

-- ── ADICIONAIS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gastronomy_menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  max_quantity INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(item_id, name)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_item_addons_item ON gastronomy_menu_item_addons(item_id);
CREATE INDEX IF NOT EXISTS idx_item_addons_available ON gastronomy_menu_item_addons(is_available);

-- RLS
ALTER TABLE gastronomy_menu_item_addons ENABLE ROW LEVEL SECURITY;

-- Público pode ver adicionais disponíveis
DROP POLICY IF EXISTS "Public can view available addons" ON gastronomy_menu_item_addons;
DROP POLICY IF EXISTS "Public can view available addons" ON gastronomy_menu_item_addons;
CREATE POLICY "Public can view available addons" ON gastronomy_menu_item_addons FOR SELECT
  USING (is_available = TRUE);

-- Donos de empresas podem gerenciar adicionais
DROP POLICY IF EXISTS "Business owners can manage addons" ON gastronomy_menu_item_addons;
DROP POLICY IF EXISTS "Business owners can manage addons" ON gastronomy_menu_item_addons;
CREATE POLICY "Business owners can manage addons" ON gastronomy_menu_item_addons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM menu_items gmi
      JOIN menus gm ON gmi.menu_id = gm.id
      JOIN gastronomy_profiles gp ON gm.business_id = gp.business_id
      JOIN business_data bd ON gp.business_id = bd.id
      WHERE gmi.id = item_id
        AND bd.profile_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE gastronomy_menu_item_addons IS 'Adicionais para itens de cardápio';
COMMENT ON COLUMN gastronomy_menu_item_addons.max_quantity IS 'Quantidade máxima permitida';

-- ── COMBOS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(menu_id, name)
);

-- Itens do combo
CREATE TABLE IF NOT EXISTS gastronomy_menu_combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES menu_combos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(combo_id, item_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_combos_menu ON menu_combos(menu_id);
CREATE INDEX IF NOT EXISTS idx_combos_available ON menu_combos(is_available);
CREATE INDEX IF NOT EXISTS idx_combos_featured ON menu_combos(is_featured);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON gastronomy_menu_combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_item ON gastronomy_menu_combo_items(item_id);

-- RLS
ALTER TABLE menu_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastronomy_menu_combo_items ENABLE ROW LEVEL SECURITY;

-- Público pode ver combos disponíveis
DROP POLICY IF EXISTS "Public can view available combos" ON menu_combos;
DROP POLICY IF EXISTS "Public can view available combos" ON menu_combos;
CREATE POLICY "Public can view available combos" ON menu_combos FOR SELECT
  USING (is_available = TRUE);

DROP POLICY IF EXISTS "Public can view combo items" ON gastronomy_menu_combo_items;
DROP POLICY IF EXISTS "Public can view combo items" ON gastronomy_menu_combo_items;
CREATE POLICY "Public can view combo items" ON gastronomy_menu_combo_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM menu_combos gmc
      WHERE gmc.id = combo_id
        AND gmc.is_available = TRUE
    )
  );

-- Donos de empresas podem gerenciar combos
DROP POLICY IF EXISTS "Business owners can manage combos" ON menu_combos;
DROP POLICY IF EXISTS "Business owners can manage combos" ON menu_combos;
CREATE POLICY "Business owners can manage combos" ON menu_combos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM menus gm
      JOIN gastronomy_profiles gp ON gm.business_id = gp.business_id
      JOIN business_data bd ON gp.business_id = bd.id
      WHERE gm.id = menu_id
        AND bd.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business owners can manage combo items" ON gastronomy_menu_combo_items;
DROP POLICY IF EXISTS "Business owners can manage combo items" ON gastronomy_menu_combo_items;
CREATE POLICY "Business owners can manage combo items" ON gastronomy_menu_combo_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM menu_combos gmc
      JOIN menus gm ON gmc.menu_id = gm.id
      JOIN gastronomy_profiles gp ON gm.business_id = gp.business_id
      JOIN business_data bd ON gp.business_id = bd.id
      WHERE gmc.id = combo_id
        AND bd.profile_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE menu_combos IS 'Combos de itens de cardápio';
COMMENT ON TABLE gastronomy_menu_combo_items IS 'Itens que compõem um combo';
COMMENT ON COLUMN gastronomy_menu_combo_items.quantity IS 'Quantidade do item no combo';
