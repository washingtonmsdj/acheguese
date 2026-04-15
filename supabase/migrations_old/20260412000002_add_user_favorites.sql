-- ============================================================================
-- USER FAVORITES - Sistema de Favoritos
-- ============================================================================
-- Data: 2026-04-12
-- Descrição: Sistema de favoritos para estabelecimentos
--
-- Permite que usuários salvem seus estabelecimentos favoritos
-- Sincroniza entre dispositivos
-- Suporta notificações de promoções
-- ============================================================================

-- ============================================================================
-- 1. USER_FAVORITE_BUSINESSES - Favoritos do Usuário
-- ============================================================================

CREATE TABLE user_favorite_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário (direto, não profile)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Negócio favorito (business_data.id)
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Preferências de notificação
  notify_on_promotions BOOLEAN NOT NULL DEFAULT true,
  notify_on_new_items BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadados
  notes TEXT, -- Notas pessoais do usuário sobre o estabelecimento
  tags TEXT[], -- Tags personalizadas (ex: "almoço", "fim de semana")
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: um usuário não pode favoritar o mesmo negócio duas vezes
  CONSTRAINT unique_user_favorite UNIQUE (user_id, business_id)
);

-- Índices
CREATE INDEX idx_user_favorite_businesses_user_id ON user_favorite_businesses(user_id);
CREATE INDEX idx_user_favorite_businesses_business_id ON user_favorite_businesses(business_id);
CREATE INDEX idx_user_favorite_businesses_created_at ON user_favorite_businesses(user_id, created_at DESC);

-- Trigger
CREATE TRIGGER update_user_favorite_businesses_updated_at
  BEFORE UPDATE ON user_favorite_businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE user_favorite_businesses ENABLE ROW LEVEL SECURITY;

-- Usuários gerenciam seus próprios favoritos
CREATE POLICY "Users manage own favorites"
  ON user_favorite_businesses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para obter favoritos do usuário com informações do negócio
CREATE OR REPLACE FUNCTION get_user_favorite_businesses(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  favorite_id UUID,
  business_id UUID,
  business_name TEXT,
  business_slug TEXT,
  business_description TEXT,
  business_banner_url TEXT,
  business_rating DECIMAL,
  business_total_reviews INTEGER,
  business_is_verified BOOLEAN,
  cuisine_type TEXT,
  delivery_enabled BOOLEAN,
  price_range TEXT,
  notify_on_promotions BOOLEAN,
  notify_on_new_items BOOLEAN,
  notes TEXT,
  tags TEXT[],
  favorited_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ufb.id as favorite_id,
    bd.id as business_id,
    bd.name as business_name,
    bd.slug as business_slug,
    bd.description as business_description,
    bd.banner_url as business_banner_url,
    bd.rating as business_rating,
    bd.total_reviews as business_total_reviews,
    bd.is_verified as business_is_verified,
    gp.cuisine_type,
    gp.delivery_enabled,
    gp.price_range,
    ufb.notify_on_promotions,
    ufb.notify_on_new_items,
    ufb.notes,
    ufb.tags,
    ufb.created_at as favorited_at
  FROM user_favorite_businesses ufb
  JOIN business_data bd ON bd.id = ufb.business_id
  LEFT JOIN gastronomy_profiles gp ON gp.business_id = bd.id
  WHERE ufb.user_id = p_user_id
    AND bd.status = 'active'
  ORDER BY ufb.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se negócio está nos favoritos
CREATE OR REPLACE FUNCTION is_business_favorited(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_favorite_businesses
    WHERE user_id = p_user_id
      AND business_id = p_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar favoritos de um negócio
CREATE OR REPLACE FUNCTION get_business_favorites_count(
  p_business_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM user_favorite_businesses
  WHERE business_id = p_business_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para toggle de favorito (adiciona ou remove)
CREATE OR REPLACE FUNCTION toggle_business_favorite(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Verifica se já existe
  SELECT EXISTS (
    SELECT 1 FROM user_favorite_businesses
    WHERE user_id = p_user_id
      AND business_id = p_business_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove
    DELETE FROM user_favorite_businesses
    WHERE user_id = p_user_id
      AND business_id = p_business_id;
    RETURN FALSE; -- Retorna FALSE = removido
  ELSE
    -- Adiciona
    INSERT INTO user_favorite_businesses (user_id, business_id)
    VALUES (p_user_id, p_business_id);
    RETURN TRUE; -- Retorna TRUE = adicionado
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. ATUALIZAR BUSINESS_DATA COM CONTADOR DE FAVORITOS
-- ============================================================================

-- Adicionar coluna de contador (desnormalizado para performance)
ALTER TABLE business_data
  ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0;

-- Índice
CREATE INDEX IF NOT EXISTS idx_business_data_favorites_count 
  ON business_data(favorites_count DESC) 
  WHERE favorites_count > 0;

-- Função para atualizar contador de favoritos
CREATE OR REPLACE FUNCTION update_business_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE business_data 
    SET favorites_count = favorites_count + 1 
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_data 
    SET favorites_count = GREATEST(0, favorites_count - 1)
    WHERE id = OLD.business_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar contador
DROP TRIGGER IF EXISTS trigger_update_business_favorites_count ON user_favorite_businesses;
CREATE TRIGGER trigger_update_business_favorites_count
  AFTER INSERT OR DELETE ON user_favorite_businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_business_favorites_count();

-- Inicializar contadores existentes (apenas registros com profile_type válido)
UPDATE business_data
SET favorites_count = (
  SELECT COUNT(*)
  FROM user_favorite_businesses ufb
  WHERE ufb.business_id = business_data.id
)
WHERE profile_id IN (
  SELECT id FROM profiles WHERE profile_type = 'business'
);

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON TABLE user_favorite_businesses IS 'Favoritos dos usuários - estabelecimentos salvos';
COMMENT ON COLUMN user_favorite_businesses.notify_on_promotions IS 'Receber notificações de promoções deste estabelecimento';
COMMENT ON COLUMN user_favorite_businesses.notify_on_new_items IS 'Receber notificações de novos itens no cardápio';
COMMENT ON COLUMN user_favorite_businesses.notes IS 'Notas pessoais do usuário sobre o estabelecimento';
COMMENT ON COLUMN user_favorite_businesses.tags IS 'Tags personalizadas para organização';
COMMENT ON COLUMN business_data.favorites_count IS 'Contador desnormalizado de favoritos (atualizado via trigger)';
COMMENT ON FUNCTION get_user_favorite_businesses IS 'Retorna favoritos do usuário com informações completas do negócio';
COMMENT ON FUNCTION is_business_favorited IS 'Verifica se negócio está nos favoritos do usuário';
COMMENT ON FUNCTION toggle_business_favorite IS 'Adiciona ou remove favorito (toggle). Retorna TRUE se adicionou, FALSE se removeu';
