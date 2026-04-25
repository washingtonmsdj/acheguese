-- Correção das RPCs para seguir SSOT (business_data como fonte da verdade)
-- 
-- PROBLEMA: As RPCs estão retornando profile.id em vez de business_data.id
-- SOLUÇÃO: Atualizar as RPCs para usar business_data.id como identificador principal

-- 1. Backup da função atual (se existir)
-- CREATE OR REPLACE FUNCTION get_public_gastronomy_snapshot_by_slug_backup AS 
-- SELECT * FROM get_public_gastronomy_snapshot_by_slug;

-- 2. Correção da RPC principal de gastronomia
CREATE OR REPLACE FUNCTION get_public_gastronomy_snapshot_by_slug(
    p_state text,
    p_city text,
    p_district text,
    p_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
    v_business_id uuid;
    v_profile_id uuid;
    v_gastro_profile_id uuid;
BEGIN
    -- Buscar business_data usando SSOT (business_data como fonte principal)
    SELECT 
        bd.id,
        bd.profile_id,
        gp.id as gastro_profile_id
    INTO v_business_id, v_profile_id, v_gastro_profile_id
    FROM business_data bd
    INNER JOIN gastronomy_profiles gp ON gp.business_id = bd.id
    WHERE bd.slug = p_slug
      AND bd.status = 'active'
      AND gp.status = 'active'
    LIMIT 1;
    
    IF v_business_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Construir snapshot usando business_data.id como identificador principal
    SELECT jsonb_build_object(
        'seo', jsonb_build_object(
            'title', bd.business_name,
            'description', COALESCE(bd.description, ''),
            'canonical', format('/%s/%s/%s/%s', p_state, p_city, COALESCE(p_district, '_'), p_slug)
        ),
        'routing', jsonb_build_object(
            'state', p_state,
            'city', p_city,
            'district', COALESCE(p_district, '_'),
            'slug', p_slug
        ),
        'identity', jsonb_build_object(
            'profileId', v_profile_id,
            'slug', p_slug
        ),
        'verticals', jsonb_build_object(
            'activeVerticals', ARRAY['gastronomy']
        ),
        'gastronomy', jsonb_build_object(
            'business', jsonb_build_object(
                'id', v_business_id,  -- SSOT: business_data.id
                'profile_id', v_profile_id,
                'name', bd.business_name,
                'slug', bd.slug,
                'description', bd.description,
                'category', bd.category,
                'status', bd.status
            ),
            'profile', jsonb_build_object(
                'id', v_gastro_profile_id,
                'business_id', v_business_id,  -- SSOT: business_data.id
                'cuisine_type', gp.cuisine_type,
                'niche_key', gp.niche_key,
                'price_range', gp.price_range,
                'delivery_enabled', gp.delivery_enabled,
                'takeout_enabled', gp.takeout_enabled,
                'dine_in_enabled', gp.dine_in_enabled
            )
        ),
        'institutional', jsonb_build_object(
            'name', bd.business_name,
            'description', COALESCE(bd.description, ''),
            'business', jsonb_build_object(
                'id', v_business_id,  -- SSOT: business_data.id
                'profile_id', v_profile_id,
                'name', bd.business_name,
                'slug', bd.slug
            )
        )
    )
    INTO v_result
    FROM business_data bd
    INNER JOIN gastronomy_profiles gp ON gp.business_id = bd.id
    WHERE bd.id = v_business_id;
    
    RETURN v_result;
END;
$$;

-- 3. Correção da RPC de business (para consistência)
CREATE OR REPLACE FUNCTION get_public_business_snapshot_by_slug(
    p_state text,
    p_city text,
    p_district text,
    p_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
    v_business_id uuid;
    v_profile_id uuid;
BEGIN
    -- Buscar business_data usando SSOT
    SELECT 
        bd.id,
        bd.profile_id
    INTO v_business_id, v_profile_id
    FROM business_data bd
    WHERE bd.slug = p_slug
      AND bd.status = 'active'
    LIMIT 1;
    
    IF v_business_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Construir snapshot usando business_data.id como identificador principal
    SELECT jsonb_build_object(
        'seo', jsonb_build_object(
            'title', bd.business_name,
            'description', COALESCE(bd.description, ''),
            'canonical', format('/%s/%s/%s/%s', p_state, p_city, COALESCE(p_district, '_'), p_slug)
        ),
        'routing', jsonb_build_object(
            'state', p_state,
            'city', p_city,
            'district', COALESCE(p_district, '_'),
            'slug', p_slug
        ),
        'identity', jsonb_build_object(
            'profileId', v_profile_id,
            'slug', p_slug
        ),
        'verticals', jsonb_build_object(
            'activeVerticals', COALESCE(
                ARRAY(SELECT DISTINCT 'gastronomy' 
                      FROM gastronomy_profiles 
                      WHERE business_id = bd.id AND status = 'active'),
                ARRAY[]::text[]
            )
        ),
        'institutional', jsonb_build_object(
            'name', bd.business_name,
            'description', COALESCE(bd.description, ''),
            'business', jsonb_build_object(
                'id', v_business_id,  -- SSOT: business_data.id
                'profile_id', v_profile_id,
                'name', bd.business_name,
                'slug', bd.slug
            )
        )
    )
    INTO v_result
    FROM business_data bd
    WHERE bd.id = v_business_id;
    
    RETURN v_result;
END;
$$;

-- 4. Garantir permissões corretas
GRANT EXECUTE ON FUNCTION get_public_gastronomy_snapshot_by_slug TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_business_snapshot_by_slug TO anon, authenticated;

-- 5. Limpar cache se necessário
-- NOTIFY pgrst, 'reload schema';
