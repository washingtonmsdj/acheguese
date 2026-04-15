-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - ALTER BUSINESS_DATA
-- ============================================================================
-- Adicionar campos e triggers para business_data
-- ============================================================================

-- Adicionar campos se não existirem
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS company_type TEXT 
  CHECK (company_type IN ('mei', 'ltda', 'sa', 'eireli', 'other'));
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS employee_count TEXT 
  CHECK (employee_count IN ('1-10', '11-50', '51-200', '201-500', '500+'));
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS business_city TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS business_state TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS business_zip TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- Trigger: validar que business_data só pode ser criado para perfis business
CREATE OR REPLACE FUNCTION validate_business_data_profile_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.profile_id 
    AND profile_type = 'business'
  ) THEN
    RAISE EXCEPTION 'business_data can only be created for business profiles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_business_data_profile_type ON business_data;
CREATE TRIGGER enforce_business_data_profile_type
  BEFORE INSERT OR UPDATE ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION validate_business_data_profile_type();

-- Comentários de auditoria
COMMENT ON FUNCTION validate_business_data_profile_type IS 'Multi-perfil: garante business_data apenas para profile_type=business';
COMMENT ON COLUMN business_data.legal_name IS 'Multi-perfil: razão social da empresa';
COMMENT ON COLUMN business_data.cnpj IS 'Multi-perfil: CNPJ da empresa';
