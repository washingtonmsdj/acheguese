-- ============================================================================
-- FIX: PROFILE_LINKS - PERMITIR OWNER OPERACIONAL GERENCIAR LINKS
-- ============================================================================
-- Problema: Trigger validate_profile_link_same_account valida apenas user_id
-- Solução: Aceitar links quando usuário é owner/admin operacional de ambos
-- ============================================================================

-- Recriar função do trigger com lógica híbrida
CREATE OR REPLACE FUNCTION validate_profile_link_same_account()
RETURNS TRIGGER AS $$
DECLARE
  v_from_user_id UUID;
  v_to_user_id UUID;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Buscar user_id dos perfis
  SELECT user_id INTO v_from_user_id FROM profiles WHERE id = NEW.from_profile_id;
  SELECT user_id INTO v_to_user_id FROM profiles WHERE id = NEW.to_profile_id;
  
  -- REGRA 1: Ambos perfis têm mesmo user_id (owner estrutural)
  IF v_from_user_id = v_to_user_id THEN
    RETURN NEW;
  END IF;
  
  -- REGRA 2: Usuário atual é owner/admin operacional de AMBOS os perfis
  IF EXISTS (
    SELECT 1 FROM profile_members pm1
    WHERE pm1.profile_id = NEW.from_profile_id
    AND pm1.user_id = v_current_user_id
    AND pm1.role IN ('owner', 'admin')
  ) AND EXISTS (
    SELECT 1 FROM profile_members pm2
    WHERE pm2.profile_id = NEW.to_profile_id
    AND pm2.user_id = v_current_user_id
    AND pm2.role IN ('owner', 'admin')
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Se nenhuma regra passou, bloquear
  RAISE EXCEPTION 'Profile links must be between profiles of the same account or managed by the same owner/admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION validate_profile_link_same_account IS 
  'Multi-perfil: garante que links são entre perfis da mesma conta OU gerenciados pelo mesmo owner/admin operacional';
