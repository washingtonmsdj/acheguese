-- ============================================
-- CRIAR TABELAS SAFETY E POLICIES
-- ============================================
-- Aplica migration completa + policies service_role

-- ============================================
-- 1. CRIAR FUNÇÃO EXEC_SQL
-- ============================================

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- ============================================
-- 2. CRIAR TABELA RIDE_SHARES
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

CREATE INDEX IF NOT EXISTS idx_ride_shares_ride_id ON ride_shares(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_shares_share_token ON ride_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_ride_shares_status ON ride_shares(status);
CREATE INDEX IF NOT EXISTS idx_ride_shares_expires_at ON ride_shares(expires_at);

-- ============================================
-- 3. CRIAR TABELA SAFETY_INCIDENTS
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

CREATE INDEX IF NOT EXISTS idx_safety_incidents_ride_id ON safety_incidents(ride_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_reported_by ON safety_incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_severity ON safety_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_created_at ON safety_incidents(created_at DESC);

-- ============================================
-- 4. CRIAR TABELA SAFETY_EVIDENCE
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
    CHECK (file_size > 0 AND file_size <= 52428800)
);

ALTER TABLE safety_evidence ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_safety_evidence_incident_id ON safety_evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_safety_evidence_uploaded_by ON safety_evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_safety_evidence_created_at ON safety_evidence(created_at DESC);

-- ============================================
-- 5. CRIAR TABELA SAFETY_AUDIT_LOG
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

CREATE INDEX IF NOT EXISTS idx_safety_audit_log_entity ON safety_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_log_performed_by ON safety_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_safety_audit_log_action ON safety_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_safety_audit_log_created_at ON safety_audit_log(created_at DESC);

-- ============================================
-- 6. ADICIONAR POLICIES SERVICE_ROLE
-- ============================================

-- ride_shares
DROP POLICY IF EXISTS "service_role_all_ride_shares" ON ride_shares;
CREATE POLICY "service_role_all_ride_shares"
  ON ride_shares FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- safety_incidents
DROP POLICY IF EXISTS "service_role_all_safety_incidents" ON safety_incidents;
CREATE POLICY "service_role_all_safety_incidents"
  ON safety_incidents FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- safety_evidence
DROP POLICY IF EXISTS "service_role_all_safety_evidence" ON safety_evidence;
CREATE POLICY "service_role_all_safety_evidence"
  ON safety_evidence FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- safety_audit_log
DROP POLICY IF EXISTS "service_role_all_safety_audit_log" ON safety_audit_log;
CREATE POLICY "service_role_all_safety_audit_log"
  ON safety_audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 7. VERIFICAR RESULTADO
-- ============================================

SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN ('ride_shares', 'safety_incidents', 'safety_evidence', 'safety_audit_log')
GROUP BY tablename
ORDER BY tablename;

SELECT '✅ Tabelas safety criadas e policies aplicadas!' AS status;
