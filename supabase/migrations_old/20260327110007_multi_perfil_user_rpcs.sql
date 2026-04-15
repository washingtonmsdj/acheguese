-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - USER RPCs
-- ============================================================================
-- Criar RPCs para operações de usuário autenticado
-- ============================================================================

-- ============================================================================
-- RPC: create_profile_with_extension (ENDURECIDA)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_profile_with_extension(
  p_profile_type TEXT,
  p_handle TEXT,
  p_display_name TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_extension_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_profile_id UUID;
  v_normalized_handle CITEXT;
BEGIN
  -- CRÍTICO: Obter user_id do contexto de autenticação
  v_current_user_id := auth.uid();
  
  -- Validar autenticação
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Validar profile_type
  IF p_profile_type NOT IN ('personal', 'business', 'professional', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid profile type');
  END IF;
  
  -- ENDURECIMENTO: business/professional/driver EXIGEM extension_data
  IF p_profile_type IN ('business', 'professional', 'driver') AND p_extension_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extension data required for ' || p_profile_type || ' profiles');
  END IF;
  
  -- Validar campos obrigatórios por tipo
  IF p_profile_type = 'business' THEN
    IF p_extension_data->>'legal_name' IS NULL OR trim(p_extension_data->>'legal_name') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'legal_name is required for business profiles');
    END IF;
  END IF;
  
  IF p_profile_type = 'professional' THEN
    IF p_extension_data->>'profession' IS NULL OR trim(p_extension_data->>'profession') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'profession is required for professional profiles');
    END IF;
  END IF;
  
  IF p_profile_type = 'driver' THEN
    IF p_extension_data->>'license_number' IS NULL OR trim(p_extension_data->>'license_number') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_number is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_category' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_category is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_expiry' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_expiry is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_state' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_state is required for driver profiles');
    END IF;
  END IF;
  
  -- Normalizar handle
  v_normalized_handle := lower(trim(regexp_replace(p_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  
  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;
  
  -- Verificar unicidade
  IF p_profile_type = 'personal' AND EXISTS (
    SELECT 1 FROM profiles WHERE user_id = v_current_user_id AND profile_type = 'personal'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a personal profile');
  END IF;
  
  IF p_profile_type = 'driver' AND EXISTS (
    SELECT 1 FROM profiles WHERE user_id = v_current_user_id AND profile_type = 'driver'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a driver profile');
  END IF;
  
  -- Criar perfil
  INSERT INTO profiles (user_id, profile_type, handle, display_name, avatar_url, bio)
  VALUES (v_current_user_id, p_profile_type, v_normalized_handle, p_display_name, p_avatar_url, p_bio)
  RETURNING id INTO v_profile_id;
  
  -- Criar extensão
  IF p_profile_type = 'business' THEN
    INSERT INTO business_data (
      profile_id, legal_name, cnpj, company_type, industry
    ) VALUES (
      v_profile_id,
      p_extension_data->>'legal_name',
      p_extension_data->>'cnpj',
      p_extension_data->>'company_type',
      p_extension_data->>'industry'
    );
    
    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');
    
  ELSIF p_profile_type = 'professional' THEN
    INSERT INTO professional_data (
      profile_id, profession, specialties, years_experience
    ) VALUES (
      v_profile_id,
      p_extension_data->>'profession',
      CASE 
        WHEN p_extension_data->>'specialties' IS NOT NULL 
        THEN string_to_array(p_extension_data->>'specialties', ',')
        ELSE NULL
      END,
      (p_extension_data->>'years_experience')::INTEGER
    );
    
    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');
    
  ELSIF p_profile_type = 'driver' THEN
    INSERT INTO driver_data (
      profile_id, license_number, license_category, license_expiry, license_state
    ) VALUES (
      v_profile_id,
      p_extension_data->>'license_number',
      p_extension_data->>'license_category',
      (p_extension_data->>'license_expiry')::DATE,
      p_extension_data->>'license_state'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'handle', v_normalized_handle
  );
END;
$$;

-- ============================================================================
-- RPC: transfer_profile_ownership
-- ============================================================================

CREATE OR REPLACE FUNCTION transfer_profile_ownership(
  p_profile_id UUID,
  p_new_owner_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_profile_type TEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Verificar se é dono estrutural
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_profile_id 
    AND user_id = v_current_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can transfer ownership');
  END IF;
  
  -- Verificar tipo de perfil
  SELECT profile_type INTO v_profile_type
  FROM profiles
  WHERE id = p_profile_id;
  
  IF v_profile_type IN ('personal', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer ownership of personal or driver profiles');
  END IF;
  
  -- Remover owner atual
  DELETE FROM profile_members
  WHERE profile_id = p_profile_id
  AND role = 'owner';
  
  -- Adicionar novo owner
  INSERT INTO profile_members (profile_id, user_id, role, invited_by)
  VALUES (p_profile_id, p_new_owner_user_id, 'owner', v_current_user_id)
  ON CONFLICT (profile_id, user_id) 
  DO UPDATE SET role = 'owner';
  
  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$$;

-- ============================================================================
-- RPC: delete_profile
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_profile(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Verificar se é dono estrutural
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_profile_id 
    AND user_id = v_current_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can delete profile');
  END IF;
  
  -- Deletar perfil (cascade deleta extensões e membros)
  DELETE FROM profiles WHERE id = p_profile_id;
  
  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$$;

-- ============================================================================
-- RPC: update_profile_handle
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profile_handle(
  p_profile_id UUID,
  p_new_handle TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_normalized_handle CITEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Verificar permissão (dono estrutural ou owner/admin operacional)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_profile_id 
    AND user_id = v_current_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
    AND user_id = v_current_user_id
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;
  
  -- Normalizar handle
  v_normalized_handle := lower(trim(regexp_replace(p_new_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  
  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;
  
  -- Atualizar handle
  UPDATE profiles
  SET handle = v_normalized_handle
  WHERE id = p_profile_id;
  
  RETURN jsonb_build_object('success', true, 'handle', v_normalized_handle);
END;
$$;

-- Comentários
COMMENT ON FUNCTION create_profile_with_extension IS 'Multi-perfil: criar perfil com extensão obrigatória para business/professional/driver';
COMMENT ON FUNCTION transfer_profile_ownership IS 'Multi-perfil: transferir ownership operacional (apenas business/professional)';
COMMENT ON FUNCTION delete_profile IS 'Multi-perfil: deletar perfil (apenas dono estrutural)';
COMMENT ON FUNCTION update_profile_handle IS 'Multi-perfil: atualizar handle (dono ou owner/admin)';
