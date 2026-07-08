-- ============================================================================
-- Create Gastronomia review mutation RPCs
-- ============================================================================
-- The frontend SSOT calls these RPCs after delivered orders. They were missing
-- from the schema, so review submission could fail after the order flow passed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_user_review_business(
  p_user_id UUID,
  p_business_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_has_existing_review BOOLEAN;
BEGIN
  IF v_auth_user_id IS NULL OR p_user_id IS DISTINCT FROM v_auth_user_id THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.reviews r
    JOIN public.profiles p ON p.id = r.reviewer_profile_id
    WHERE p.user_id = v_auth_user_id
      AND r.reviewed_profile_id = p_business_profile_id
      AND r.review_type = 'business'
      AND COALESCE(r.status, 'active') = 'active'
  )
  INTO v_has_existing_review;

  RETURN NOT v_has_existing_review;
END;
$$;
CREATE OR REPLACE FUNCTION public.create_business_review(
  p_reviewed_profile_id UUID,
  p_reviewer_profile_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL,
  p_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_order_id UUID DEFAULT NULL
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_review public.reviews;
  v_order public.orders;
  v_comment TEXT := NULLIF(btrim(COALESCE(p_comment, '')), '');
  v_photos TEXT[] := COALESCE(p_photos, ARRAY[]::TEXT[]);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501';
  END IF;

  IF NOT public.auth_can_access_profile(p_reviewer_profile_id) THEN
    RAISE EXCEPTION 'Perfil avaliador nao pertence ao usuario autenticado'
      USING ERRCODE = '42501';
  END IF;

  IF p_reviewed_profile_id IS NULL OR p_reviewed_profile_id = p_reviewer_profile_id THEN
    RAISE EXCEPTION 'Perfil avaliado invalido' USING ERRCODE = '22023';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'A nota deve estar entre 1 e 5' USING ERRCODE = '22023';
  END IF;

  IF array_length(v_photos, 1) > 6 THEN
    RAISE EXCEPTION 'Uma avaliacao aceita no maximo 6 fotos' USING ERRCODE = '22023';
  END IF;

  IF p_order_id IS NOT NULL THEN
    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pedido nao encontrado para avaliacao' USING ERRCODE = '22023';
    END IF;

    IF v_order.customer_profile_id IS DISTINCT FROM p_reviewer_profile_id
      OR v_order.merchant_profile_id IS DISTINCT FROM p_reviewed_profile_id
      OR v_order.logistics_status::TEXT <> 'delivered'
    THEN
      RAISE EXCEPTION 'Pedido nao elegivel para avaliacao publica'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.reviews (
    reviewed_profile_id,
    reviewer_profile_id,
    rating,
    comment,
    photos,
    business_response,
    business_response_at,
    order_id,
    review_type,
    status
  )
  VALUES (
    p_reviewed_profile_id,
    p_reviewer_profile_id,
    p_rating,
    left(v_comment, 1000),
    v_photos,
    NULL,
    NULL,
    p_order_id,
    'business',
    'active'
  )
  RETURNING * INTO v_review;

  RETURN v_review;
END;
$$;
CREATE OR REPLACE FUNCTION public.update_business_review(
  p_review_id UUID,
  p_rating INTEGER DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_photos TEXT[] DEFAULT NULL
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_review public.reviews;
  v_rating INTEGER;
  v_photos TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_review
  FROM public.reviews
  WHERE id = p_review_id
    AND review_type = 'business'
    AND COALESCE(status, 'active') = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliacao nao encontrada' USING ERRCODE = '22023';
  END IF;

  IF NOT public.auth_can_access_profile(v_review.reviewer_profile_id) THEN
    RAISE EXCEPTION 'Usuario nao autorizado a editar esta avaliacao'
      USING ERRCODE = '42501';
  END IF;

  v_rating := COALESCE(p_rating, v_review.rating);
  v_photos := COALESCE(p_photos, v_review.photos, ARRAY[]::TEXT[]);

  IF v_rating < 1 OR v_rating > 5 THEN
    RAISE EXCEPTION 'A nota deve estar entre 1 e 5' USING ERRCODE = '22023';
  END IF;

  IF array_length(v_photos, 1) > 6 THEN
    RAISE EXCEPTION 'Uma avaliacao aceita no maximo 6 fotos' USING ERRCODE = '22023';
  END IF;

  UPDATE public.reviews
  SET
    rating = v_rating,
    comment = left(NULLIF(btrim(COALESCE(p_comment, v_review.comment, '')), ''), 1000),
    photos = v_photos,
    updated_at = NOW()
  WHERE id = p_review_id
  RETURNING * INTO v_review;

  RETURN v_review;
END;
$$;
CREATE OR REPLACE FUNCTION public.delete_business_review(
  p_review_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_review public.reviews;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_review
  FROM public.reviews
  WHERE id = p_review_id
    AND review_type = 'business'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliacao nao encontrada' USING ERRCODE = '22023';
  END IF;

  IF NOT public.auth_can_access_profile(v_review.reviewer_profile_id) THEN
    RAISE EXCEPTION 'Usuario nao autorizado a remover esta avaliacao'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.reviews
  WHERE id = p_review_id;

  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION public.add_business_review_response(
  p_review_id UUID,
  p_business_response TEXT
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_review public.reviews;
  v_response TEXT := NULLIF(btrim(COALESCE(p_business_response, '')), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501';
  END IF;

  IF v_response IS NULL THEN
    RAISE EXCEPTION 'Resposta da empresa e obrigatoria' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_review
  FROM public.reviews
  WHERE id = p_review_id
    AND review_type = 'business'
    AND COALESCE(status, 'active') = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliacao nao encontrada' USING ERRCODE = '22023';
  END IF;

  IF NOT public.auth_can_access_profile(v_review.reviewed_profile_id) THEN
    RAISE EXCEPTION 'Usuario nao autorizado a responder por esta empresa'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.reviews
  SET
    business_response = left(v_response, 1000),
    business_response_at = NOW(),
    updated_at = NOW()
  WHERE id = p_review_id
  RETURNING * INTO v_review;

  RETURN v_review;
END;
$$;
REVOKE ALL ON FUNCTION public.can_user_review_business(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_user_review_business(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_user_review_business(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_review_business(UUID, UUID) TO service_role;
REVOKE ALL ON FUNCTION public.create_business_review(UUID, UUID, INTEGER, TEXT, TEXT[], UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_business_review(UUID, UUID, INTEGER, TEXT, TEXT[], UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_business_review(UUID, UUID, INTEGER, TEXT, TEXT[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_review(UUID, UUID, INTEGER, TEXT, TEXT[], UUID) TO service_role;
REVOKE ALL ON FUNCTION public.update_business_review(UUID, INTEGER, TEXT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_business_review(UUID, INTEGER, TEXT, TEXT[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_business_review(UUID, INTEGER, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_business_review(UUID, INTEGER, TEXT, TEXT[]) TO service_role;
REVOKE ALL ON FUNCTION public.delete_business_review(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_business_review(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_business_review(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_business_review(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.add_business_review_response(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_business_review_response(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_business_review_response(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_business_review_response(UUID, TEXT) TO service_role;
NOTIFY pgrst, 'reload schema';
