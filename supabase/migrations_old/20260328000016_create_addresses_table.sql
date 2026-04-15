-- ============================================================================
-- ADDRESSES TABLE - Base Canônica de Endereços
-- Etapa 1: Fundação (sem PostGIS, sem migração de dados legados)
-- ============================================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK territorial (bairro onde o endereço está)
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  
  -- Endereço postal
  postal_code VARCHAR(9),              -- CEP (formato: 12345-678), NULL se não aplicável
  street VARCHAR(255),                 -- Logradouro
  number VARCHAR(20),                  -- Número
  complement VARCHAR(100),             -- Complemento
  
  -- Tipo de endereço
  address_type TEXT NOT NULL DEFAULT 'exact'
    CHECK (address_type IN ('exact', 'approximate', 'landmark', 'gps_only')),
  
  -- Coordenadas geocodificadas
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadados de geocoding
  geocoded_at TIMESTAMPTZ,
  geocoding_source VARCHAR(50),        -- 'viacep', 'google', 'manual', 'gps'
  geocoding_confidence DECIMAL(3, 2),  -- 0.00 a 1.00
  
  -- Validação
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_postal_code CHECK (
    postal_code IS NULL OR postal_code ~ '^\d{5}-?\d{3}$'
  ),
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT exact_requires_street CHECK (
    address_type != 'exact' OR (street IS NOT NULL AND street != '')
  ),
  CONSTRAINT gps_only_requires_coords CHECK (
    address_type != 'gps_only' OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  ),
  CONSTRAINT valid_confidence CHECK (
    geocoding_confidence IS NULL OR (geocoding_confidence BETWEEN 0 AND 1)
  )
);

-- Índices
CREATE INDEX idx_addresses_location_id ON addresses(location_id);
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code) WHERE postal_code IS NOT NULL;
CREATE INDEX idx_addresses_type ON addresses(address_type);
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Trigger para updated_at
CREATE TRIGGER update_addresses_updated_at 
  BEFORE UPDATE ON addresses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Policy: endereços públicos visíveis para todos
CREATE POLICY "Addresses viewable by all" 
  ON addresses FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Policy: apenas autenticados podem criar endereços
CREATE POLICY "Authenticated users can create addresses" 
  ON addresses FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy: apenas autenticados podem atualizar endereços
CREATE POLICY "Authenticated users can update addresses" 
  ON addresses FOR UPDATE 
  TO authenticated 
  USING (true);

-- Policy: apenas autenticados podem deletar endereços
CREATE POLICY "Authenticated users can delete addresses" 
  ON addresses FOR DELETE 
  TO authenticated 
  USING (true);

-- Comentários
COMMENT ON TABLE addresses IS 'Tabela canônica de endereços postais - SSOT para logradouros, CEPs e coordenadas';
COMMENT ON COLUMN addresses.location_id IS 'FK para território (bairro) onde o endereço está localizado';
COMMENT ON COLUMN addresses.address_type IS 'Tipo de endereço: exact (completo), approximate (aproximado), landmark (referência), gps_only (apenas coordenadas)';
COMMENT ON COLUMN addresses.geocoding_confidence IS 'Confiança do geocoding (0.00 a 1.00): 1.00=exato, 0.90=muito provável, 0.70=provável, 0.50=incerto';
