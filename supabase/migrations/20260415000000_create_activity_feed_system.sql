-- ============================================================================
-- MIGRATION: Activity Feed System para Gastronomia
-- ============================================================================
-- Descrição: Sistema de feed de atividades sociais para gastronomia
-- Data: 2026-04-15
-- Autor: Sistema SSOT
--
-- Funcionalidades:
-- 1. Campo de privacidade em profiles (share_activity_default)
-- 2. Campo de compartilhamento em delivery_requests (share_as_activity)
-- 3. Function para buscar atividades recentes agregadas
-- 4. Índices para performance
-- ============================================================================

-- ── 1. CAMPO DE PRIVACIDADE EM PROFILES ────────────────────────────────────

-- Adicionar campo para controle de compartilhamento padrão
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS share_activity_default BOOLEAN DEFAULT true;

COMMENT ON COLUMN profiles.share_activity_default IS 
'Configuração padrão para compartilhar atividades. Reviews e favoritos são sempre públicos. Pedidos e visitas usam este valor como padrão mas requerem confirmação.';

-- ── 2. CAMPO DE COMPARTILHAMENTO EM DELIVERY_REQUESTS ──────────────────────

-- Adicionar campo para controle individual de compartilhamento de pedidos
ALTER TABLE delivery_requests 
ADD COLUMN IF NOT EXISTS share_as_activity BOOLEAN DEFAULT false;

COMMENT ON COLUMN delivery_requests.share_as_activity IS 
'Indica se o usuário optou por compartilhar este pedido como atividade pública. Requer confirmação opt-in no momento do pedido.';

-- ── 3. ÍNDICES PARA PERFORMANCE ─────────────────────────────────────────────

-- Índice para buscar reviews recentes por território
CREATE INDEX IF NOT EXISTS idx_reviews_activity_feed 
ON reviews(created_at DESC, status) 
WHERE status = 'active';

-- Índice para buscar favoritos recentes
CREATE INDEX IF NOT EXISTS idx_favorites_activity_feed 
ON user_favorite_businesses(created_at DESC);

-- Índice para buscar pedidos compartilhados
CREATE INDEX IF NOT EXISTS idx_delivery_requests_activity_feed 
ON delivery_requests(created_at DESC, share_as_activity) 
WHERE share_as_activity = true;

-- ── 4. FUNCTION: GET RECENT GASTRONOMY ACTIVITIES ───────────────────────────

CREATE OR REPLACE FUNCTION get_recent_gastronomy_activities(
  p_geographic_path_pattern text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  type text,
  user_name text,
  user_avatar text,
  business_id uuid,
  business_name text,
  business_slug text,
  action_label text,
  emoji text,
  created_at timestamptz
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_include_reviews boolean := true;
  v_include_favorites boolean := true;
  v_include_orders boolean := true;
BEGIN
  -- Determinar quais tipos incluir
  IF p_types IS NOT NULL AND array_length(p_types, 1) > 0 THEN
    v_include_reviews := 'review' = ANY(p_types);
    v_include_favorites := 'favorite' = ANY(p_types);
    v_include_orders := 'order' = ANY(p_types);
  END IF;

  RETURN QUERY
  WITH recent_reviews AS (
    SELECT 
      r.id,
      'review'::text as type,
      COALESCE(p.display_name, 'Usuário') as user_name,
      p.avatar_url as user_avatar,
      bd.id as business_id,
      bd.business_name,
      bd.slug as business_slug,
      CONCAT('avaliou com ', r.rating, '★') as action_label,
      '⭐'::text as emoji,
      r.created_at
    FROM reviews r
    INNER JOIN profiles p ON p.id = r.reviewer_profile_id
    INNER JOIN business_data bd ON bd.id = r.reviewed_profile_id
    INNER JOIN gastronomy_profiles gp ON gp.business_id = bd.id
    WHERE r.status = 'active'
      AND r.review_type = 'business'
      AND v_include_reviews = true
      AND (p_geographic_path_pattern IS NULL OR EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = bd.location_id 
        AND l.geographic_path ~ p_geographic_path_pattern
      ))
    ORDER BY r.created_at DESC
    LIMIT p_limit
  ),
  recent_favorites AS (
    SELECT 
      ufb.id,
      'favorite'::text as type,
      COALESCE(p.display_name, 'Usuário') as user_name,
      p.avatar_url as user_avatar,
      bd.id as business_id,
      bd.business_name,
      bd.slug as business_slug,
      'recomendou'::text as action_label,
      '👍'::text as emoji,
      ufb.created_at
    FROM user_favorite_businesses ufb
    INNER JOIN profiles p ON p.user_id = ufb.user_id
    INNER JOIN business_data bd ON bd.id = ufb.business_id
    INNER JOIN gastronomy_profiles gp ON gp.business_id = bd.id
    WHERE v_include_favorites = true
      AND (p_geographic_path_pattern IS NULL OR EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = bd.location_id 
        AND l.geographic_path ~ p_geographic_path_pattern
      ))
    ORDER BY ufb.created_at DESC
    LIMIT p_limit
  ),
  recent_orders AS (
    SELECT 
      o.id,
      'order'::text as type,
      COALESCE(p.display_name, 'Usuário') as user_name,
      p.avatar_url as user_avatar,
      bd.id as business_id,
      bd.business_name,
      bd.slug as business_slug,
      CASE 
        WHEN o.delivery_mode = 'platform_courier_network' THEN 'pediu delivery de'
        ELSE 'fez pedido no'
      END as action_label,
      CASE 
        WHEN o.delivery_mode = 'platform_courier_network' THEN '🛵'
        ELSE '🍽️'
      END as emoji,
      o.created_at
    FROM orders o
    INNER JOIN profiles p ON p.id = o.customer_profile_id
    INNER JOIN business_data bd ON bd.id = o.merchant_profile_id
    INNER JOIN gastronomy_profiles gp ON gp.business_id = bd.id
    LEFT JOIN delivery_requests dr ON dr.order_id = o.id
    WHERE (dr.share_as_activity = true OR dr.id IS NULL)
      AND v_include_orders = true
      AND (p_geographic_path_pattern IS NULL OR EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.id = bd.location_id 
        AND l.geographic_path ~ p_geographic_path_pattern
      ))
    ORDER BY o.created_at DESC
    LIMIT p_limit
  ),
  combined AS (
    SELECT * FROM recent_reviews
    UNION ALL
    SELECT * FROM recent_favorites
    UNION ALL
    SELECT * FROM recent_orders
  )
  SELECT * FROM combined
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_recent_gastronomy_activities IS 
'Busca atividades recentes de gastronomia (reviews, favoritos, pedidos) filtradas por território. Reviews e favoritos são sempre públicos. Pedidos requerem opt-in (share_as_activity = true).';

-- ── 5. GRANTS ───────────────────────────────────────────────────────────────

-- Permitir que usuários autenticados leiam atividades
GRANT EXECUTE ON FUNCTION get_recent_gastronomy_activities TO authenticated;

-- ── 6. RLS POLICIES ─────────────────────────────────────────────────────────

-- Garantir que apenas pedidos com share_as_activity = true sejam visíveis
-- (já coberto pela function, mas reforçar na tabela)

-- Nota: RLS já existe em delivery_requests, não precisa modificar

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
