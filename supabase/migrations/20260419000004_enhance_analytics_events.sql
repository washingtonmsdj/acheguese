-- =====================================================
-- MIGRATION: Enhance Analytics Events
-- Version: 1.0.0
-- Description: Adiciona suporte a eventos genéricos de negócio
-- Author: Kiro AI
-- Date: 2026-04-19
-- =====================================================

-- =====================================================
-- 1. ADD NEW COLUMNS TO ANALYTICS_EVENTS
-- =====================================================

-- Adicionar coluna 'event' para eventos genéricos
ALTER TABLE analytics_events 
  ADD COLUMN IF NOT EXISTS event TEXT;

-- Adicionar coluna 'properties' para propriedades flexíveis
ALTER TABLE analytics_events 
  ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT '{}'::jsonb;

-- Tornar entity_type e entity_id opcionais (para eventos genéricos)
ALTER TABLE analytics_events 
  ALTER COLUMN entity_type DROP NOT NULL,
  ALTER COLUMN entity_id DROP NOT NULL;

-- =====================================================
-- 2. CREATE INDEX FOR NEW COLUMNS
-- =====================================================

-- Index por evento
CREATE INDEX IF NOT EXISTS idx_analytics_events_event 
  ON analytics_events(event) 
  WHERE event IS NOT NULL;

-- GIN index nas propriedades
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties 
  ON analytics_events USING GIN(properties);

-- Index composto event + created_at
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_created 
  ON analytics_events(event, created_at DESC) 
  WHERE event IS NOT NULL;

-- Index por user_id + event
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event 
  ON analytics_events(user_id, event) 
  WHERE user_id IS NOT NULL AND event IS NOT NULL;

-- =====================================================
-- 3. CREATE FUNCTION TO GET EVENT STATISTICS
-- =====================================================

CREATE OR REPLACE FUNCTION get_event_statistics(
  p_event TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  event TEXT,
  count BIGINT,
  unique_users BIGINT,
  first_occurrence TIMESTAMPTZ,
  last_occurrence TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.event,
    COUNT(*)::BIGINT as count,
    COUNT(DISTINCT e.user_id)::BIGINT as unique_users,
    MIN(e.created_at) as first_occurrence,
    MAX(e.created_at) as last_occurrence
  FROM analytics_events e
  WHERE 
    e.event IS NOT NULL
    AND (p_event IS NULL OR e.event = p_event)
    AND e.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY e.event
  ORDER BY count DESC;
END;
$$;

-- =====================================================
-- 4. CREATE FUNCTION TO GET CONVERSION FUNNEL
-- =====================================================

CREATE OR REPLACE FUNCTION get_conversion_funnel(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  step TEXT,
  users BIGINT,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_signups BIGINT;
BEGIN
  -- Obter total de signups
  SELECT COUNT(DISTINCT user_id) INTO total_signups
  FROM analytics_events
  WHERE event = 'signup'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Retornar funil
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      'Signup' as step,
      1 as step_order,
      COUNT(DISTINCT user_id) as users
    FROM analytics_events
    WHERE event = 'signup'
      AND created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
      'Email Verified' as step,
      2 as step_order,
      COUNT(DISTINCT user_id) as users
    FROM analytics_events
    WHERE event = 'email_verified'
      AND created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
      'Profile Completed' as step,
      3 as step_order,
      COUNT(DISTINCT user_id) as users
    FROM analytics_events
    WHERE event = 'profile_completed'
      AND created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
      'Subscription Created' as step,
      4 as step_order,
      COUNT(DISTINCT user_id) as users
    FROM analytics_events
    WHERE event = 'subscription_created'
      AND created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    f.step,
    f.users,
    CASE 
      WHEN total_signups > 0 THEN ROUND((f.users::NUMERIC / total_signups::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM funnel_data f
  ORDER BY f.step_order;
END;
$$;

-- =====================================================
-- 5. CREATE FUNCTION TO GET USER JOURNEY
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_journey(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  event TEXT,
  properties JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.event,
    e.properties,
    e.created_at
  FROM analytics_events e
  WHERE 
    e.user_id = p_user_id
    AND e.event IS NOT NULL
  ORDER BY e.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 6. CREATE FUNCTION TO GET DAILY EVENTS
-- =====================================================

CREATE OR REPLACE FUNCTION get_daily_events(
  p_event TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  date DATE,
  event TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(e.created_at) as date,
    e.event,
    COUNT(*)::BIGINT as count
  FROM analytics_events e
  WHERE 
    e.event IS NOT NULL
    AND (p_event IS NULL OR e.event = p_event)
    AND e.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(e.created_at), e.event
  ORDER BY date DESC, count DESC;
END;
$$;

-- =====================================================
-- 7. CREATE VIEW FOR KPIs
-- =====================================================

CREATE OR REPLACE VIEW analytics_kpis AS
WITH date_range AS (
  SELECT 
    NOW() - INTERVAL '30 days' as start_date,
    NOW() as end_date
),
current_period AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END) as signups,
    COUNT(DISTINCT CASE WHEN event = 'subscription_created' THEN user_id END) as subscriptions,
    COUNT(DISTINCT CASE WHEN event = 'ride_completed' THEN user_id END) as rides_completed,
    COUNT(DISTINCT CASE WHEN event = 'business_created' THEN user_id END) as businesses_created,
    SUM(CASE WHEN event = 'payment_succeeded' THEN (properties->>'amount')::NUMERIC ELSE 0 END) as revenue
  FROM analytics_events, date_range
  WHERE created_at BETWEEN date_range.start_date AND date_range.end_date
),
previous_period AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END) as signups,
    COUNT(DISTINCT CASE WHEN event = 'subscription_created' THEN user_id END) as subscriptions,
    COUNT(DISTINCT CASE WHEN event = 'ride_completed' THEN user_id END) as rides_completed,
    COUNT(DISTINCT CASE WHEN event = 'business_created' THEN user_id END) as businesses_created,
    SUM(CASE WHEN event = 'payment_succeeded' THEN (properties->>'amount')::NUMERIC ELSE 0 END) as revenue
  FROM analytics_events, date_range
  WHERE created_at BETWEEN date_range.start_date - INTERVAL '30 days' AND date_range.start_date
)
SELECT
  'signups' as metric,
  cp.signups as current_value,
  pp.signups as previous_value,
  CASE 
    WHEN pp.signups > 0 THEN ROUND(((cp.signups - pp.signups)::NUMERIC / pp.signups::NUMERIC) * 100, 2)
    ELSE 0
  END as growth_rate
FROM current_period cp, previous_period pp

UNION ALL

SELECT
  'subscriptions' as metric,
  cp.subscriptions as current_value,
  pp.subscriptions as previous_value,
  CASE 
    WHEN pp.subscriptions > 0 THEN ROUND(((cp.subscriptions - pp.subscriptions)::NUMERIC / pp.subscriptions::NUMERIC) * 100, 2)
    ELSE 0
  END as growth_rate
FROM current_period cp, previous_period pp

UNION ALL

SELECT
  'rides_completed' as metric,
  cp.rides_completed as current_value,
  pp.rides_completed as previous_value,
  CASE 
    WHEN pp.rides_completed > 0 THEN ROUND(((cp.rides_completed - pp.rides_completed)::NUMERIC / pp.rides_completed::NUMERIC) * 100, 2)
    ELSE 0
  END as growth_rate
FROM current_period cp, previous_period pp

UNION ALL

SELECT
  'businesses_created' as metric,
  cp.businesses_created as current_value,
  pp.businesses_created as previous_value,
  CASE 
    WHEN pp.businesses_created > 0 THEN ROUND(((cp.businesses_created - pp.businesses_created)::NUMERIC / pp.businesses_created::NUMERIC) * 100, 2)
    ELSE 0
  END as growth_rate
FROM current_period cp, previous_period pp

UNION ALL

SELECT
  'revenue' as metric,
  cp.revenue as current_value,
  pp.revenue as previous_value,
  CASE 
    WHEN pp.revenue > 0 THEN ROUND(((cp.revenue - pp.revenue) / pp.revenue) * 100, 2)
    ELSE 0
  END as growth_rate
FROM current_period cp, previous_period pp;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_event_statistics(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journey(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_events(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT SELECT ON analytics_kpis TO authenticated;

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON COLUMN analytics_events.event IS 'Nome do evento genérico (signup, login, subscription_created, etc)';
COMMENT ON COLUMN analytics_events.properties IS 'Propriedades flexíveis do evento em formato JSON';

COMMENT ON FUNCTION get_event_statistics(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Retorna estatísticas de eventos por tipo';
COMMENT ON FUNCTION get_conversion_funnel(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Retorna funil de conversão (signup → subscription)';
COMMENT ON FUNCTION get_user_journey(UUID, INTEGER) IS 'Retorna jornada de eventos de um usuário';
COMMENT ON FUNCTION get_daily_events(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Retorna contagem diária de eventos';
COMMENT ON VIEW analytics_kpis IS 'KPIs principais com comparação ao período anterior';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
