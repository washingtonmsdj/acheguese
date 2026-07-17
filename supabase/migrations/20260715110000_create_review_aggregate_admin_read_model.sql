-- Keep administrative Review aggregation behind the canonical Reviews owner.

-- security-authority: public-rpc public.get_review_aggregates_admin
CREATE OR REPLACE FUNCTION public.get_review_aggregates_admin(
  p_profile_ids UUID[],
  p_review_type TEXT
)
RETURNS TABLE (
  reviewed_profile_id UUID,
  review_count INTEGER,
  average_rating NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_profile_ids UUID[];
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_review_type NOT IN ('business', 'professional', 'service') THEN
    RAISE EXCEPTION 'invalid_review_type' USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(DISTINCT value)
  INTO v_profile_ids
  FROM unnest(COALESCE(p_profile_ids, ARRAY[]::UUID[])) value
  WHERE value IS NOT NULL;

  IF COALESCE(cardinality(v_profile_ids), 0) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'review_aggregate_batch_out_of_range'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    review.reviewed_profile_id,
    count(*)::INTEGER,
    round(avg(review.rating)::NUMERIC, 1)
  FROM public.reviews review
  WHERE review.reviewed_profile_id = ANY(v_profile_ids)
    AND review.review_type::TEXT = p_review_type
    AND review.status = 'active'
  GROUP BY review.reviewed_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_review_aggregates_admin(UUID[], TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_review_aggregates_admin(UUID[], TEXT)
  TO authenticated;

COMMENT ON FUNCTION public.get_review_aggregates_admin(UUID[], TEXT) IS
  'Read model administrativo agregado de Reviews; exige admin e lote de ate 200 Profiles.';
