-- Migration: Create Safety Tables
-- Description: Criar tabelas para safety_incidents, safety_evidence, safety_audit_log
-- Integra com core/safety como SSOT

-- ============================================
-- EXTEND EMERGENCY_ALERTS
-- ============================================

-- Adicionar campos faltantes à tabela existente
ALTER TABLE emergency_alerts
ADD COLUMN IF NOT EXISTS alert_type TEXT NOT NULL DEFAULT 'sos',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Renomear campos legados
ALTER TABLE emergency_alerts
DROP COLUMN IF EXISTS type,
DROP COLUMN IF EXISTS message;

-- Constraints
ALTER TABLE emergency_alerts
ADD CONSTRAINT emergency_alerts_alert_type_check 
  CHECK (alert_type IN ('sos', 'emergency_button', 'automatic', 'manual', 'panic'));

ALTER TABLE emergency_alerts
ADD CONSTRAINT emergency_alerts_status_check 
  CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_profile_id ON emergency_alerts(profile_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_ride_id ON emergency_alerts(ride_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_emergency_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_alerts_updated_at_trigger ON emergency_alerts;
CREATE TRIGGER emergency_alerts_updated_at_trigger
  BEFORE UPDATE ON emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_alerts_updated_at();

-- ============================================
-- RIDE_SHARES
-- ============================================

CREATE TABLE IF NOT EXISTS ride_shares (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id       UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  share_token   TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'active',
  created_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  
  CONSTRAINT ride_shares_status_check 
    CHECK (status IN ('active', 'expired', 'revoked'))
);

ALTER TABLE ride_shares ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ride_shares_ride_id ON ride_shares(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_shares_share_token ON ride_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_ride_shares_status ON ride_shares(status);
CREATE INDEX IF NOT EXISTS idx_ride_shares_expires_at ON ride_shares(expires_at);

-- RLS Policies
CREATE POLICY "Users can create ride shares for their rides" 
  ON ride_shares FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM ride_requests 
      WHERE id = ride_id AND passenger_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their ride shares" 
  ON ride_shares FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM ride_requests 
      WHERE id = ride_id AND (
        passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can update their ride shares" 
  ON ride_shares FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Public can view active shares by token" 
  ON ride_shares FOR SELECT TO anon
  USING (status = 'active' AND expires_at > NOW());

-- ============================================
-- SAFETY_INCIDENTS
-- ============================================

CREATE TABLE IF NOT EXISTS safety_incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id       UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  reported_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'reported',
  description   TEXT NOT NULL,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  
  CONSTRAINT safety_incidents_incident_type_check 
    CHECK (incident_type IN ('harassment', 'unsafe_driving', 'route_deviation', 'vehicle_issue', 'accident', 'other')),
  
  CONSTRAINT safety_incidents_severity_check 
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  CONSTRAINT safety_incidents_status_check 
    CHECK (status IN ('reported', 'investigating', 'resolved', 'dismissed'))
);

ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_incidents_ride_id ON safety_incidents(ride_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_reported_by ON safety_incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_severity ON safety_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_created_at ON safety_incidents(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_safety_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS safety_incidents_updated_at_trigger ON safety_incidents;
CREATE TRIGGER safety_incidents_updated_at_trigger
  BEFORE UPDATE ON safety_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_safety_incidents_updated_at();

-- RLS Policies
CREATE POLICY "Users can create safety incidents" 
  ON safety_incidents FOR INSERT TO authenticated
  WITH CHECK (reported_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their safety incidents" 
  ON safety_incidents FOR SELECT TO authenticated
  USING (
    reported_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM ride_requests 
      WHERE id = ride_id AND (
        passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Admins can view all safety incidents" 
  ON safety_incidents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

CREATE POLICY "Admins can update safety incidents" 
  ON safety_incidents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================
-- SAFETY_EVIDENCE
-- ============================================

CREATE TABLE IF NOT EXISTS safety_evidence (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   UUID NOT NULL REFERENCES safety_incidents(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_size     BIGINT NOT NULL,
  mime_type     TEXT NOT NULL,
  uploaded_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT safety_evidence_evidence_type_check 
    CHECK (evidence_type IN ('photo', 'video', 'audio', 'screenshot', 'document')),
  
  CONSTRAINT safety_evidence_file_size_check 
    CHECK (file_size > 0 AND file_size <= 52428800) -- 50MB max
);

ALTER TABLE safety_evidence ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_evidence_incident_id ON safety_evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_safety_evidence_uploaded_by ON safety_evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_safety_evidence_created_at ON safety_evidence(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can upload evidence to their incidents" 
  ON safety_evidence FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM safety_incidents 
      WHERE id = incident_id AND reported_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can view evidence from their incidents" 
  ON safety_evidence FOR SELECT TO authenticated
  USING (
    uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM safety_incidents 
      WHERE id = incident_id AND (
        reported_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        ride_id IN (
          SELECT id FROM ride_requests 
          WHERE passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
                driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Admins can view all safety evidence" 
  ON safety_evidence FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================
-- SAFETY_AUDIT_LOG
-- ============================================

CREATE TABLE IF NOT EXISTS safety_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  performed_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metadata      JSONB DEFAULT '{}'::jsonb,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT safety_audit_log_action_check 
    CHECK (action IN ('alert_created', 'alert_acknowledged', 'alert_resolved', 'incident_reported', 'evidence_uploaded', 'share_created', 'share_revoked')),
  
  CONSTRAINT safety_audit_log_entity_type_check 
    CHECK (entity_type IN ('alert', 'incident', 'evidence', 'share'))
);

ALTER TABLE safety_audit_log ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_audit_log_entity ON safety_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_log_performed_by ON safety_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_safety_audit_log_action ON safety_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_safety_audit_log_created_at ON safety_audit_log(created_at DESC);

-- RLS Policies
CREATE POLICY "System can insert audit logs" 
  ON safety_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their audit logs" 
  ON safety_audit_log FOR SELECT TO authenticated
  USING (performed_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all audit logs" 
  ON safety_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE emergency_alerts IS 'Alertas de emergência (SOS, pânico, etc.)';
COMMENT ON TABLE ride_shares IS 'Compartilhamento de viagens para contatos de emergência';
COMMENT ON TABLE safety_incidents IS 'Incidentes de segurança reportados';
COMMENT ON TABLE safety_evidence IS 'Evidências anexadas a incidentes';
COMMENT ON TABLE safety_audit_log IS 'Log de auditoria de ações de segurança';
