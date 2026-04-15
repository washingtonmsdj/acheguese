-- Tabelas de reviews e reports faltantes
-- O schema canônico tem 'reviews' com review_type para distinguir business/professional

-- business_reviews_new e professional_reviews_new são aliases para reviews filtrado por tipo
-- Criamos as tabelas separadas para compatibilidade com o código existente

CREATE TABLE IF NOT EXISTS business_reviews_new (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_business_review UNIQUE (reviewed_profile_id, reviewer_profile_id)
);

CREATE TABLE IF NOT EXISTS professional_reviews_new (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_professional_review UNIQUE (reviewed_profile_id, reviewer_profile_id)
);

CREATE TABLE IF NOT EXISTS professional_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_reviews_reviewed ON business_reviews_new(reviewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewed ON professional_reviews_new(reviewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_reports_status ON professional_reports(status);

-- RLS
ALTER TABLE business_reviews_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_reviews_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read business reviews" ON business_reviews_new FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own business reviews" ON business_reviews_new FOR ALL TO authenticated
  USING (reviewer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can read professional reviews" ON professional_reviews_new FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own professional reviews" ON professional_reviews_new FOR ALL TO authenticated
  USING (reviewer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can read professional reports" ON professional_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own reports" ON professional_reports FOR ALL TO authenticated
  USING (reporter_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
