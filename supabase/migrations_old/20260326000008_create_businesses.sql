-- Migration: Create businesses table
-- Description: Tabela de empresas/negócios locais
-- Date: 2026-03-26

CREATE TABLE businesses (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  
  -- Informações básicas
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategoria TEXT,
  
  -- Contato
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  
  -- Localização (SSOT territorial)
  location_id UUID, -- FK para locations.id
  address TEXT,
  neighborhood TEXT,
  cep TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  
  -- Operação
  horario_funcionamento JSONB,
  tem_delivery BOOLEAN DEFAULT false,
  aceita_cartao BOOLEAN DEFAULT false,
  aceita_pix BOOLEAN DEFAULT false,
  formas_pagamento TEXT[] DEFAULT '{}',
  modos_atendimento TEXT[] DEFAULT '{}',
  
  -- Características
  especialidades TEXT[] DEFAULT '{}',
  facilidades TEXT[] DEFAULT '{}',
  
  -- Mídia
  logo_url TEXT,
  banner_url TEXT,
  fotos TEXT[] DEFAULT '{}',
  
  -- Status e métricas
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  is_premium BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verificado BOOLEAN DEFAULT false, -- alias para is_verified
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_businesses_profile_id ON businesses(profile_id);
CREATE INDEX idx_businesses_slug ON businesses(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_location_id ON businesses(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_businesses_is_premium ON businesses(is_premium) WHERE is_premium = true;
CREATE INDEX idx_businesses_is_verified ON businesses(is_verified) WHERE is_verified = true;
CREATE INDEX idx_businesses_rating ON businesses(rating DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para sincronizar verificado com is_verified
CREATE OR REPLACE FUNCTION sync_business_verified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verificado := NEW.is_verified;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_business_verified_trigger
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION sync_business_verified();

-- RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Leitura pública de businesses ativas
CREATE POLICY "Active businesses viewable"
  ON businesses
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Donos gerenciam seus próprios businesses
CREATE POLICY "Owners manage own businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Comentários
COMMENT ON TABLE businesses IS 'Empresas e negócios locais';
COMMENT ON COLUMN businesses.location_id IS 'FK para locations.id - SSOT territorial';
COMMENT ON COLUMN businesses.verificado IS 'Alias para is_verified - compatibilidade';
