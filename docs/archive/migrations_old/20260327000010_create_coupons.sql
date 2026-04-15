CREATE TABLE IF NOT EXISTS coupons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT NOT NULL,
  business_name TEXT,
  codigo        TEXT NOT NULL UNIQUE,
  desconto      TEXT NOT NULL,
  tipo          TEXT CHECK (tipo IN ('porcentagem', 'valor', 'brinde')),
  validade      TEXT,
  usos          INTEGER DEFAULT 0,
  max_usos      INTEGER,
  neighborhood  TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  description   TEXT,
  business_logo TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read coupons"
  ON coupons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage coupons"
  ON coupons FOR ALL TO authenticated
  USING (is_admin(auth.uid()));
