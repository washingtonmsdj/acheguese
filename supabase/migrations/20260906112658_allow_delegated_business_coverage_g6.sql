CREATE OR REPLACE FUNCTION private.require_coverage_entity_write(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $function$
DECLARE
  v_actor_profile_id UUID;
  v_is_privileged BOOLEAN := COALESCE(auth.role(), '') = 'service_role'
    OR COALESCE(public.is_admin_from_roles(auth.uid()), FALSE);
  v_entity_exists BOOLEAN := FALSE;
  v_actor_owns_entity BOOLEAN := FALSE;
BEGIN
  IF p_entity_type IS NULL
    OR p_entity_type NOT IN (
      'business',
      'service_provider',
      'classified',
      'mobility_driver',
      'ad_campaign'
    )
  THEN
    RAISE EXCEPTION 'Unsupported coverage entity type'
      USING ERRCODE = '22023';
  END IF;

  IF p_entity_id IS NULL THEN
    RAISE EXCEPTION 'Coverage entity id is required'
      USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_privileged THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication is required'
        USING ERRCODE = '42501';
    END IF;

    v_actor_profile_id := private.current_active_profile_id();
    IF v_actor_profile_id IS NULL THEN
      RAISE EXCEPTION 'An active profile is required'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  CASE p_entity_type
    WHEN 'business' THEN
      SELECT
        TRUE,
        v_is_privileged
          OR (
            business.profile_id = v_actor_profile_id
            AND private.can_manage_profile(business.profile_id)
          )
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.business_data business
      WHERE business.id = p_entity_id;

    WHEN 'service_provider' THEN
      SELECT
        TRUE,
        v_is_privileged OR professional.profile_id = v_actor_profile_id
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.professional_data professional
      WHERE professional.id = p_entity_id;

    WHEN 'classified' THEN
      SELECT
        TRUE,
        v_is_privileged
          OR classified.seller_id = v_actor_profile_id
          OR classified.profile_id = v_actor_profile_id
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.classifieds classified
      WHERE classified.id = p_entity_id;

    WHEN 'mobility_driver' THEN
      SELECT
        TRUE,
        v_is_privileged OR driver.profile_id = v_actor_profile_id
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.driver_data driver
      WHERE driver.id = p_entity_id;

    WHEN 'ad_campaign' THEN
      SELECT
        TRUE,
        v_is_privileged
          OR campaign.created_by_profile_id = v_actor_profile_id
          OR EXISTS (
            SELECT 1
            FROM public.business_data owner_business
            WHERE owner_business.id = campaign.owner_business_id
              AND owner_business.profile_id = v_actor_profile_id
          )
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.ad_campaigns campaign
      WHERE campaign.id = p_entity_id;
  END CASE;

  IF NOT COALESCE(v_entity_exists, FALSE)
    OR NOT COALESCE(v_actor_owns_entity, FALSE)
  THEN
    RAISE EXCEPTION 'Coverage entity is unavailable for this actor'
      USING ERRCODE = '42501';
  END IF;

  RETURN v_actor_profile_id;
END;
$function$;

REVOKE ALL ON FUNCTION private.require_coverage_entity_write(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.require_coverage_entity_write(TEXT, UUID)
  TO service_role;
