-- ============================================================================
-- ETAPA 12: Hardening de business_data e professional_data
-- ============================================================================
-- 
-- Objetivo: Endurecer location_id e remover campos legados
-- 
-- IMPORTANTE: address_id continua OPCIONAL (correto para esses domínios)
-- ============================================================================

-- ============================================================================
-- 1. BUSINESS_DATA
-- ============================================================================

-- location_id obrigatório
ALTER TABLE business_data 
  ALTER COLUMN location_id SET NOT NULL;

COMMENT ON COLUMN business_data.location_id IS 
  'FK para locations (território) — obrigatório após ETAPA 12';

COMMENT ON COLUMN business_data.address_id IS 
  'FK para addresses (opcional) — negócios podem operar sem endereço físico';

-- Remover campos legados
ALTER TABLE business_data 
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS neighborhood,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude;

-- ============================================================================
-- 2. PROFESSIONAL_DATA
-- ============================================================================

-- location_id obrigatório
ALTER TABLE professional_data 
  ALTER COLUMN location_id SET NOT NULL;

COMMENT ON COLUMN professional_data.location_id IS 
  'FK para locations (território) — obrigatório após ETAPA 12';

COMMENT ON COLUMN professional_data.address_id IS 
  'FK para addresses (opcional) — profissionais podem atender sem endereço fixo';

-- Limpar metadata.location legado (se existir)
-- Preservar outras chaves de metadata
UPDATE professional_data
SET metadata = metadata - 'location'
WHERE metadata ? 'location';

COMMENT ON COLUMN professional_data.metadata IS 
  'Metadados adicionais (location legado removido na ETAPA 12)';

-- ============================================================================
-- 3. ATUALIZAR RPCs
-- ============================================================================

-- create_business_data_with_canonical
CREATE OR REPLACE FUNCTION create_business_data_with_canonical(
  p_profile_id UUID,
  p_location_id UUID,
  p_address_id UUID DEFAULT NULL,
  p_business_name TEXT DEFAULT NULL,
  p_business_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS business_data
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business business_data;
BEGIN
  -- Validar obrigatórios
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile_id é obrigatório';
  END IF;

  IF p_location_id IS NULL THEN
    RAISE EXCEPTION 'location_id é obrigatório após ETAPA 12';
  END IF;

  -- Validar location existe e está ativa
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id AND status = 'active') THEN
    RAISE EXCEPTION 'location_id inválido ou inativo: %', p_location_id;
  END IF;

  -- Validar address_id se fornecido
  IF p_address_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_address_id) THEN
      RAISE EXCEPTION 'address_id inválido: %', p_address_id;
    END IF;
  END IF;

  -- Criar business
  INSERT INTO business_data (
    profile_id,
    location_id,
    address_id,
    business_name,
    business_type,
    description,
    phone,
    email,
    website,
    metadata
  ) VALUES (
    p_profile_id,
    p_location_id,
    p_address_id,
    p_business_name,
    p_business_type,
    p_description,
    p_phone,
    p_email,
    p_website,
    p_metadata
  )
  RETURNING * INTO v_business;

  RETURN v_business;
END;
$$;

-- create_professional_data_with_canonical
CREATE OR REPLACE FUNCTION create_professional_data_with_canonical(
  p_profile_id UUID,
  p_location_id UUID,
  p_address_id UUID DEFAULT NULL,
  p_profession TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS professional_data
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_professional professional_data;
BEGIN
  -- Validar obrigatórios
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile_id é obrigatório';
  END IF;

  IF p_location_id IS NULL THEN
    RAISE EXCEPTION 'location_id é obrigatório após ETAPA 12';
  END IF;

  -- Validar location existe e está ativa
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id AND status = 'active') THEN
    RAISE EXCEPTION 'location_id inválido ou inativo: %', p_location_id;
  END IF;

  -- Validar address_id se fornecido
  IF p_address_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_address_id) THEN
      RAISE EXCEPTION 'address_id inválido: %', p_address_id;
    END IF;
  END IF;

  -- Criar professional
  INSERT INTO professional_data (
    profile_id,
    location_id,
    address_id,
    profession,
    specialization,
    description,
    phone,
    email,
    metadata
  ) VALUES (
    p_profile_id,
    p_location_id,
    p_address_id,
    p_profession,
    p_specialization,
    p_description,
    p_phone,
    p_email,
    p_metadata
  )
  RETURNING * INTO v_professional;

  RETURN v_professional;
END;
$$;

COMMENT ON FUNCTION create_business_data_with_canonical IS 
  'ETAPA 12: Criar business apenas com campos canônicos (legado removido)';

COMMENT ON FUNCTION create_professional_data_with_canonical IS 
  'ETAPA 12: Criar professional apenas com campos canônicos (legado removido)';
