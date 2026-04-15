-- Estende a tabela verification para suportar o VerificationService completo
-- Adiciona colunas faltantes e expande o CHECK de verification_type

ALTER TABLE verification
  ADD COLUMN IF NOT EXISTS document_url    TEXT,
  ADD COLUMN IF NOT EXISTS document_type   TEXT,
  ADD COLUMN IF NOT EXISTS notes           TEXT,
  ADD COLUMN IF NOT EXISTS verified_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Expandir o CHECK para incluir 'resident' e 'email' e 'phone' e 'document'
ALTER TABLE verification
  DROP CONSTRAINT IF EXISTS verification_verification_type_check;

ALTER TABLE verification
  ADD CONSTRAINT verification_verification_type_check
  CHECK (verification_type IN ('identity','business','professional','resident','email','phone','document'));

-- Garantir unicidade por profile + tipo (evita duplicatas no createVerificationRequest)
ALTER TABLE verification
  DROP CONSTRAINT IF EXISTS unique_verification_per_profile_type;

ALTER TABLE verification
  ADD CONSTRAINT unique_verification_per_profile_type
  UNIQUE (profile_id, verification_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_verification_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verification_updated_at ON verification;
CREATE TRIGGER trg_verification_updated_at
  BEFORE UPDATE ON verification
  FOR EACH ROW EXECUTE FUNCTION update_verification_updated_at();

-- Permitir que usuários autenticados insiram suas próprias verificações
DROP POLICY IF EXISTS "Users insert own verification" ON verification;
CREATE POLICY "Users insert own verification" ON verification
  FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
