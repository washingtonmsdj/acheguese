-- ============================================================================
-- FIX: create_profile_with_extension - Corrigir extensões
-- ============================================================================
-- PROBLEMA: 
--   1. business_data.business_name é NOT NULL mas RPC não seta
--   2. professional_data tem constraint que exige location_id quando is_accepting_clients=true
-- SOLUÇÃO: 
--   1. Setar business_name = legal_name
--   2. Setar is_accepting_clients = false por padrão
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
  
  -- Criar perfil (INCLUIR name = display_name)
  INSERT INTO profiles (user_id, profile_type, handle, name, display_name, avatar_url, bio)
  VALUES (v_current_user_id, p_profile_type, v_normalized_handle, p_display_name, p_display_name, p_avatar_url, p_bio)
  RETURNING id INTO v_profile_id;
  
  -- Criar extensão
  IF p_profile_type = 'business' THEN
    -- FIX: Setar business_name (NOT NULL) = legal_name
    INSERT INTO business_data (
      profile_id, business_name, legal_name, cnpj, company_type, industry
    ) VALUES (
      v_profile_id,
      p_extension_data->>'legal_name',  -- business_name = legal_name
      p_extension_data->>'legal_name',
      p_extension_data->>'cnpj',
      p_extension_data->>'company_type',
      p_extension_data->>'industry'
    );
    
    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');
    
  ELSIF p_profile_type = 'professional' THEN
    -- FIX: Setar is_accepting_clients = false para evitar constraint de location_id
    INSERT INTO professional_data (
      profile_id, profession, specialties, years_experience, is_accepting_clients
    ) VALUES (
      v_profile_id,
      p_extension_data->>'profession',
      CASE 
        WHEN p_extension_data->>'specialties' IS NOT NULL 
        THEN string_to_array(p_extension_data->>'specialties', ',')
        ELSE NULL
      END,
      (p_extension_data->>'years_experience')::INTEGER,
      false  -- Não aceita clientes por padrão (evita constraint de location_id)
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

COMMENT ON FUNCTION create_profile_with_extension IS 'Multi-perfil: criar perfil com extensão (FIXED: business_name + is_accepting_clients)';
