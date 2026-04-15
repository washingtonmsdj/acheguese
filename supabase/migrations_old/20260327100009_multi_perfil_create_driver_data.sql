-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - DRIVER_DATA
-- ============================================================================
-- Criar/alterar tabela driver_data para perfis de motorista
-- ============================================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS driver_data (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar todas as colunas necessárias
DO $$
BEGIN
  -- license_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'license_number') THEN
    ALTER TABLE driver_data ADD COLUMN license_number TEXT;
  END IF;
  
  -- license_category
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'license_category') THEN
    ALTER TABLE driver_data ADD COLUMN license_category TEXT;
  END IF;
  
  -- license_expiry
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'license_expiry') THEN
    ALTER TABLE driver_data ADD COLUMN license_expiry DATE;
  END IF;
  
  -- license_state
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'license_state') THEN
    ALTER TABLE driver_data ADD COLUMN license_state TEXT;
  END IF;
  
  -- vehicle_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'vehicle_type') THEN
    ALTER TABLE driver_data ADD COLUMN vehicle_type TEXT;
  END IF;
  
  -- vehicle_plate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'vehicle_plate') THEN
    ALTER TABLE driver_data ADD COLUMN vehicle_plate TEXT;
  END IF;
  
  -- vehicle_model
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'vehicle_model') THEN
    ALTER TABLE driver_data ADD COLUMN vehicle_model TEXT;
  END IF;
  
  -- vehicle_year
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'vehicle_year') THEN
    ALTER TABLE driver_data ADD COLUMN vehicle_year INTEGER;
  END IF;
  
  -- vehicle_color
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'vehicle_color') THEN
    ALTER TABLE driver_data ADD COLUMN vehicle_color TEXT;
  END IF;
  
  -- is_available
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'is_available') THEN
    ALTER TABLE driver_data ADD COLUMN is_available BOOLEAN DEFAULT false;
  END IF;
  
  -- current_location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'current_location') THEN
    ALTER TABLE driver_data ADD COLUMN current_location GEOGRAPHY(POINT, 4326);
  END IF;
  
  -- last_location_update
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'last_location_update') THEN
    ALTER TABLE driver_data ADD COLUMN last_location_update TIMESTAMPTZ;
  END IF;
  
  -- documents_verified
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'documents_verified') THEN
    ALTER TABLE driver_data ADD COLUMN documents_verified BOOLEAN DEFAULT false;
  END IF;
  
  -- documents_verified_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'documents_verified_at') THEN
    ALTER TABLE driver_data ADD COLUMN documents_verified_at TIMESTAMPTZ;
  END IF;
  
  -- background_check_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'background_check_status') THEN
    ALTER TABLE driver_data ADD COLUMN background_check_status TEXT;
  END IF;
  
  -- background_check_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'background_check_date') THEN
    ALTER TABLE driver_data ADD COLUMN background_check_date TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar constraints após garantir que as colunas existem
DO $$
BEGIN
  -- license_category constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_data_license_category_check') THEN
    ALTER TABLE driver_data ADD CONSTRAINT driver_data_license_category_check 
      CHECK (license_category IN ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'));
  END IF;
  
  -- vehicle_type constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_data_vehicle_type_check') THEN
    ALTER TABLE driver_data ADD CONSTRAINT driver_data_vehicle_type_check 
      CHECK (vehicle_type IN ('car', 'motorcycle', 'van', 'truck'));
  END IF;
  
  -- background_check_status constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_data_background_check_status_check') THEN
    ALTER TABLE driver_data ADD CONSTRAINT driver_data_background_check_status_check 
      CHECK (background_check_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Trigger: validar que driver_data só pode ser criado para perfis driver
CREATE OR REPLACE FUNCTION validate_driver_data_profile_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.profile_id 
    AND profile_type = 'driver'
  ) THEN
    RAISE EXCEPTION 'driver_data can only be created for driver profiles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_driver_data_profile_type ON driver_data;
CREATE TRIGGER enforce_driver_data_profile_type
  BEFORE INSERT OR UPDATE ON driver_data
  FOR EACH ROW
  EXECUTE FUNCTION validate_driver_data_profile_type();

-- Trigger: updated_at
DROP TRIGGER IF EXISTS set_driver_data_updated_at ON driver_data;
CREATE TRIGGER set_driver_data_updated_at
  BEFORE UPDATE ON driver_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_driver_location ON driver_data USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_driver_available ON driver_data(is_available) WHERE is_available = true;

-- Comentários de auditoria (só se as colunas existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'license_number') THEN
    COMMENT ON COLUMN driver_data.license_number IS 'Número da CNH';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'documents_verified') THEN
    COMMENT ON COLUMN driver_data.documents_verified IS 'Verificação de documentos (CNH, veículo)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_data' AND column_name = 'current_location') THEN
    COMMENT ON COLUMN driver_data.current_location IS 'Localização atual do motorista (PostGIS)';
  END IF;
END $$;

COMMENT ON TABLE driver_data IS 'Multi-perfil: dados específicos de motoristas';
