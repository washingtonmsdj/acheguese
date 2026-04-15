-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - ADMIN RPCs
-- ============================================================================
-- Criar RPCs administrativas (chamadas apenas por backend/service_role)
-- ============================================================================

-- ============================================================================
-- RPC: verify_profile (Admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_profile(
  p_profile_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar perfil
  UPDATE profiles
  SET verified = true,
      verified_at = now()
  WHERE id = p_profile_id;
  
  -- Registrar audit log
  INSERT INTO profile_audit_log (profile_id, action, reason, performed_by)
  VALUES (p_profile_id, 'verified', p_reason, p_admin_user_id);
  
  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$$;

-- ============================================================================
-- RPC: suspend_profile (Admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION suspend_profile(
  p_profile_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar reason obrigatório
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reason is required for suspension');
  END IF;
  
  -- Suspender perfil
  UPDATE profiles
  SET is_active = false
  WHERE id = p_profile_id;
  
  -- Registrar audit log
  INSERT INTO profile_audit_log (profile_id, action, reason, performed_by)
  VALUES (p_profile_id, 'suspended', p_reason, p_admin_user_id);
  
  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$$;

-- Comentários
COMMENT ON FUNCTION verify_profile IS 'Multi-perfil: verificar perfil (apenas backend/service_role)';
COMMENT ON FUNCTION suspend_profile IS 'Multi-perfil: suspender perfil (apenas backend/service_role)';
