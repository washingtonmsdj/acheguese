-- ============================================================================
-- COMMUNITY ALERTS — Fase 1: Row Level Security
-- ============================================================================

ALTER TABLE community_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_alert_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_alert_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_blocked_terms ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- community_alerts
-- ---------------------------------------------------------------------------

-- Leitura pública: apenas alertas ativos e não expirados
-- Campos sensíveis (author_user_id, trust_snapshot, removal_reason) são
-- ocultados via view pública (ver abaixo)
CREATE POLICY "alerts_select_active"
ON community_alerts FOR SELECT
TO authenticated
USING (
  status = 'ativo'
  AND expires_at > now()
);

-- INSERT: bloqueado para todos — obrigatório usar RPC create_community_alert
-- (A RPC usa SECURITY DEFINER e tem permissão própria)
CREATE POLICY "alerts_insert_blocked"
ON community_alerts FOR INSERT
TO authenticated
WITH CHECK (false);

-- UPDATE: apenas o próprio autor pode editar campos permitidos
-- Moderadores usam função separada (SECURITY DEFINER)
CREATE POLICY "alerts_update_own"
ON community_alerts FOR UPDATE
TO authenticated
USING (
  author_user_id = auth.uid()
  AND status = 'ativo'
)
WITH CHECK (
  author_user_id = auth.uid()
  AND status = 'ativo'
);

-- DELETE: bloqueado para todos — soft delete via status = 'removido'
CREATE POLICY "alerts_delete_blocked"
ON community_alerts FOR DELETE
TO authenticated
USING (false);

-- ---------------------------------------------------------------------------
-- community_alert_reports
-- ---------------------------------------------------------------------------

-- Leitura: apenas moderadores/admins (via role check)
CREATE POLICY "reports_select_moderator"
ON community_alert_reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
  )
);

-- INSERT: qualquer autenticado, exceto no próprio alerta
CREATE POLICY "reports_insert_authenticated"
ON community_alert_reports FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = auth.uid()
  AND alert_id IN (
    SELECT id FROM community_alerts
    WHERE author_user_id != auth.uid()
  )
);

-- DELETE: bloqueado
CREATE POLICY "reports_delete_blocked"
ON community_alert_reports FOR DELETE
TO authenticated
USING (false);

-- ---------------------------------------------------------------------------
-- community_alert_audit
-- ---------------------------------------------------------------------------

-- Leitura: apenas moderadores/admins
CREATE POLICY "audit_select_moderator"
ON community_alert_audit FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
  )
);

-- INSERT/UPDATE/DELETE: bloqueados — apenas funções SECURITY DEFINER escrevem
CREATE POLICY "audit_write_blocked"
ON community_alert_audit FOR INSERT
TO authenticated
WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- alert_notification_queue
-- ---------------------------------------------------------------------------

-- Sem acesso direto para clientes — apenas funções SECURITY DEFINER
CREATE POLICY "queue_blocked"
ON alert_notification_queue FOR ALL
TO authenticated
USING (false);

-- ---------------------------------------------------------------------------
-- alert_blocked_terms
-- ---------------------------------------------------------------------------

-- Leitura: apenas admins
CREATE POLICY "blocked_terms_select_admin"
ON alert_blocked_terms FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Escrita: apenas admins
CREATE POLICY "blocked_terms_write_admin"
ON alert_blocked_terms FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- ---------------------------------------------------------------------------
-- View pública: oculta campos sensíveis do feed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW community_alerts_public AS
SELECT
  id,
  author_profile_id,
  category,
  status,
  neighborhood_display,
  city,
  description,
  seen_personally,
  started_at_approx,
  is_happening_now,
  still_risky,
  expires_at,
  report_count,
  edit_count,
  created_at,
  updated_at,
  ended_at
  -- author_user_id: NUNCA exposto
  -- trust_snapshot: NUNCA exposto
  -- removal_reason: NUNCA exposto
  -- under_review: NUNCA exposto
FROM community_alerts
WHERE status = 'ativo'
  AND expires_at > now();
