-- Read favorite state for the bounded set of businesses visible in a UI surface.

CREATE OR REPLACE FUNCTION public.get_current_user_business_favorite_ids(
  p_business_ids UUID[]
)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  normalized_business_ids UUID[];
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;
  IF p_business_ids IS NULL
     OR cardinality(p_business_ids) NOT BETWEEN 1 AND 100
     OR array_position(p_business_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'business_ids_must_contain_between_1_and_100_values'
      USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(DISTINCT business_id ORDER BY business_id)
  INTO normalized_business_ids
  FROM unnest(p_business_ids) AS business_id;

  RETURN COALESCE(
    (
      SELECT array_agg(favorite.business_id ORDER BY favorite.business_id)
      FROM public.user_favorite_businesses AS favorite
      WHERE favorite.user_id = current_user_id
        AND favorite.business_id = ANY(normalized_business_ids)
    ),
    ARRAY[]::UUID[]
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_business_favorite_ids(UUID[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_business_favorite_ids(UUID[])
  TO authenticated, service_role;

COMMENT ON FUNCTION public.get_current_user_business_favorite_ids(UUID[]) IS
  'Returns authenticated-account favorite IDs for at most 100 candidate businesses.';
