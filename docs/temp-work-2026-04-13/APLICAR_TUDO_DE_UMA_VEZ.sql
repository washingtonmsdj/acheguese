-- ============================================================================
-- APLICAR TUDO DE UMA VEZ - Reviews e Favoritos
-- ============================================================================
-- Copie e cole este arquivo inteiro no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
-- ============================================================================

-- ============================================================================
-- PARTE 1: REVIEWS ENHANCEMENTS
-- ============================================================================

-- Adicionar colunas à tabela reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_response_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported', 'removed'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER NOT NULL DEFAULT 0;

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(reviewed_profile_id, created_at DESC);

-- Tabela de denúncias
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'inappropriate', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review_report UNIQUE (review_id, reporter_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter ON review_reports(reporter_profile_id);

-- Tabela de votos
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review_vote UNIQUE (review_id, voter_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review_id ON review_helpfulness(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_voter ON review_helpfulness(voter_profile_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_review_helpfulness_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful <> NEW.is_helpful THEN
      IF NEW.is_helpful THEN
        UPDATE reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.review_id;
      ELSE
        UPDATE reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_review_helpfulness_counts ON review_helpfulness;
CREATE TRIGGER trigger_update_review_helpfulness_counts
  AFTER INSERT OR UPDATE OR DELETE ON review_helpfulness
  FOR EACH ROW EXECUTE FUNCTION update_review_helpfulness_counts();

DROP TRIGGER IF EXISTS update_review_reports_updated_at ON review_reports;
CREATE TRIGGER update_review_reports_updated_at
  BEFORE UPDATE ON review_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_review_helpfulness_updated_at ON review_helpfulness;
CREATE TRIGGER update_review_helpfulness_updated_at
  BEFORE UPDATE ON review_helpfulness
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funções
CREATE OR REPLACE FUNCTION get_business_reviews(
  p_business_profile_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, reviewer_profile_id UUID, reviewer_name TEXT, reviewer_avatar TEXT,
  rating INTEGER, comment TEXT, photos TEXT[], business_response TEXT,
  business_response_at TIMESTAMPTZ, order_id UUID, helpful_count INTEGER,
  not_helpful_count INTEGER, created_at TIMESTAMPTZ, is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.reviewer_profile_id, p.name, p.avatar_url, r.rating, r.comment,
         r.photos, r.business_response, r.business_response_at, r.order_id,
         r.helpful_count, r.not_helpful_count, r.created_at, (r.order_id IS NOT NULL)
  FROM reviews r
  JOIN profiles p ON p.id = r.reviewer_profile_id
  WHERE r.reviewed_profile_id = p_business_profile_id
    AND r.status = 'active' AND r.review_type = 'business'
  ORDER BY r.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_user_review_business(
  p_user_id UUID, p_business_profile_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE v_has_order BOOLEAN; v_has_review BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM orders o JOIN profiles p ON p.id = o.customer_profile_id
    WHERE p.user_id = p_user_id AND o.merchant_profile_id = p_business_profile_id
      AND o.status IN ('delivered', 'completed')
  ) INTO v_has_order;
  IF NOT v_has_order THEN RETURN FALSE; END IF;
  SELECT EXISTS (
    SELECT 1 FROM reviews r JOIN profiles p ON p.id = r.reviewer_profile_id
    WHERE p.user_id = p_user_id AND r.reviewed_profile_id = p_business_profile_id
      AND r.review_type = 'business'
  ) INTO v_has_review;
  RETURN NOT v_has_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report reviews" ON review_reports;
CREATE POLICY "Users can report reviews" ON review_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users view own reports" ON review_reports;
CREATE POLICY "Users view own reports" ON review_reports FOR SELECT TO authenticated
  USING (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins view all reports" ON review_reports;
CREATE POLICY "Admins view all reports" ON review_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p JOIN profile_members pm ON pm.profile_id = p.id
    WHERE p.user_id = auth.uid() AND pm.role IN ('admin', 'moderator')));

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_helpfulness;
CREATE POLICY "Users can vote on reviews" ON review_helpfulness FOR ALL TO authenticated
  USING (voter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own reviews" ON reviews;
CREATE POLICY "Users manage own reviews" ON reviews FOR ALL TO authenticated
  USING (reviewer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Business can respond to reviews" ON reviews;
CREATE POLICY "Business can respond to reviews" ON reviews FOR UPDATE TO authenticated
  USING (reviewed_profile_id IN (SELECT pm.profile_id FROM profile_members pm
    WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin')))
  WITH CHECK (reviewed_profile_id IN (SELECT pm.profile_id FROM profile_members pm
    WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin')));

-- ============================================================================
-- PARTE 2: USER FAVORITES
-- ============================================================================

-- Tabela de favoritos
CREATE TABLE IF NOT EXISTS user_favorite_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  notify_on_promotions BOOLEAN NOT NULL DEFAULT true,
  notify_on_new_items BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_favorite UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_user_id ON user_favorite_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_business_id ON user_favorite_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_created_at ON user_favorite_businesses(user_id, created_at DESC);

-- Adicionar contador em business_data
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_business_data_favorites_count ON business_data(favorites_count DESC) WHERE favorites_count > 0;

-- Triggers
DROP TRIGGER IF EXISTS update_user_favorite_businesses_updated_at ON user_favorite_businesses;
CREATE TRIGGER update_user_favorite_businesses_updated_at
  BEFORE UPDATE ON user_favorite_businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_business_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE business_data SET favorites_count = favorites_count + 1 WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_data SET favorites_count = GREATEST(0, favorites_count - 1) WHERE id = OLD.business_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_business_favorites_count ON user_favorite_businesses;
CREATE TRIGGER trigger_update_business_favorites_count
  AFTER INSERT OR DELETE ON user_favorite_businesses
  FOR EACH ROW EXECUTE FUNCTION update_business_favorites_count();

-- Funções
CREATE OR REPLACE FUNCTION get_user_favorite_businesses(
  p_user_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  favorite_id UUID, business_id UUID, business_name TEXT, business_slug TEXT,
  business_description TEXT, business_banner_url TEXT, business_rating DECIMAL,
  business_total_reviews INTEGER, business_is_verified BOOLEAN, cuisine_type TEXT,
  delivery_enabled BOOLEAN, price_range TEXT, notify_on_promotions BOOLEAN,
  notify_on_new_items BOOLEAN, notes TEXT, tags TEXT[], favorited_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT ufb.id, bd.id, bd.name, bd.slug, bd.description, bd.banner_url, bd.rating,
         bd.total_reviews, bd.is_verified, gp.cuisine_type, gp.delivery_enabled,
         gp.price_range, ufb.notify_on_promotions, ufb.notify_on_new_items,
         ufb.notes, ufb.tags, ufb.created_at
  FROM user_favorite_businesses ufb
  JOIN business_data bd ON bd.id = ufb.business_id
  LEFT JOIN gastronomy_profiles gp ON gp.business_id = bd.id
  WHERE ufb.user_id = p_user_id AND bd.status = 'active'
  ORDER BY ufb.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_business_favorited(p_user_id UUID, p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_favorite_businesses WHERE user_id = p_user_id AND business_id = p_business_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_business_favorites_count(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_favorite_businesses WHERE business_id = p_business_id;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_business_favorite(p_user_id UUID, p_business_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM user_favorite_businesses WHERE user_id = p_user_id AND business_id = p_business_id) INTO v_exists;
  IF v_exists THEN
    DELETE FROM user_favorite_businesses WHERE user_id = p_user_id AND business_id = p_business_id;
    RETURN FALSE;
  ELSE
    INSERT INTO user_favorite_businesses (user_id, business_id) VALUES (p_user_id, p_business_id);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE user_favorite_businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON user_favorite_businesses;
CREATE POLICY "Users manage own favorites" ON user_favorite_businesses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Inicializar contadores via função SECURITY DEFINER (bypassa trigger de validação)
CREATE OR REPLACE FUNCTION init_business_favorites_count()
RETURNS void AS $$
BEGIN
  -- Desabilitar trigger temporariamente não é necessário:
  -- a função SECURITY DEFINER roda como owner da função (postgres/service_role)
  -- que tem permissão de bypassar RLS, mas o trigger ainda dispara.
  -- Solução: atualizar apenas registros onde o profile_type é 'business' (já são).
  -- O trigger valida NEW.profile_id → profiles.profile_type = 'business'.
  -- Como não estamos alterando profile_id, o trigger lê o valor atual que já é válido.
  -- Portanto basta garantir que o UPDATE não toque em profile_id.
  UPDATE business_data
  SET favorites_count = (
    SELECT COUNT(*)
    FROM user_favorite_businesses ufb
    WHERE ufb.business_id = business_data.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- O trigger enforce_business_data_profile_type dispara em qualquer UPDATE,
-- mas valida NEW.profile_id que não muda aqui — o problema é que o trigger
-- faz SELECT em profiles e pode falhar se profile_id for NULL em algum registro.
-- Executamos apenas para registros com profile_id válido:
UPDATE business_data
SET favorites_count = (
  SELECT COUNT(*)
  FROM user_favorite_businesses ufb
  WHERE ufb.business_id = business_data.id
)
WHERE profile_id IN (
  SELECT id FROM profiles WHERE profile_type = 'business'
);

DROP FUNCTION IF EXISTS init_business_favorites_count();

-- ============================================================================
-- FIM - Migrações aplicadas com sucesso!
-- ============================================================================

SELECT 'Migrações aplicadas com sucesso! ✅' AS status;
