-- ============================================
-- COPIE E EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- Link: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
-- ============================================

-- CRIAR TABELAS DE PRICING
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('ride', 'delivery', 'mototaxi', 'motoboy', 'custom')),
  name TEXT NOT NULL,
  base_fare DECIMAL(10,2) NOT NULL CHECK (base_fare >= 0),
  price_per_km DECIMAL(10,2) NOT NULL CHECK (price_per_km >= 0),
  price_per_minute DECIMAL(10,2) NOT NULL CHECK (price_per_minute >= 0),
  minimum_fare DECIMAL(10,2) NOT NULL CHECK (minimum_fare >= 0),
  maximum_fare DECIMAL(10,2) CHECK (maximum_fare IS NULL OR maximum_fare >= minimum_fare),
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ CHECK (valid_until IS NULL OR valid_until > valid_from),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pricing_peak_hour_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('morning', 'afternoon', 'evening', 'night', 'weekend', 'custom')),
  multiplier DECIMAL(5,2) NOT NULL CHECK (multiplier >= 1.0 AND multiplier <= 5.0),
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour INTEGER CHECK (end_hour >= 0 AND end_hour <= 24),
  days_of_week INTEGER[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_additional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('fixed', 'percentage')),
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('rule_created', 'rule_updated', 'rule_activated', 'rule_deactivated', 'rule_deleted', 'fee_added', 'fee_updated', 'fee_removed', 'multiplier_added', 'multiplier_updated', 'multiplier_removed')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('rule', 'fee', 'multiplier')),
  entity_id UUID NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRIAR INDEXES
CREATE INDEX IF NOT EXISTS idx_pricing_rules_mode ON pricing_rules(mode);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_peak_hour_multipliers_rule_id ON pricing_peak_hour_multipliers(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_additional_fees_rule_id ON pricing_additional_fees(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_entity ON pricing_audit_log(entity_type, entity_id);

-- HABILITAR RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_audit_log ENABLE ROW LEVEL SECURITY;

-- CRIAR POLICIES
CREATE POLICY "Public can view active pricing rules" 
  ON pricing_rules FOR SELECT TO authenticated, anon
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Public can view active peak hour multipliers" 
  ON pricing_peak_hour_multipliers FOR SELECT TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Public can view active additional fees" 
  ON pricing_additional_fees FOR SELECT TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "System can insert audit logs" 
  ON pricing_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- SEED: INSERIR REGRAS PADRÃO
INSERT INTO pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
VALUES 
  ('ride', 'Corrida Padrão', 5.00, 2.50, 0.50, 8.00, true, '{"description": "Regra padrão para corridas de passageiro"}'::jsonb),
  ('delivery', 'Entrega Padrão', 4.00, 2.00, 0.30, 7.00, true, '{"description": "Regra padrão para entregas"}'::jsonb),
  ('mototaxi', 'Mototáxi Padrão', 4.00, 2.00, 0.40, 6.00, true, '{"description": "Regra padrão para mototáxi"}'::jsonb),
  ('motoboy', 'Motoboy Padrão', 3.50, 1.80, 0.30, 6.00, true, '{"description": "Regra padrão para motoboy"}'::jsonb)
ON CONFLICT DO NOTHING;

-- SEED: INSERIR MULTIPLICADORES DE PICO PARA RIDE
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'morning', 1.30, 7, 9, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão';

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'afternoon', 1.50, 17, 19, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão';

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'night', 1.20, 22, 24, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão';

-- SEED: INSERIR MULTIPLICADORES DE PICO PARA MOTOTAXI
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'morning', 1.20, 7, 9, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão';

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'afternoon', 1.30, 17, 19, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão';

-- VERIFICAR CRIAÇÃO
SELECT 'Tabelas criadas com sucesso!' AS status;

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'pricing%'
ORDER BY table_name;

SELECT mode, name, is_active, base_fare, minimum_fare FROM pricing_rules ORDER BY mode;

SELECT COUNT(*) as total_multipliers FROM pricing_peak_hour_multipliers;
