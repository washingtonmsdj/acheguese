-- ============================================================
-- Migration: Fix Review RPC Functions
-- Description: Cria/corrige RPC functions para reviews de gastronomia
-- Date: 2026-04-13
-- ============================================================

-- Function: get_business_reviews
-- Retorna reviews de um negócio com informações do reviewer
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
AS $$
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
$$;

-- Function: can_user_review_business
-- Verifica se usuário pode avaliar um negócio
CREATE OR REPLACE FUNCTION can_user_review_business(
  p_user_id UUID,
  p_business_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_existing_review BOOLEAN;
BEGIN
  -- Verificar se já tem review ativo
  SELECT EXISTS(
    SELECT 1 FROM reviews
    WHERE reviewer_profile_id = p_user_id
      AND reviewed_profile_id = p_business_profile_id
      AND status = 'active'
      AND review_type = 'business'
  ) INTO v_has_existing_review;
  
  -- Se já tem review, não pode criar outro
  IF v_has_existing_review THEN
    RETURN FALSE;
  END IF;
  
  -- Permitir review (pode adicionar validação de pedido aqui no futuro)
  RETURN TRUE;
END;
$$;

-- Grants para funções
GRANT EXECUTE ON FUNCTION get_business_reviews TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_user_review_business TO authenticated, anon;

-- Comentários
COMMENT ON FUNCTION get_business_reviews IS 'Retorna reviews de um negócio com informações do reviewer';
COMMENT ON FUNCTION can_user_review_business IS 'Verifica se usuário pode avaliar um negócio';
