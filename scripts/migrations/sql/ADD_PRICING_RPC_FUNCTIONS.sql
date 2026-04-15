-- Funções RPC para gerenciar regras de pricing sem conflito com triggers

-- ============================================
-- FUNÇÃO: Ativar regra (desativa outras automaticamente)
-- ============================================

CREATE OR REPLACE FUNCTION activate_pricing_rule(
  p_rule_id UUID,
  p_performed_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validar se o usuário existe, caso contrário usar NULL
  IF p_performed_by = '00000000-0000-0000-0000-000000000000' THEN
    v_user_id := NULL;
  ELSE
    v_user_id := p_performed_by;
  END IF;

  -- Desativar todas as regras ativas do mesmo modo
  UPDATE pricing_rules
  SET is_active = false, updated_by = v_user_id
  WHERE mode = (SELECT mode FROM pricing_rules WHERE id = p_rule_id)
    AND is_active = true
    AND id != p_rule_id;
  
  -- Ativar a regra solicitada
  UPDATE pricing_rules
  SET is_active = true, updated_by = v_user_id
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Criar regra ativa (desativa outras automaticamente)
-- ============================================

CREATE OR REPLACE FUNCTION create_active_pricing_rule(
  p_mode TEXT,
  p_name TEXT,
  p_base_fare DECIMAL,
  p_price_per_km DECIMAL,
  p_price_per_minute DECIMAL,
  p_minimum_fare DECIMAL,
  p_maximum_fare DECIMAL,
  p_is_active BOOLEAN,
  p_valid_from TIMESTAMPTZ,
  p_valid_until TIMESTAMPTZ,
  p_metadata JSONB,
  p_performed_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_rule_id UUID;
  v_user_id UUID;
BEGIN
  -- Validar se o usuário existe, caso contrário usar NULL
  IF p_performed_by = '00000000-0000-0000-0000-000000000000' THEN
    v_user_id := NULL;
  ELSE
    v_user_id := p_performed_by;
  END IF;

  -- Se está criando uma regra ativa, desativar outras do mesmo modo
  IF p_is_active THEN
    UPDATE pricing_rules
    SET is_active = false, updated_by = v_user_id
    WHERE mode = p_mode
      AND is_active = true;
  END IF;
  
  -- Criar a nova regra
  INSERT INTO pricing_rules (
    mode, name, base_fare, price_per_km, price_per_minute,
    minimum_fare, maximum_fare, is_active, valid_from, valid_until,
    metadata, created_by, updated_by
  ) VALUES (
    p_mode, p_name, p_base_fare, p_price_per_km, p_price_per_minute,
    p_minimum_fare, p_maximum_fare, p_is_active, p_valid_from, p_valid_until,
    p_metadata, v_user_id, v_user_id
  )
  RETURNING id INTO v_new_rule_id;
  
  RETURN v_new_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Funções RPC criadas com sucesso!' AS status;
