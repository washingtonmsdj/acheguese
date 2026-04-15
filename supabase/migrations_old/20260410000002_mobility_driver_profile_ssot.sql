-- ============================================================================
-- Mobility / Driver SSOT: driver profile extension + complete profile view
-- ============================================================================
-- Aligns create_profile_with_extension(driver) with the canonical driver_data
-- schema consumed by the frontend and rebuilds driver_complete_profile with the
-- same fields used by runtime/admin queries.

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
  v_address_id UUID;
  v_location_id UUID;
  v_professional_slug TEXT;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_profile_type NOT IN ('personal', 'business', 'professional', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid profile type');
  END IF;

  IF p_profile_type IN ('business', 'professional', 'driver') AND p_extension_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extension data required for ' || p_profile_type || ' profiles');
  END IF;

  IF p_profile_type = 'business' THEN
    IF p_extension_data->>'legal_name' IS NULL OR trim(p_extension_data->>'legal_name') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'legal_name is required for business profiles');
    END IF;
  END IF;

  IF p_profile_type = 'professional' THEN
    IF p_extension_data->>'profession' IS NULL OR trim(p_extension_data->>'profession') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'profession is required for professional profiles');
    END IF;
    IF p_extension_data->>'location_id' IS NULL OR trim(p_extension_data->>'location_id') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'location_id is required for professional profiles');
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
    IF p_extension_data->>'vehicle_type' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_type is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_plate' IS NULL OR trim(p_extension_data->>'vehicle_plate') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_plate is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_model' IS NULL OR trim(p_extension_data->>'vehicle_model') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_model is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_year' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_year is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_color' IS NULL OR trim(p_extension_data->>'vehicle_color') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_color is required for driver profiles');
    END IF;
  END IF;

  v_normalized_handle := lower(trim(regexp_replace(p_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');

  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,99}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;

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

  v_address_id := NULLIF(p_extension_data->>'address_id', '')::UUID;
  v_location_id := NULLIF(p_extension_data->>'location_id', '')::UUID;

  IF p_profile_type = 'professional' THEN
    v_professional_slug := NULLIF(trim(COALESCE(p_extension_data->>'slug', '')), '');
    IF v_professional_slug IS NULL THEN
      v_professional_slug := v_normalized_handle::TEXT;
    END IF;
    v_professional_slug := lower(regexp_replace(v_professional_slug, '[^a-z0-9-]+', '-', 'g'));
    v_professional_slug := regexp_replace(v_professional_slug, '-+', '-', 'g');
    v_professional_slug := regexp_replace(v_professional_slug, '^-|-$', '', 'g');
  END IF;

  INSERT INTO profiles (
    user_id,
    profile_type,
    handle,
    name,
    display_name,
    avatar_url,
    bio
  )
  VALUES (
    v_current_user_id,
    p_profile_type,
    v_normalized_handle,
    p_display_name,
    p_display_name,
    p_avatar_url,
    p_bio
  )
  RETURNING id INTO v_profile_id;

  IF p_profile_type = 'business' THEN
    INSERT INTO business_data (
      profile_id,
      business_name,
      legal_name,
      cnpj,
      company_type,
      industry,
      status,
      address_id,
      location_id
    ) VALUES (
      v_profile_id,
      p_extension_data->>'legal_name',
      p_extension_data->>'legal_name',
      p_extension_data->>'cnpj',
      p_extension_data->>'company_type',
      p_extension_data->>'industry',
      'pending',
      v_address_id,
      v_location_id
    );

    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');

  ELSIF p_profile_type = 'professional' THEN
    INSERT INTO professional_data (
      profile_id,
      slug,
      professional_name,
      service_category,
      service_subcategory,
      description,
      certifications,
      experience_years,
      education,
      price_range,
      service_areas,
      available_hours,
      whatsapp,
      is_accepting_clients,
      address_id,
      location_id,
      metadata
    ) VALUES (
      v_profile_id,
      v_professional_slug,
      p_display_name,
      p_extension_data->'metadata'->>'category',
      p_extension_data->>'profession',
      p_bio,
      COALESCE(p_extension_data->'certifications', '[]'::jsonb),
      NULLIF(p_extension_data->>'years_experience', '')::INTEGER,
      p_extension_data->>'education',
      p_extension_data->'metadata'->>'price_range',
      COALESCE(p_extension_data->'service_area', '[]'::jsonb),
      p_extension_data->'metadata'->'available_hours',
      p_extension_data->'metadata'->>'whatsapp',
      true,
      v_address_id,
      v_location_id,
      COALESCE(p_extension_data->'metadata', '{}'::jsonb)
    );

    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');

  ELSIF p_profile_type = 'driver' THEN
    INSERT INTO driver_data (
      profile_id,
      license_number,
      license_category,
      license_expiry,
      license_state,
      vehicle,
      vehicle_type,
      vehicle_plate,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      documents_verified,
      documents_verified_at,
      background_check_status,
      background_check_date,
      is_available
    ) VALUES (
      v_profile_id,
      p_extension_data->>'license_number',
      p_extension_data->>'license_category',
      (p_extension_data->>'license_expiry')::DATE,
      p_extension_data->>'license_state',
      jsonb_build_object(
        'type', p_extension_data->>'vehicle_type',
        'plate', p_extension_data->>'vehicle_plate',
        'model', p_extension_data->>'vehicle_model',
        'year', NULLIF(p_extension_data->>'vehicle_year', '')::INTEGER,
        'color', p_extension_data->>'vehicle_color'
      ),
      p_extension_data->>'vehicle_type',
      p_extension_data->>'vehicle_plate',
      p_extension_data->>'vehicle_model',
      NULLIF(p_extension_data->>'vehicle_year', '')::INTEGER,
      p_extension_data->>'vehicle_color',
      COALESCE((p_extension_data->>'documents_verified')::BOOLEAN, false),
      NULLIF(p_extension_data->>'documents_verified_at', '')::TIMESTAMPTZ,
      COALESCE(p_extension_data->>'background_check_status', 'pending'),
      NULLIF(p_extension_data->>'background_check_date', '')::TIMESTAMPTZ,
      COALESCE((p_extension_data->>'is_available')::BOOLEAN, false)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', v_profile_id,
      'handle', v_normalized_handle
    )
  );
END;
$$;

DROP VIEW IF EXISTS driver_complete_profile;

CREATE VIEW driver_complete_profile AS
SELECT
  dd.profile_id,
  p.name AS display_name,
  p.avatar_url,
  dd.rating AS avg_rating,
  dd.total_rides,
  dd.total_rides_completed,
  dd.total_rides_cancelled,
  dd.acceptance_rate,
  dd.cancellation_rate,
  dd.is_online,
  dd.is_available,
  dd.is_verified,
  dd.subscription_active,
  dd.vehicle,
  dd.vehicle_type,
  dd.vehicle_plate,
  dd.vehicle_model,
  dd.vehicle_year,
  dd.vehicle_color,
  dd.created_at,
  dd.updated_at
FROM driver_data dd
JOIN profiles p ON p.id = dd.profile_id;

GRANT SELECT ON driver_complete_profile TO authenticated;
GRANT SELECT ON driver_complete_profile TO anon;

COMMENT ON FUNCTION create_profile_with_extension IS
  'Multi-perfil: criar perfis com extensoes canonicas, incluindo driver_data completo';

COMMENT ON VIEW driver_complete_profile IS
  'View consolidada de motoristas baseada em profiles + driver_data com todos os campos consumidos pelo runtime/admin.';
