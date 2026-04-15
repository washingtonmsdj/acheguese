-- Criar tabela de contatos de emergência

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT emergency_contacts_phone_check CHECK (length(phone) >= 10)
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_profile_id ON emergency_contacts(profile_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary ON emergency_contacts(is_primary);

-- Trigger para garantir apenas um contato primário por perfil
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Desativar outros contatos primários do mesmo perfil
    UPDATE emergency_contacts
    SET is_primary = false
    WHERE profile_id = NEW.profile_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_contacts_primary_trigger ON emergency_contacts;
CREATE TRIGGER emergency_contacts_primary_trigger
  BEFORE INSERT OR UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_contact();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_emergency_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_contacts_updated_at_trigger ON emergency_contacts;
CREATE TRIGGER emergency_contacts_updated_at_trigger
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_contacts_updated_at();

SELECT 'Tabela emergency_contacts criada com sucesso!' AS status;
