-- ============================================================
-- CORREÇÃO FINAL: Apenas RPC Functions
-- ============================================================
-- O diagnóstico mostrou:
-- ✅ 62 locations existem
-- ✅ 1 grupo territorial existe
-- ✅ 0 hierarquias inválidas
--
-- Conclusão: Banco está OK!
-- Precisamos apenas garantir que as RPC functions existem
-- ============================================================

-- ============================================================
-- 1. RPC: get_business_reviews
-- ============================================================
CREATE OR REPLACE FUNCTION get_business_reviews(
  p_business_profile_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  reviewer_profile_id UUID,
  reviewer_name TEXT,
  reviewer_avatar TEXT,
  rating INTEGER,
  comment TEXT,
  photos TEXT[],
  business_response TEXT,
  business_response_at TIMESTAMPTZ,
  order_id UUID,
  helpful_count INTEGER,
  not_helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  is_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.reviewer_profile_id,
    COALESCE(p.name, 'Usuário') as reviewer_name,
    p.avatar_url as reviewer_avatar,
    r.rating,
    r.comment,
    COALESCE(r.photos, ARRAY[]::TEXT[]) as photos,
    r.business_response,
    r.business_response_at,
    r.order_id,
    COALESCE(r.helpful_count, 0) as helpful_count,
    COALESCE(r.not_helpful_count, 0) as not_helpful_count,
    r.created_at,
    COALESCE(r.is_verified, false) as is_verified
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.reviewer_profile_id
  WHERE r.reviewed_profile_id = p_business_profile_id
    AND r.status = 'active'
    AND r.review_type = 'business'
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$;

-- ============================================================
-- 2. RPC: can_user_review_business
-- ============================================================
CREATE OR REPLACE FUNCTION can_user_review_business(
  p_user_id UUID,
  p_business_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_has_existing_review BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM reviews
    WHERE reviewer_profile_id = p_user_id
      AND reviewed_profile_id = p_business_profile_id
      AND status = 'active'
      AND review_type = 'business'
  ) INTO v_has_existing_review;
  
  IF v_has_existing_review THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$;

-- ============================================================
-- 3. Grants
-- ============================================================
GRANT EXECUTE ON FUNCTION get_business_reviews TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_user_review_business TO authenticated, anon;

-- ============================================================
-- 4. Comentários
-- ============================================================
COMMENT ON FUNCTION get_business_reviews IS 'Retorna reviews de um negócio com informações do avaliador';
COMMENT ON FUNCTION can_user_review_business IS 'Verifica se usuário pode avaliar um negócio';

-- ============================================================
-- 5. Verificar se foram criadas
-- ============================================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  'Criada com sucesso!' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_business_reviews',
    'can_user_review_business'
  )
ORDER BY routine_name;

-- ============================================================
-- FIM
-- ============================================================
-- As RPC functions foram criadas/atualizadas!
-- Agora teste a aplicação: npm run dev
-- O console deve estar limpo! ✅
-- ============================================================
