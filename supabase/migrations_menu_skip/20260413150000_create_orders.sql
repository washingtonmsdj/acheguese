-- ============================================================================
-- MIGRATION: Sistema de Pedidos Internos
-- Descrição: Tabelas para gerenciar pedidos, itens e status
-- Data: 2026-04-13
-- Fase: 5 de 9
-- ============================================================================

-- ============================================================================
-- ENUM: order_status
-- Descrição: Status possíveis de um pedido
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
  'pending',        -- Aguardando confirmação
  'confirmed',      -- Confirmado pelo estabelecimento
  'preparing',      -- Em preparo
  'ready',          -- Pronto para retirada/entrega
  'out_for_delivery', -- Saiu para entrega
  'delivered',      -- Entregue
  'completed',      -- Concluído
  'cancelled'       -- Cancelado
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ENUM: order_type
-- Descrição: Tipo de pedido
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE order_type AS ENUM (
  'pickup',         -- Retirada no local
  'delivery',       -- Entrega
  'dine_in'         -- Consumo no local
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ENUM: payment_method
-- Descrição: Método de pagamento
-- ============================================================================
CREATE TYPE payment_method AS ENUM (
  'cash',           -- Dinheiro
  'debit_card',     -- Cartão de débito
  'credit_card',    -- Cartão de crédito
  'pix',            -- PIX
  'online'          -- Pagamento online (futuro)
);

-- ============================================================================
-- TABELA: orders
-- Descrição: Pedidos realizados
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delivery_area_id UUID REFERENCES delivery_areas(id) ON DELETE SET NULL,
  
  -- Número do pedido (sequencial por empresa)
  order_number INTEGER NOT NULL,
  
  -- Tipo e status
  order_type order_type NOT NULL DEFAULT 'pickup',
  status order_status NOT NULL DEFAULT 'pending',
  
  -- Informações do cliente
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Endereço de entrega (se order_type = 'delivery')
  delivery_address TEXT,
  delivery_neighborhood TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_complement TEXT,
  delivery_reference TEXT,
  
  -- Valores
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Soma dos itens
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Taxa de entrega
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Desconto aplicado
  total DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Total final
  
  -- Pagamento
  payment_method payment_method,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  change_for DECIMAL(10, 2), -- Troco para (se dinheiro)
  
  -- Observações
  notes TEXT, -- Observações do cliente
  internal_notes TEXT, -- Observações internas
  
  -- Tempo
  estimated_preparation_time INTEGER, -- Tempo estimado de preparo (minutos)
  estimated_delivery_time INTEGER, -- Tempo estimado de entrega (minutos)
  scheduled_for TIMESTAMPTZ, -- Agendado para (se pedido com antecedência)
  
  -- Timestamps de status
  confirmed_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_subtotal CHECK (subtotal >= 0),
  CONSTRAINT valid_delivery_fee CHECK (delivery_fee >= 0),
  CONSTRAINT valid_discount CHECK (discount >= 0),
  CONSTRAINT valid_total CHECK (total >= 0),
  CONSTRAINT valid_change CHECK (change_for IS NULL OR change_for >= total),
  CONSTRAINT unique_order_number_per_business UNIQUE (business_id, order_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(business_id, order_number);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: order_items
-- Descrição: Itens de um pedido
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  
  -- Informações do item (snapshot no momento do pedido)
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_image_url TEXT,
  
  -- Variação selecionada
  variation_id UUID,
  variation_name TEXT,
  
  -- Quantidade e preço
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
  
  -- Observações
  notes TEXT, -- Observações do cliente para este item
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_unit_price CHECK (unit_price >= 0),
  CONSTRAINT valid_subtotal CHECK (subtotal >= 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);

-- ============================================================================
-- TABELA: order_item_addons
-- Descrição: Adicionais de um item do pedido
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES menu_addons(id) ON DELETE SET NULL,
  
  -- Informações do adicional (snapshot)
  addon_name TEXT NOT NULL,
  addon_price DECIMAL(10, 2) NOT NULL,
  
  -- Quantidade
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_addon_quantity CHECK (quantity > 0),
  CONSTRAINT valid_addon_price CHECK (addon_price >= 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_item_addons_item ON order_item_addons(order_item_id);

-- ============================================================================
-- TABELA: order_status_history
-- Descrição: Histórico de mudanças de status
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Status
  from_status order_status,
  to_status order_status NOT NULL,
  
  -- Informações
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, created_at DESC);

-- ============================================================================
-- FUNÇÃO: get_next_order_number
-- Descrição: Retorna o próximo número de pedido para uma empresa
-- ============================================================================
CREATE OR REPLACE FUNCTION get_next_order_number(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO v_next_number
  FROM orders
  WHERE business_id = p_business_id;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO: calculate_order_total
-- Descrição: Calcula o total de um pedido
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id UUID)
RETURNS TABLE (
  subtotal DECIMAL,
  delivery_fee DECIMAL,
  discount DECIMAL,
  total DECIMAL
) AS $$
DECLARE
  v_order RECORD;
  v_items_total DECIMAL;
BEGIN
  -- Busca o pedido
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Calcula total dos itens (incluindo adicionais)
  SELECT COALESCE(SUM(
    oi.subtotal + COALESCE((
      SELECT SUM(oia.addon_price * oia.quantity)
      FROM order_item_addons oia
      WHERE oia.order_item_id = oi.id
    ), 0)
  ), 0)
  INTO v_items_total
  FROM order_items oi
  WHERE oi.order_id = p_order_id;
  
  -- Retorna valores
  RETURN QUERY SELECT
    v_items_total,
    v_order.delivery_fee,
    v_order.discount,
    v_items_total + v_order.delivery_fee - v_order.discount;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGER: update_order_status_history
-- Descrição: Registra mudanças de status no histórico
-- ============================================================================
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    
    -- Atualiza timestamps específicos
    CASE NEW.status
      WHEN 'confirmed' THEN
        NEW.confirmed_at = NOW();
      WHEN 'preparing' THEN
        NEW.preparing_at = NOW();
      WHEN 'ready' THEN
        NEW.ready_at = NOW();
      WHEN 'out_for_delivery' THEN
        NEW.out_for_delivery_at = NOW();
      WHEN 'delivered' THEN
        NEW.delivered_at = NOW();
      WHEN 'completed' THEN
        NEW.completed_at = NOW();
      WHEN 'cancelled' THEN
        NEW.cancelled_at = NOW();
      ELSE
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- orders: Donos podem ver pedidos de seus negócios
DROP POLICY IF EXISTS "orders_owner_read" ON orders;
DROP POLICY IF EXISTS "orders_owner_read" ON orders;
CREATE POLICY "orders_owner_read" ON orders FOR SELECT
  USING (
    business_id IN (
      SELECT bd.id
      FROM business_data bd
      WHERE bd.profile_id = auth.uid()
    )
  );

-- orders: Clientes podem ver seus próprios pedidos
DROP POLICY IF EXISTS "orders_customer_read" ON orders;
DROP POLICY IF EXISTS "orders_customer_read" ON orders;
CREATE POLICY "orders_customer_read" ON orders FOR SELECT
  USING (customer_id = auth.uid());

-- orders: Donos podem gerenciar pedidos de seus negócios
DROP POLICY IF EXISTS "orders_owner_all" ON orders;
DROP POLICY IF EXISTS "orders_owner_all" ON orders;
CREATE POLICY "orders_owner_all" ON orders FOR ALL
  USING (
    business_id IN (
      SELECT bd.id
      FROM business_data bd
      WHERE bd.profile_id = auth.uid()
    )
  );

-- order_items: Acesso via pedido
DROP POLICY IF EXISTS "order_items_via_order" ON order_items;
DROP POLICY IF EXISTS "order_items_via_order" ON order_items;
CREATE POLICY "order_items_via_order" ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id = auth.uid()
        OR business_id IN (
          SELECT bd.id FROM business_data bd WHERE bd.profile_id = auth.uid()
        )
    )
  );

-- order_items: Donos podem gerenciar
DROP POLICY IF EXISTS "order_items_owner_all" ON order_items;
DROP POLICY IF EXISTS "order_items_owner_all" ON order_items;
CREATE POLICY "order_items_owner_all" ON order_items FOR ALL
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN business_data bd ON bd.id = o.business_id
      WHERE bd.profile_id = auth.uid()
    )
  );

-- order_item_addons: Acesso via item
DROP POLICY IF EXISTS "order_item_addons_via_item" ON order_item_addons;
DROP POLICY IF EXISTS "order_item_addons_via_item" ON order_item_addons;
CREATE POLICY "order_item_addons_via_item" ON order_item_addons FOR SELECT
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      WHERE oi.order_id IN (
        SELECT id FROM orders
        WHERE customer_id = auth.uid()
          OR business_id IN (
            SELECT bd.id FROM business_data bd WHERE bd.profile_id = auth.uid()
          )
      )
    )
  );

-- order_status_history: Acesso via pedido
DROP POLICY IF EXISTS "order_status_history_via_order" ON order_status_history;
DROP POLICY IF EXISTS "order_status_history_via_order" ON order_status_history;
CREATE POLICY "order_status_history_via_order" ON order_status_history FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id = auth.uid()
        OR business_id IN (
          SELECT bd.id FROM business_data bd WHERE bd.profile_id = auth.uid()
        )
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE orders IS 'Pedidos realizados pelos clientes';
COMMENT ON TABLE order_items IS 'Itens de um pedido';
COMMENT ON TABLE order_item_addons IS 'Adicionais de um item do pedido';
COMMENT ON TABLE order_status_history IS 'Histórico de mudanças de status';
COMMENT ON FUNCTION get_next_order_number IS 'Retorna próximo número de pedido';
COMMENT ON FUNCTION calculate_order_total IS 'Calcula total de um pedido';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
