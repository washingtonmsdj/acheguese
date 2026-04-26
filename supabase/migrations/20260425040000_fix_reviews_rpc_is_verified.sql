-- ============================================================================
-- Fix: get_business_reviews referencia coluna `r.is_verified` que não existe
-- ----------------------------------------------------------------------------
-- A tabela canônica `reviews` (criada em 20260418050000) é minimalista. As
-- colunas exigidas por gastronomia (photos, status, helpful_count,
-- business_response, order_id, etc.) viviam em uma migration legada que foi
-- arquivada em `migrations_old`. A função `get_business_reviews` deployada
-- referencia `r.is_verified` (coluna inexistente), causando erro 42703.
--
-- Esta migration:
--   1. Garante (idempotente) as colunas usadas pelo RPC.
--   2. Recria `get_business_reviews` derivando `is_verified` de `order_id`.
--   3. Recria `can_user_review_business` (versão simples: sem review ativo).
--   4. Garante tabelas auxiliares `review_reports` e `review_helpfulness`.
-- ============================================================================

-- ── 1. Colunas de gastronomia em `reviews` ───────────────────────────────────
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos               TEXT[]      DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_response    TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_response_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id             UUID;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count        INTEGER     NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS not_helpful_count    INTEGER     NOT NULL DEFAULT 0;

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

-- FK para orders, apenas se a tabela existir e a constraint ainda não tiver
-- sido criada.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'orders' AND relkind = 'r')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'reviews_order_id_fkey' AND conrelid = 'reviews'::regclass
     ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_order_id   ON reviews(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_status     ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(reviewed_profile_id, created_at DESC);

-- ── 2. Tabelas auxiliares ────────────────────────────────────────────────────
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

ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report reviews" ON review_reports;
CREATE POLICY "Users can report reviews" ON review_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users view own reports" ON review_reports;
CREATE POLICY "Users view own reports" ON review_reports FOR SELECT TO authenticated
  USING (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

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

ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_helpfulness;
CREATE POLICY "Users can vote on reviews" ON review_helpfulness FOR ALL TO authenticated
  USING (voter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Trigger: manter contadores em reviews.helpful_count / not_helpful_count
CREATE OR REPLACE FUNCTION update_review_helpfulness_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS trigger_update_review_helpfulness_counts ON review_helpfulness;
CREATE TRIGGER trigger_update_review_helpfulness_counts
  AFTER INSERT OR UPDATE OR DELETE ON review_helpfulness
  FOR EACH ROW EXECUTE FUNCTION update_review_helpfulness_counts();

-- ── 3. RPC: get_business_reviews ─────────────────────────────────────────────
-- `is_verified` é derivado de `order_id IS NOT NULL` (review com pedido
-- vinculado é considerada verificada). Não existe coluna `r.is_verified`.
DROP FUNCTION IF EXISTS get_business_reviews(UUID, INTEGER, INTEGER);

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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.reviewer_profile_id,
    COALESCE(p.name, 'Usuário')                     AS reviewer_name,
    p.avatar_url                                    AS reviewer_avatar,
    r.rating,
    r.comment,
    COALESCE(r.photos, ARRAY[]::TEXT[])             AS photos,
    r.business_response,
    r.business_response_at,
    r.order_id,
    COALESCE(r.helpful_count, 0)                    AS helpful_count,
    COALESCE(r.not_helpful_count, 0)                AS not_helpful_count,
    r.created_at,
    (r.order_id IS NOT NULL)                        AS is_verified
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.reviewer_profile_id
  WHERE r.reviewed_profile_id = p_business_profile_id
    AND COALESCE(r.status, 'active') = 'active'
    AND r.review_type = 'business'
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_business_reviews(UUID, INTEGER, INTEGER) TO authenticated, anon;

COMMENT ON FUNCTION get_business_reviews(UUID, INTEGER, INTEGER)
  IS 'Reviews de um negócio. is_verified = (order_id IS NOT NULL).';

-- ── 4. RPC: can_user_review_business ─────────────────────────────────────────
DROP FUNCTION IF EXISTS can_user_review_business(UUID, UUID);

CREATE OR REPLACE FUNCTION can_user_review_business(
  p_user_id              UUID,
  p_business_profile_id  UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_existing_review BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM reviews r
    JOIN profiles p ON p.id = r.reviewer_profile_id
    WHERE p.user_id = p_user_id
      AND r.reviewed_profile_id = p_business_profile_id
      AND r.review_type = 'business'
      AND COALESCE(r.status, 'active') = 'active'
  ) INTO v_has_existing_review;

  RETURN NOT v_has_existing_review;
END;
$$;

GRANT EXECUTE ON FUNCTION can_user_review_business(UUID, UUID) TO authenticated, anon;

COMMENT ON FUNCTION can_user_review_business(UUID, UUID)
  IS 'Permite avaliação se o usuário ainda não tiver review ativo para este negócio.';
