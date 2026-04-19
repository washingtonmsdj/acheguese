-- Migration: Create ride_reports table
-- Description: Tabela para reports de problemas em corridas/entregas
-- Author: Kiro AI
-- Date: 2026-04-19

-- Create ride_reports table
CREATE TABLE IF NOT EXISTS ride_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  reporter_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_type TEXT NOT NULL CHECK (reporter_type IN ('passenger', 'driver', 'admin')),
  report_type TEXT NOT NULL CHECK (report_type IN (
    'safety_concern',
    'driver_behavior',
    'passenger_behavior',
    'route_issue',
    'payment_issue',
    'vehicle_condition',
    'cancellation_abuse',
    'fraud_suspicion',
    'other'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[], -- URLs de fotos/vídeos como evidência
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ride_reports_ride_id ON ride_reports(ride_id);
CREATE INDEX idx_ride_reports_reporter ON ride_reports(reporter_profile_id);
CREATE INDEX idx_ride_reports_status ON ride_reports(status);
CREATE INDEX idx_ride_reports_severity ON ride_reports(severity);
CREATE INDEX idx_ride_reports_type ON ride_reports(report_type);
CREATE INDEX idx_ride_reports_reported_at ON ride_reports(reported_at DESC);

-- RLS Policies
ALTER TABLE ride_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios reports
CREATE POLICY "Users can view their own reports"
  ON ride_reports
  FOR SELECT
  USING (
    reporter_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Usuários podem criar reports
CREATE POLICY "Users can create reports"
  ON ride_reports
  FOR INSERT
  WITH CHECK (
    reporter_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins podem ver todos os reports
CREATE POLICY "Admins can view all reports"
  ON ride_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Policy: Admins podem atualizar reports
CREATE POLICY "Admins can update reports"
  ON ride_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_ride_reports_updated_at
  BEFORE UPDATE ON ride_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE ride_reports IS 'Reports de problemas em corridas/entregas';
COMMENT ON COLUMN ride_reports.reporter_type IS 'Tipo do reporter: passenger, driver, admin';
COMMENT ON COLUMN ride_reports.report_type IS 'Tipo do problema reportado';
COMMENT ON COLUMN ride_reports.severity IS 'Severidade: low, medium, high, critical';
COMMENT ON COLUMN ride_reports.status IS 'Status: pending, under_review, resolved, dismissed';
COMMENT ON COLUMN ride_reports.evidence_urls IS 'URLs de evidências (fotos/vídeos)';
