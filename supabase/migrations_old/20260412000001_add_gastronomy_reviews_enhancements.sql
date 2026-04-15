-- ============================================================================
-- GASTRONOMY REVIEWS ENHANCEMENTS (idempotente)
-- ============================================================================

-- ============================================================================
-- 1. COLUNAS NA TABELA REVIEWS
-- ============================================================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos              TEXT[]      DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_response   TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_response_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id            UUID        REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count       INTEGER     NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS not_helpful_count   INTEGER     NOT NULL DEFAULT 0;

-- status com CHECK — adicionar apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'status'
  ) THEN
    ALTER TABLE reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'hidden', 'reported', 'removed'));
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_order_id   ON reviews(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_status     ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(reviewed_profile_id, created_at DESC);

-- Comentários
COMMENT ON COLUMN reviews.photos               IS 'URLs de fotos anexadas à avaliação (máximo 5)';
COMMENT ON COLUMN reviews.business_response    IS 'Resposta do estabelecimento à avaliação';
COMMENT ON COLUMN reviews.order_id             IS 'Pedido que originou esta avaliação';
COMMENT ON COLUMN reviews.status               IS 'Status: active | hidden | reported | removed';

-- ============================================================================
-- 2. REVIEW_REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_reports (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id           UUID        NOT NULL REFERENCES reviews(id)  ON DELETE CASCADE,
  reporter_profile_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason              TEXT        NOT NULL CHECK (reason IN ('spam','offensive','fake','inappropriate','other')),
  description         TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','accepted','rejected')),
  reviewed_by         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  moderator_notes     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review_report UNIQUE (review_id, reporter_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status    ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter  ON review_reports(reporter_profile_id);

DROP TRIGGER IF EXISTS update_review_reports_updated_at ON review_reports;
CREATE TRIGGER update_review_reports_updated_at
  BEFORE UPDATE ON review_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report reviews" ON review_reports;
CREATE POLICY "Users can report reviews" ON review_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users view own reports" ON review_reports;
CREATE POLICY "Users view own reports" ON review_reports FOR SELECT TO authenticated
  USING (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins view all reports" ON review_reports;
CREATE POLICY "Admins view all reports" ON review_reports FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    JOIN profile_members pm ON pm.profile_id = p.id
    WHERE p.user_id = auth.uid() AND pm.role IN ('admin','moderator')
  ));

-- ============================================================================
-- 3. REVIEW_HELPFULNESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_helpfulness (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id         UUID        NOT NULL REFERENCES reviews(id)  ON DELETE CASCADE,
  voter_profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful        BOOLEAN     NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review_vote UNIQUE (review_id, voter_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review_id ON review_helpfulness(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_voter     ON review_helpfulness(voter_profile_id);

DROP TRIGGER IF EXISTS update_review_helpfulness_updated_at ON review_helpfulness;
CREATE TRIGGER update_review_helpfulness_updated_at
  BEFORE UPDATE ON review_helpfulness
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_helpfulness;
CREATE POLICY "Users can vote on reviews" ON review_helpfulness FOR ALL TO authenticated
  USING (voter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- 4. FUNÇÕES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_review_helpfulness_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE reviews SET helpful_count     = helpful_count     + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_helpful <> NEW.is_helpful THEN
    IF NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE reviews SET helpful_count     = helpful_count     - 1 WHERE id = OLD.review_id;
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

CREATE OR REPLACE FUNCTION get_business_reviews(
  p_business_profile_id UUID,
  p_limit  INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                   UUID,
  reviewer_profile_id  UUID,
  reviewer_name        TEXT,
  reviewer_avatar      TEXT,
  rating               INTEGER,
  comment              TEXT,
  photos               TEXT[],
  business_response    TEXT,
  business_response_at TIMESTAMPTZ,
  order_id             UUID,
  helpful_count        INTEGER,
  not_helpful_count    INTEGER,
  created_at           TIMESTAMPTZ,
  is_verified          BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id, r.reviewer_profile_id,
    p.name        AS reviewer_name,
    p.avatar_url  AS reviewer_avatar,
    r.rating, r.comment, r.photos,
    r.business_response, r.business_response_at,
    r.order_id, r.helpful_count, r.not_helpful_count,
    r.created_at,
    (r.order_id IS NOT NULL) AS is_verified
  FROM reviews r
  JOIN profiles p ON p.id = r.reviewer_profile_id
  WHERE r.reviewed_profile_id = p_business_profile_id
    AND r.status = 'active'
    AND r.review_type = 'business'
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_user_review_business(
  p_user_id              UUID,
  p_business_profile_id  UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_order  BOOLEAN;
  v_has_review BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN profiles p ON p.id = o.customer_profile_id
    WHERE p.user_id = p_user_id
      AND o.merchant_profile_id = p_business_profile_id
      AND o.status IN ('delivered','completed')
  ) INTO v_has_order;

  IF NOT v_has_order THEN RETURN FALSE; END IF;

  SELECT EXISTS (
    SELECT 1 FROM reviews r
    JOIN profiles p ON p.id = r.reviewer_profile_id
    WHERE p.user_id = p_user_id
      AND r.reviewed_profile_id = p_business_profile_id
      AND r.review_type = 'business'
  ) INTO v_has_review;

  RETURN NOT v_has_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. RLS DE REVIEWS
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own reviews"        ON reviews;
DROP POLICY IF EXISTS "Business can respond to reviews" ON reviews;

CREATE POLICY "Users manage own reviews" ON reviews FOR ALL TO authenticated
  USING (reviewer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Business can respond to reviews" ON reviews FOR UPDATE TO authenticated
  USING (reviewed_profile_id IN (
    SELECT pm.profile_id FROM profile_members pm
    WHERE pm.user_id = auth.uid() AND pm.role IN ('owner','admin')
  ))
  WITH CHECK (reviewed_profile_id IN (
    SELECT pm.profile_id FROM profile_members pm
    WHERE pm.user_id = auth.uid() AND pm.role IN ('owner','admin')
  ));

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE review_reports    IS 'Denúncias de avaliações inadequadas';
COMMENT ON TABLE review_helpfulness IS 'Votos de útil/não útil em avaliações';
COMMENT ON FUNCTION get_business_reviews     IS 'Reviews de um negócio com info do avaliador';
COMMENT ON FUNCTION can_user_review_business IS 'Verifica se usuário pode avaliar (precisa ter pedido)';
