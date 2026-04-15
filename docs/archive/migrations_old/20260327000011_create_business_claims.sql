-- Migration: Create business_claims table
-- Tabela para reivindicações de propriedade de empresas

CREATE TABLE business_claims (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  mensagem    TEXT,
  status      TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Um usuário só pode ter uma reivindicação pendente por empresa
  CONSTRAINT unique_pending_claim UNIQUE (user_id, business_id)
);

CREATE INDEX idx_business_claims_user_id     ON business_claims(user_id);
CREATE INDEX idx_business_claims_business_id ON business_claims(business_id);
CREATE INDEX idx_business_claims_status      ON business_claims(status);

CREATE TRIGGER update_business_claims_updated_at
  BEFORE UPDATE ON business_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas próprias reivindicações
CREATE POLICY "Users view own claims"
  ON business_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Usuários criam suas próprias reivindicações
CREATE POLICY "Users create own claims"
  ON business_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins gerenciam todas as reivindicações
CREATE POLICY "Admins manage all claims"
  ON business_claims FOR ALL TO authenticated
  USING (is_admin(auth.uid()));
