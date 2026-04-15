-- ============================================================================
-- ETAPA 12: Hardening de user_residences
-- ============================================================================
-- 
-- Objetivo: Endurecer schema após validação de cobertura canônica
-- 
-- Pré-requisito: 100% dos registros devem ter address_id + location_id
-- Validar com: npx tsx scripts/precheck-canonical-coverage.ts
-- ============================================================================

-- ============================================================================
-- 1. TORNAR CAMPOS CANÔNICOS OBRIGATÓRIOS
-- ============================================================================

-- address_id obrigatório
ALTER TABLE user_residences 
  ALTER COLUMN address_id SET NOT NULL;

-- location_id obrigatório
ALTER TABLE user_residences 
  ALTER COLUMN location_id SET NOT NULL;

COMMENT ON COLUMN user_residences.address_id IS 
  'FK para addresses (canônico) — obrigatório após ETAPA 12';

COMMENT ON COLUMN user_residences.location_id IS 
  'FK para locations (território) — obrigatório após ETAPA 12';

-- ============================================================================
-- 2. REMOVER CAMPOS LEGADOS
-- ============================================================================

-- Remover campos de endereço legados (substituídos por address_id)
ALTER TABLE user_residences 
  DROP COLUMN IF EXISTS street,
  DROP COLUMN IF EXISTS number,
  DROP COLUMN IF EXISTS complement,
  DROP COLUMN IF EXISTS neighborhood,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS postal_code;

-- ============================================================================
-- 3. ATUALIZAR RPC create_user_residence_with_canonical
-- ============================================================================

-- Remover parâmetros legados da função RPC
CREATE OR REPLACE FUNCTION create_user_residence_with_canonical(
  p_user_id UUID,
  p_address_id UUID,
  p_location_id UUID,
  p_country TEXT DEFAULT 'Brasil'
)
RETURNS user_residences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_residence user_residences;
BEGIN
  -- Validar campos obrigatórios
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id é obrigatório';
  END IF;

  IF p_address_id IS NULL THEN
    RAISE EXCEPTION 'address_id é obrigatório após ETAPA 12';
  END IF;

  IF p_location_id IS NULL THEN
    RAISE EXCEPTION 'location_id é obrigatório após ETAPA 12';
  END IF;

  -- Validar que address existe
  IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_address_id) THEN
    RAISE EXCEPTION 'address_id inválido: %', p_address_id;
  END IF;

  -- Validar que location existe e está ativa
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id AND status = 'active') THEN
    RAISE EXCEPTION 'location_id inválido ou inativo: %', p_location_id;
  END IF;

  -- Criar residência
  INSERT INTO user_residences (
    user_id,
    address_id,
    location_id,
    country,
    is_verified,
    verification_requested_at,
    verified_at,
    verified_by
  ) VALUES (
    p_user_id,
    p_address_id,
    p_location_id,
    p_country,
    false,
    NULL,
    NULL,
    NULL
  )
  RETURNING * INTO v_residence;

  RETURN v_residence;
END;
$$;

-- ============================================================================
-- 4. ATUALIZAR RPC update_user_residence_with_canonical
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_residence_with_canonical(
  p_residence_id UUID,
  p_address_id UUID DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS user_residences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_residence user_residences;
BEGIN
  -- Validar que residência existe
  IF NOT EXISTS (SELECT 1 FROM user_residences WHERE id = p_residence_id) THEN
    RAISE EXCEPTION 'Residência não encontrada: %', p_residence_id;
  END IF;

  -- Validar address_id se fornecido
  IF p_address_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_address_id) THEN
      RAISE EXCEPTION 'address_id inválido: %', p_address_id;
    END IF;
  END IF;

  -- Validar location_id se fornecido
  IF p_location_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id AND status = 'active') THEN
      RAISE EXCEPTION 'location_id inválido ou inativo: %', p_location_id;
    END IF;
  END IF;

  -- Atualizar apenas campos fornecidos
  UPDATE user_residences
  SET
    address_id = COALESCE(p_address_id, address_id),
    location_id = COALESCE(p_location_id, location_id),
    country = COALESCE(p_country, country),
    updated_at = NOW()
  WHERE id = p_residence_id
  RETURNING * INTO v_residence;

  RETURN v_residence;
END;
$$;

COMMENT ON FUNCTION create_user_residence_with_canonical IS 
  'ETAPA 12: Criar residência apenas com campos canônicos (legado removido)';

COMMENT ON FUNCTION update_user_residence_with_canonical IS 
  'ETAPA 12: Atualizar residência apenas com campos canônicos (legado removido)';
