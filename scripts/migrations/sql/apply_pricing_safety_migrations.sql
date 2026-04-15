-- Script consolidado para aplicar migrations de Safety e Pricing
-- Executar via Supabase SQL Editor ou psql

-- ============================================
-- SAFETY TABLES (20260406000001)
-- ============================================

-- Extend emergency_alerts
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

ALTER TABLE emergency_alerts DROP COLUMN IF EXISTS type;
ALTER TABLE emergency_alerts DROP COLUMN IF EXISTS message;

DO $$ BEGIN
  ALTER TABLE emergency_alerts ADD CONSTRAINT emergency_alerts_alert_type_check 
    CHECK (alert_type IN ('sos', 'emergency_button', 'automatic', 'manual', 'panic'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE emergency_alerts ADD CONSTRAINT emergency_alerts_status_check 
    CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_profile_id ON emergency_alerts(profile_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_ride_id ON emergency_alerts(ride_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);

-- Create ride_shares
CREATE TABLE IF NOT EXISTS ride_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT ride_shares_status_check CHECK (status IN ('active', 'expired', 'revoked'))
);

ALTER TABLE ride_shares ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ride_shares_ride_id ON ride_shares(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_shares_share_token ON ride_shares(share_token);

-- Create safety_incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reported',
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT safety_incidents_incident_type_check CHECK (incident_type IN ('harassment', 'unsafe_driving', 'route_deviation', 'vehicle_issue', 'accident', 'other')),
  CONSTRAINT safety_incidents_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT safety_incidents_status_check CHECK (status IN ('reported', 'investigating', 'resolved', 'dismissed'))
);

ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_safety_incidents_ride_id ON safety_incidents(ride_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_reported_by ON safety_incidents(reported_by);

-- Create safety_evidence
CREATE TABLE IF NOT EXISTS safety_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES safety_incidents(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT safety_evidence_evidence_type_check CHECK (evidence_type IN ('photo', 'video', 'audio', 'screenshot', 'document')),
  CONSTRAINT safety_evidence_file_size_check CHECK (file_size > 0 AND file_size <= 52428800)
);

ALTER TABLE safety_evidence ENABLE ROW LEVEL SECURITY;

-- Create safety_audit_log
CREATE TABLE IF NOT EXISTS safety_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT safety_audit_log_action_check CHECK (action IN ('alert_created', 'alert_acknowledged', 'alert_resolved', 'incident_reported', 'evidence_uploaded', 'share_created', 'share_revoked')),
  CONSTRAINT safety_audit_log_entity_type_check CHECK (entity_type IN ('alert', 'incident', 'evidence', 'share'))
);

ALTER TABLE safety_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRICING TABLES (20260406000002)
-- ============================================

-- Create pricing_rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL,
  name TEXT NOT NULL,
  base_fare DECIMAL(10,2) NOT NULL CHECK (base_fare >= 0),
  price_per_km DECIMAL(10,2) NOT NULL CHECK (price_per_km >= 0),
  price_per_minute DECIMAL(10,2) NOT NULL CHECK (price_per_minute >= 0),
  minimum_fare DECIMAL(10,2) NOT NULL CHECK (minimum_fare >= 0),
  maximum_fare DECIMAL(10,2) CHECK (maximum_fare IS NULL OR maximum_fare >= minimum_fare),
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT pricing_rules_mode_check CHECK (mode IN ('ride', 'delivery', 'mototaxi', 'motoboy', 'custom')),
  CONSTRAINT pricing_rules_valid_period_check CHECK (valid_until IS NULL OR valid_until > valid_from)
);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pricing_rules_mode ON pricing_rules(mode);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON pricing_rules(is_active);

-- Create pricing_peak_hour_multipliers
CREATE TABLE IF NOT EXISTS pricing_peak_hour_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  multiplier DECIMAL(5,2) NOT NULL CHECK (multiplier >= 1.0 AND multiplier <= 5.0),
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour INTEGER CHECK (end_hour >= 0 AND end_hour <= 24),
  days_of_week INTEGER[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_peak_hour_multipliers_period_type_check CHECK (period_type IN ('morning', 'afternoon', 'evening', 'night', 'weekend', 'custom'))
);

ALTER TABLE pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pricing_peak_hour_multipliers_rule_id ON pricing_peak_hour_multipliers(rule_id);

-- Create pricing_additional_fees
CREATE TABLE IF NOT EXISTS pricing_additional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  fee_type TEXT NOT NULL,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_additional_fees_fee_type_check CHECK (fee_type IN ('fixed', 'percentage'))
);

ALTER TABLE pricing_additional_fees ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pricing_additional_fees_rule_id ON pricing_additional_fees(rule_id);

-- Create pricing_audit_log
CREATE TABLE IF NOT EXISTS pricing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_audit_log_action_check CHECK (action IN ('rule_created', 'rule_updated', 'rule_activated', 'rule_deactivated', 'rule_deleted', 'fee_added', 'fee_updated', 'fee_removed', 'multiplier_added', 'multiplier_updated', 'multiplier_removed')),
  CONSTRAINT pricing_audit_log_entity_type_check CHECK (entity_type IN ('rule', 'fee', 'multiplier'))
);

ALTER TABLE pricing_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_entity ON pricing_audit_log(entity_type, entity_id);

-- ============================================
-- SEED PRICING RULES
-- ============================================

INSERT INTO pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
VALUES 
  ('ride', 'Corrida Padrão', 5.00, 2.50, 0.50, 8.00, true, '{"description": "Regra padrão para corridas de passageiro"}'::jsonb),
  ('delivery', 'Entrega Padrão', 4.00, 2.00, 0.30, 7.00, true, '{"description": "Regra padrão para entregas"}'::jsonb),
  ('mototaxi', 'Mototáxi Padrão', 4.00, 2.00, 0.40, 6.00, true, '{"description": "Regra padrão para mototáxi"}'::jsonb),
  ('motoboy', 'Motoboy Padrão', 3.50, 1.80, 0.30, 6.00, true, '{"description": "Regra padrão para motoboy"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Seed multipliers for ride
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id, 'morning', 1.30, 7, 9, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id, 'afternoon', 1.50, 17, 19, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id, 'night', 1.20, 22, 24, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

-- Seed multipliers for mototaxi
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id, 'morning', 1.20, 7, 9, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id, 'afternoon', 1.30, 17, 19, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão'
ON CONFLICT DO NOTHING;

-- Confirm tables created
SELECT 'Tables created successfully' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_rules', 'pricing_peak_hour_multipliers', 'pricing_additional_fees', 'pricing_audit_log', 'safety_incidents', 'safety_evidence', 'safety_audit_log', 'ride_shares')
ORDER BY table_name;
