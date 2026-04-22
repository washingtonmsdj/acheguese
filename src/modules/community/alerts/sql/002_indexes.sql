-- ============================================================================
-- COMMUNITY ALERTS — Fase 1: Índices
-- ============================================================================

-- Feed principal: alertas ativos por região, ordenados por expiração
CREATE INDEX IF NOT EXISTS idx_ca_feed
ON community_alerts (city, neighborhood, status, expires_at DESC)
WHERE status = 'ativo';

-- Rate limit: todas as criações por autor nas últimas 24h (sem filtro de status)
CREATE INDEX IF NOT EXISTS idx_ca_rate_limit
ON community_alerts (author_user_id, created_at DESC);

-- Deduplicação: mesma categoria + bairro + cidade em janela de 30min
CREATE INDEX IF NOT EXISTS idx_ca_dedup
ON community_alerts (city, neighborhood, category, created_at DESC)
WHERE status = 'ativo';

-- Job de expiração: alertas ativos que já passaram do prazo
CREATE INDEX IF NOT EXISTS idx_ca_expiry
ON community_alerts (expires_at)
WHERE status = 'ativo';

-- Reports por alerta (moderação)
CREATE INDEX IF NOT EXISTS idx_car_alert
ON community_alert_reports (alert_id, created_at DESC);

-- Audit por alerta
CREATE INDEX IF NOT EXISTS idx_caa_alert
ON community_alert_audit (alert_id, created_at DESC);

-- Fila de notificações: registros pendentes de processamento
CREATE INDEX IF NOT EXISTS idx_anq_pending
ON alert_notification_queue (created_at ASC)
WHERE processed = false;
