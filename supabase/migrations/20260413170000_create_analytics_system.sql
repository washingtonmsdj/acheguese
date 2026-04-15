-- ══════════════════════════════════════════════════════════════════════════
-- FASE 8: ANALYTICS MÍNIMO
-- ══════════════════════════════════════════════════════════════════════════
-- Criado: 2026-04-13
-- Descrição: Sistema de analytics com eventos, métricas e relatórios
-- ══════════════════════════════════════════════════════════════════════════

-- ── ENUMS ─────────────────────────────────────────────────────────────────

-- Tipos de eventos rastreados
DO $$ BEGIN
  CREATE TYPE analytics_event_type AS ENUM (
  'qr_scan',              -- Scan de QR Code
  'page_view',            -- Visualização de página
  'menu_view',            -- Visualização de cardápio
  'item_view',            -- Visualização de item
  'order_started',        -- Pedido iniciado
  'order_completed',      -- Pedido concluído
  'order_cancelled',      -- Pedido cancelado
  'delivery_requested',   -- Entrega solicitada
  'delivery_completed',   -- Entrega concluída
  'click_phone',          -- Clique no telefone
  'click_whatsapp',       -- Clique no WhatsApp
  'click_directions',     -- Clique em direções
  'share',                -- Compartilhamento
  'favorite_added',       -- Adicionado aos favoritos
  'favorite_removed'      -- Removido dos favoritos
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Origem do evento
DO $$ BEGIN
  CREATE TYPE analytics_event_source AS ENUM (
  'web',
  'mobile',
  'qr_code',
  'direct_link',
  'search',
  'social_media',
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── TABELAS ───────────────────────────────────────────────────────────────

-- Eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entidade relacionada
  entity_type TEXT NOT NULL, -- 'business', 'gastronomy', 'qr_code', etc
  entity_id UUID NOT NULL,
  
  -- Tipo e origem
  event_type analytics_event_type NOT NULL,
  event_source analytics_event_source NOT NULL DEFAULT 'web',
  
  -- Usuário (opcional)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Localização
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geolocalização (opcional)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  
  -- Metadados adicionais (JSON flexível)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Métricas agregadas diárias
CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entidade
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Data
  date DATE NOT NULL,
  
  -- Métricas de visualização
  total_views INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER NOT NULL DEFAULT 0,
  
  -- Métricas de QR Code
  qr_scans INTEGER NOT NULL DEFAULT 0,
  unique_qr_scans INTEGER NOT NULL DEFAULT 0,
  
  -- Métricas de pedidos
  orders_started INTEGER NOT NULL DEFAULT 0,
  orders_completed INTEGER NOT NULL DEFAULT 0,
  orders_cancelled INTEGER NOT NULL DEFAULT 0,
  total_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Métricas de entrega
  deliveries_requested INTEGER NOT NULL DEFAULT 0,
  deliveries_completed INTEGER NOT NULL DEFAULT 0,
  total_delivery_fees DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Métricas de engajamento
  clicks_phone INTEGER NOT NULL DEFAULT 0,
  clicks_whatsapp INTEGER NOT NULL DEFAULT 0,
  clicks_directions INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  favorites_added INTEGER NOT NULL DEFAULT 0,
  favorites_removed INTEGER NOT NULL DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT analytics_daily_metrics_unique UNIQUE (entity_type, entity_id, date)
);

-- Sessões de usuário (para calcular unique views)
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  ip_address INET,
  user_agent TEXT,
  
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity_created ON analytics_events(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_metrics_entity ON analytics_daily_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_metrics_date ON analytics_daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_metrics_entity_date ON analytics_daily_metrics(entity_type, entity_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON analytics_sessions(user_id);

-- ── TRIGGERS ──────────────────────────────────────────────────────────────

-- Atualiza updated_at automaticamente
DROP TRIGGER IF EXISTS update_analytics_daily_metrics_updated_at ON analytics_daily_metrics;
CREATE TRIGGER update_analytics_daily_metrics_updated_at
  BEFORE UPDATE ON analytics_daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Atualiza last_seen_at em sessões
CREATE OR REPLACE FUNCTION update_session_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE analytics_sessions
  SET last_seen_at = NOW()
  WHERE session_id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_last_seen_trigger ON analytics_events;
CREATE TRIGGER update_session_last_seen_trigger
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION update_session_last_seen();

-- ── FUNÇÕES RPC ───────────────────────────────────────────────────────────

-- Registra um evento de analytics
CREATE OR REPLACE FUNCTION track_analytics_event(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_event_type analytics_event_type,
  p_event_source analytics_event_source DEFAULT 'web',
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Insere evento
  INSERT INTO analytics_events (
    entity_type,
    entity_id,
    event_type,
    event_source,
    user_id,
    session_id,
    ip_address,
    user_agent,
    referrer,
    latitude,
    longitude,
    metadata
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_event_source,
    p_user_id,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_latitude,
    p_longitude,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  -- Cria ou atualiza sessão
  IF p_session_id IS NOT NULL THEN
    INSERT INTO analytics_sessions (
      session_id,
      user_id,
      ip_address,
      user_agent
    ) VALUES (
      p_session_id,
      p_user_id,
      p_ip_address,
      p_user_agent
    )
    ON CONFLICT (session_id) DO UPDATE
    SET last_seen_at = NOW();
  END IF;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Agrega métricas diárias (executar via cron job)
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  -- Insere ou atualiza métricas do dia
  INSERT INTO analytics_daily_metrics (
    entity_type,
    entity_id,
    date,
    total_views,
    unique_views,
    qr_scans,
    unique_qr_scans,
    orders_started,
    orders_completed,
    orders_cancelled,
    deliveries_requested,
    deliveries_completed,
    clicks_phone,
    clicks_whatsapp,
    clicks_directions,
    shares,
    favorites_added,
    favorites_removed
  )
  SELECT
    entity_type,
    entity_id,
    p_date,
    COUNT(*) FILTER (WHERE event_type IN ('page_view', 'menu_view')) AS total_views,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type IN ('page_view', 'menu_view')) AS unique_views,
    COUNT(*) FILTER (WHERE event_type = 'qr_scan') AS qr_scans,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'qr_scan') AS unique_qr_scans,
    COUNT(*) FILTER (WHERE event_type = 'order_started') AS orders_started,
    COUNT(*) FILTER (WHERE event_type = 'order_completed') AS orders_completed,
    COUNT(*) FILTER (WHERE event_type = 'order_cancelled') AS orders_cancelled,
    COUNT(*) FILTER (WHERE event_type = 'delivery_requested') AS deliveries_requested,
    COUNT(*) FILTER (WHERE event_type = 'delivery_completed') AS deliveries_completed,
    COUNT(*) FILTER (WHERE event_type = 'click_phone') AS clicks_phone,
    COUNT(*) FILTER (WHERE event_type = 'click_whatsapp') AS clicks_whatsapp,
    COUNT(*) FILTER (WHERE event_type = 'click_directions') AS clicks_directions,
    COUNT(*) FILTER (WHERE event_type = 'share') AS shares,
    COUNT(*) FILTER (WHERE event_type = 'favorite_added') AS favorites_added,
    COUNT(*) FILTER (WHERE event_type = 'favorite_removed') AS favorites_removed
  FROM analytics_events
  WHERE DATE(created_at) = p_date
  GROUP BY entity_type, entity_id
  ON CONFLICT (entity_type, entity_id, date) DO UPDATE
  SET
    total_views = EXCLUDED.total_views,
    unique_views = EXCLUDED.unique_views,
    qr_scans = EXCLUDED.qr_scans,
    unique_qr_scans = EXCLUDED.unique_qr_scans,
    orders_started = EXCLUDED.orders_started,
    orders_completed = EXCLUDED.orders_completed,
    orders_cancelled = EXCLUDED.orders_cancelled,
    deliveries_requested = EXCLUDED.deliveries_requested,
    deliveries_completed = EXCLUDED.deliveries_completed,
    clicks_phone = EXCLUDED.clicks_phone,
    clicks_whatsapp = EXCLUDED.clicks_whatsapp,
    clicks_directions = EXCLUDED.clicks_directions,
    shares = EXCLUDED.shares,
    favorites_added = EXCLUDED.favorites_added,
    favorites_removed = EXCLUDED.favorites_removed,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Busca métricas de uma entidade
CREATE OR REPLACE FUNCTION get_analytics_metrics(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  total_views BIGINT,
  unique_views BIGINT,
  qr_scans BIGINT,
  unique_qr_scans BIGINT,
  orders_started BIGINT,
  orders_completed BIGINT,
  orders_cancelled BIGINT,
  total_order_value DECIMAL,
  deliveries_requested BIGINT,
  deliveries_completed BIGINT,
  total_delivery_fees DECIMAL,
  clicks_phone BIGINT,
  clicks_whatsapp BIGINT,
  clicks_directions BIGINT,
  shares BIGINT,
  favorites_added BIGINT,
  favorites_removed BIGINT,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(adm.total_views), 0)::BIGINT AS total_views,
    COALESCE(SUM(adm.unique_views), 0)::BIGINT AS unique_views,
    COALESCE(SUM(adm.qr_scans), 0)::BIGINT AS qr_scans,
    COALESCE(SUM(adm.unique_qr_scans), 0)::BIGINT AS unique_qr_scans,
    COALESCE(SUM(adm.orders_started), 0)::BIGINT AS orders_started,
    COALESCE(SUM(adm.orders_completed), 0)::BIGINT AS orders_completed,
    COALESCE(SUM(adm.orders_cancelled), 0)::BIGINT AS orders_cancelled,
    COALESCE(SUM(adm.total_order_value), 0)::DECIMAL(10, 2) AS total_order_value,
    COALESCE(SUM(adm.deliveries_requested), 0)::BIGINT AS deliveries_requested,
    COALESCE(SUM(adm.deliveries_completed), 0)::BIGINT AS deliveries_completed,
    COALESCE(SUM(adm.total_delivery_fees), 0)::DECIMAL(10, 2) AS total_delivery_fees,
    COALESCE(SUM(adm.clicks_phone), 0)::BIGINT AS clicks_phone,
    COALESCE(SUM(adm.clicks_whatsapp), 0)::BIGINT AS clicks_whatsapp,
    COALESCE(SUM(adm.clicks_directions), 0)::BIGINT AS clicks_directions,
    COALESCE(SUM(adm.shares), 0)::BIGINT AS shares,
    COALESCE(SUM(adm.favorites_added), 0)::BIGINT AS favorites_added,
    COALESCE(SUM(adm.favorites_removed), 0)::BIGINT AS favorites_removed,
    CASE
      WHEN SUM(adm.total_views) > 0 THEN
        (SUM(adm.orders_completed)::DECIMAL / SUM(adm.total_views)::DECIMAL * 100)
      ELSE 0
    END AS conversion_rate
  FROM analytics_daily_metrics adm
  WHERE adm.entity_type = p_entity_type
    AND adm.entity_id = p_entity_id
    AND (p_date_from IS NULL OR adm.date >= p_date_from)
    AND (p_date_to IS NULL OR adm.date <= p_date_to);
END;
$$ LANGUAGE plpgsql;

-- Busca eventos recentes
CREATE OR REPLACE FUNCTION get_recent_analytics_events(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  event_type analytics_event_type,
  event_source analytics_event_source,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.event_type,
    ae.event_source,
    ae.user_id,
    ae.session_id,
    ae.created_at
  FROM analytics_events ae
  WHERE ae.entity_type = p_entity_type
    AND ae.entity_id = p_entity_id
  ORDER BY ae.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ── RLS (Row Level Security) ──────────────────────────────────────────────

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Donos podem ver analytics de suas entidades
CREATE POLICY analytics_events_owner_select ON analytics_events
  FOR SELECT
  USING (
    entity_type = 'business' AND entity_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY analytics_daily_metrics_owner_select ON analytics_daily_metrics
  FOR SELECT
  USING (
    entity_type = 'business' AND entity_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

-- Qualquer um pode inserir eventos (tracking público)
CREATE POLICY analytics_events_public_insert ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
