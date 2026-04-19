-- ============================================================================
-- MIGRATION: Driver moderation events audit trail
-- ============================================================================
-- Data: 2026-04-19
-- Descricao: trilha imutavel de moderacao de motoristas (aprovacao, rejeicao,
-- suspensao, reativacao e mudancas operacionais online/offline).
-- SSOT: tabela canonica para historico administrativo de motoristas.
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_moderation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (
    action IN (
      'approved',
      'rejected',
      'suspended',
      'reactivated',
      'set_online',
      'set_offline'
    )
  ),
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_moderation_events_driver
  ON driver_moderation_events(driver_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_moderation_events_admin
  ON driver_moderation_events(admin_profile_id, created_at DESC)
  WHERE admin_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_driver_moderation_events_action
  ON driver_moderation_events(action, created_at DESC);

ALTER TABLE driver_moderation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage driver moderation events" ON driver_moderation_events;
CREATE POLICY "Admins can manage driver moderation events"
  ON driver_moderation_events FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Drivers can view own moderation events" ON driver_moderation_events;
CREATE POLICY "Drivers can view own moderation events"
  ON driver_moderation_events FOR SELECT
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE driver_moderation_events IS
'Auditoria imutavel de moderacao operacional de motoristas.';

COMMENT ON COLUMN driver_moderation_events.action IS
'Acao de moderacao: approved, rejected, suspended, reactivated, set_online, set_offline.';

