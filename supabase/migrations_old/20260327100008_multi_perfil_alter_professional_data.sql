-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - ALTER PROFESSIONAL_DATA
-- ============================================================================
-- Adicionar campos e triggers para professional_data
-- ============================================================================

-- Adicionar campos se não existirem
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS license_state TEXT;
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS services_offered TEXT[];
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS service_area TEXT[];
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE professional_data ADD COLUMN IF NOT EXISTS accepts_remote BOOLEAN DEFAULT false;

-- Trigger: validar que professional_data só pode ser criado para perfis professional
CREATE OR REPLACE FUNCTION validate_professional_data_profile_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.profile_id 
    AND profile_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'professional_data can only be created for professional profiles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_professional_data_profile_type ON professional_data;
CREATE TRIGGER enforce_professional_data_profile_type
  BEFORE INSERT OR UPDATE ON professional_data
  FOR EACH ROW
  EXECUTE FUNCTION validate_professional_data_profile_type();

-- Comentários de auditoria
COMMENT ON FUNCTION validate_professional_data_profile_type IS 'Multi-perfil: garante professional_data apenas para profile_type=professional';
COMMENT ON COLUMN professional_data.profession IS 'Multi-perfil: profissão principal';
COMMENT ON COLUMN professional_data.specialties IS 'Multi-perfil: especialidades do profissional';
