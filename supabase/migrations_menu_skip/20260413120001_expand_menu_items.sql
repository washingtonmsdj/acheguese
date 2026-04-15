-- ══════════════════════════════════════════════════════════════════════════
-- EXPAND GASTRONOMY MENU ITEMS
-- ══════════════════════════════════════════════════════════════════════════
-- Adiciona campos operacionais aos itens de cardápio

-- Adicionar campos novos
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preparation_time_min INTEGER,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS stock_alert_threshold INTEGER,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS allergens TEXT[],
  ADD COLUMN IF NOT EXISTS nutritional_info JSONB;

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(menu_id, category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_stock ON menu_items(stock_quantity) WHERE stock_quantity IS NOT NULL;

-- Comentários
COMMENT ON COLUMN menu_items.category_id IS 'Categoria do item (opcional)';
COMMENT ON COLUMN menu_items.display_order IS 'Ordem de exibição dentro da categoria';
COMMENT ON COLUMN menu_items.is_available IS 'Item disponível para pedido';
COMMENT ON COLUMN menu_items.is_featured IS 'Item em destaque';
COMMENT ON COLUMN menu_items.preparation_time_min IS 'Tempo de preparo em minutos';
COMMENT ON COLUMN menu_items.stock_quantity IS 'Quantidade em estoque (null = ilimitado)';
COMMENT ON COLUMN menu_items.stock_alert_threshold IS 'Alerta quando estoque atingir este valor';
COMMENT ON COLUMN menu_items.tags IS 'Tags para busca (ex: vegetariano, picante, etc)';
COMMENT ON COLUMN menu_items.allergens IS 'Alergênicos (ex: glúten, lactose, etc)';
COMMENT ON COLUMN menu_items.nutritional_info IS 'Informações nutricionais (calorias, proteínas, etc)';
