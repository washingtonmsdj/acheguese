-- ══════════════════════════════════════════════════════════════════════════
-- GASTRONOMY MENU ITEM VARIATIONS
-- ══════════════════════════════════════════════════════════════════════════
-- Variações de itens (tamanhos, sabores, etc)

CREATE TABLE IF NOT EXISTS gastronomy_menu_item_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(item_id, name)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_item_variations_item ON gastronomy_menu_item_variations(item_id);
CREATE INDEX IF NOT EXISTS idx_item_variations_available ON gastronomy_menu_item_variations(is_available);

-- RLS
ALTER TABLE gastronomy_menu_item_variations ENABLE ROW LEVEL SECURITY;

-- Público pode ver variações disponíveis
DROP POLICY IF EXISTS "Public can view available variations" ON gastronomy_menu_item_variations;
DROP POLICY IF EXISTS "Public can view available variations" ON gastronomy_menu_item_variations;
CREATE POLICY "Public can view available variations" ON gastronomy_menu_item_variations FOR SELECT
  USING (is_available = TRUE);

-- Donos de empresas podem gerenciar variações
DROP POLICY IF EXISTS "Business owners can manage variations" ON gastronomy_menu_item_variations;
DROP POLICY IF EXISTS "Business owners can manage variations" ON gastronomy_menu_item_variations;
CREATE POLICY "Business owners can manage variations" ON gastronomy_menu_item_variations FOR ALL
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
COMMENT ON TABLE gastronomy_menu_item_variations IS 'Variações de itens (tamanhos, sabores, etc)';
COMMENT ON COLUMN gastronomy_menu_item_variations.price_adjustment IS 'Ajuste de preço (positivo ou negativo)';
COMMENT ON COLUMN gastronomy_menu_item_variations.display_order IS 'Ordem de exibição';
