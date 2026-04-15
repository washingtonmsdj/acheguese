-- Migration: Create Pricing Tables
-- Description: Persistência de regras de precificação e auditoria
-- Integra com core/pricing como SSOT

-- ============================================
-- PRICING_RULES
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode          TEXT NOT NULL,
  name          TEXT NOT NULL,
  base_fare     DECIMAL(10,2) NOT NULL CHECK (base_fare >= 0),
  price_per_km  DECIMAL(10,2) NOT NULL CHECK (price_per_km >= 0),
  price_per_minute DECIMAL(10,2) NOT NULL CHECK (price_per_minute >= 0),
  minimum_fare  DECIMAL(10,2) NOT NULL CHECK (minimum_fare >= 0),
  maximum_fare  DECIMAL(10,2) CHECK (maximum_fare IS NULL OR maximum_fare >= minimum_fare),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  valid_from    TIMESTAMPTZ,
  valid_until   TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  CONSTRAINT pricing_rules_mode_check 
    CHECK (mode IN ('ride', 'delivery', 'mototaxi', 'motoboy', 'custom')),
  
  CONSTRAINT pricing_rules_valid_period_check 
    CHECK (valid_until IS NULL OR valid_until > valid_from)
);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_mode ON pricing_rules(mode);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_valid_period ON pricing_rules(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_created_at ON pricing_rules(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pricing_rules_updated_at_trigger ON pricing_rules;
CREATE TRIGGER pricing_rules_updated_at_trigger
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_rules_updated_at();

-- RLS Policies
CREATE POLICY "Public can view active pricing rules" 
  ON pricing_rules FOR SELECT TO authenticated, anon
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage pricing rules" 
  ON pricing_rules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================
-- PRICING_PEAK_HOUR_MULTIPLIERS
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_peak_hour_multipliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id       UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  period_type   TEXT NOT NULL,
  multiplier    DECIMAL(5,2) NOT NULL CHECK (multiplier >= 1.0 AND multiplier <= 5.0),
  start_hour    INTEGER CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour      INTEGER CHECK (end_hour >= 0 AND end_hour <= 24),
  days_of_week  INTEGER[] CHECK (array_length(days_of_week, 1) IS NULL OR (
    days_of_week <@ ARRAY[0,1,2,3,4,5,6] AND 
    array_length(days_of_week, 1) > 0
  )),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pricing_peak_hour_multipliers_period_type_check 
    CHECK (period_type IN ('morning', 'afternoon', 'evening', 'night', 'weekend', 'custom')),
  
  CONSTRAINT pricing_peak_hour_multipliers_hours_check 
    CHECK (start_hour IS NULL OR end_hour IS NULL OR start_hour < end_hour)
);

ALTER TABLE pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_peak_hour_multipliers_rule_id ON pricing_peak_hour_multipliers(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_peak_hour_multipliers_is_active ON pricing_peak_hour_multipliers(is_active);

-- RLS Policies
CREATE POLICY "Public can view active peak hour multipliers" 
  ON pricing_peak_hour_multipliers FOR SELECT TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage peak hour multipliers" 
  ON pricing_peak_hour_multipliers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================
-- PRICING_ADDITIONAL_FEES
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_additional_fees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id       UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  fee_type      TEXT NOT NULL,
  reason        TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pricing_additional_fees_fee_type_check 
    CHECK (fee_type IN ('fixed', 'percentage'))
);

ALTER TABLE pricing_additional_fees ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_additional_fees_rule_id ON pricing_additional_fees(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_additional_fees_is_active ON pricing_additional_fees(is_active);

-- RLS Policies
CREATE POLICY "Public can view active additional fees" 
  ON pricing_additional_fees FOR SELECT TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage additional fees" 
  ON pricing_additional_fees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================
-- PRICING_AUDIT_LOG
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  performed_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_values    JSONB,
  new_values    JSONB,
  metadata      JSONB DEFAULT '{}'::jsonb,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pricing_audit_log_action_check 
    CHECK (action IN ('rule_created', 'rule_updated', 'rule_activated', 'rule_deactivated', 'rule_deleted', 'fee_added', 'fee_updated', 'fee_removed', 'multiplier_added', 'multiplier_updated', 'multiplier_removed')),
  
  CONSTRAINT pricing_audit_log_entity_type_check 
    CHECK (entity_type IN ('rule', 'fee', 'multiplier'))
);

ALTER TABLE pricing_audit_log ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_entity ON pricing_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_performed_by ON pricing_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_action ON pricing_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_created_at ON pricing_audit_log(created_at DESC);

-- RLS Policies
CREATE POLICY "System can insert audit logs" 
  ON pricing_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs" 
  ON pricing_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================
-- VALIDATION FUNCTIONS
-- ============================================

-- Função para validar conflito de regras ativas
CREATE OR REPLACE FUNCTION validate_pricing_rule_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe regra ativa para o mesmo modo no mesmo período
  IF NEW.is_active = true THEN
    IF EXISTS (
      SELECT 1 FROM pricing_rules
      WHERE id != NEW.id
        AND mode = NEW.mode
        AND is_active = true
        AND (
          -- Sem período definido (sempre ativa)
          (valid_from IS NULL AND valid_until IS NULL) OR
          (NEW.valid_from IS NULL AND NEW.valid_until IS NULL) OR
          -- Períodos sobrepostos
          (
            (NEW.valid_from IS NULL OR valid_until IS NULL OR NEW.valid_from < valid_until) AND
            (NEW.valid_until IS NULL OR valid_from IS NULL OR NEW.valid_until > valid_from)
          )
        )
    ) THEN
      RAISE EXCEPTION 'Conflito: já existe regra ativa para o modo % no período especificado', NEW.mode;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pricing_rule_conflict_trigger ON pricing_rules;
CREATE TRIGGER pricing_rule_conflict_trigger
  BEFORE INSERT OR UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION validate_pricing_rule_conflict();

-- Função para auditoria automática
CREATE OR REPLACE FUNCTION audit_pricing_rule_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, new_values)
    VALUES ('rule_created', 'rule', NEW.id, NEW.created_by, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values, new_values)
      VALUES (
        CASE WHEN NEW.is_active THEN 'rule_activated' ELSE 'rule_deactivated' END,
        'rule',
        NEW.id,
        NEW.updated_by,
        jsonb_build_object('is_active', OLD.is_active),
        jsonb_build_object('is_active', NEW.is_active)
      );
    ELSE
      INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values, new_values)
      VALUES ('rule_updated', 'rule', NEW.id, NEW.updated_by, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values)
    VALUES ('rule_deleted', 'rule', OLD.id, OLD.updated_by, to_jsonb(OLD));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pricing_rule_audit_trigger ON pricing_rules;
CREATE TRIGGER pricing_rule_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION audit_pricing_rule_changes();

-- ============================================
-- SEED DEFAULT RULES
-- ============================================

-- Inserir regras padrão (apenas se não existirem)
INSERT INTO pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
VALUES 
  ('ride', 'Corrida Padrão', 5.00, 2.50, 0.50, 8.00, true, '{"description": "Regra padrão para corridas de passageiro"}'::jsonb),
  ('delivery', 'Entrega Padrão', 4.00, 2.00, 0.30, 7.00, true, '{"description": "Regra padrão para entregas"}'::jsonb),
  ('mototaxi', 'Mototáxi Padrão', 4.00, 2.00, 0.40, 6.00, true, '{"description": "Regra padrão para mototáxi"}'::jsonb),
  ('motoboy', 'Motoboy Padrão', 3.50, 1.80, 0.30, 6.00, true, '{"description": "Regra padrão para motoboy"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Inserir multiplicadores de horário de pico para corrida
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id,
  'morning',
  1.30,
  7,
  9,
  ARRAY[1,2,3,4,5], -- Segunda a sexta
  true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id,
  'afternoon',
  1.50,
  17,
  19,
  ARRAY[1,2,3,4,5],
  true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id,
  'night',
  1.20,
  22,
  24,
  ARRAY[1,2,3,4,5],
  true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

-- Inserir multiplicadores para mototáxi
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id,
  'morning',
  1.20,
  7,
  9,
  ARRAY[1,2,3,4,5],
  true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT 
  id,
  'afternoon',
  1.30,
  17,
  19,
  ARRAY[1,2,3,4,5],
  true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão'
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE pricing_rules IS 'Regras de precificação por modalidade';
COMMENT ON TABLE pricing_peak_hour_multipliers IS 'Multiplicadores de horário de pico';
COMMENT ON TABLE pricing_additional_fees IS 'Taxas adicionais aplicáveis';
COMMENT ON TABLE pricing_audit_log IS 'Log de auditoria de mudanças em pricing';

COMMENT ON FUNCTION validate_pricing_rule_conflict IS 'Valida conflito entre regras ativas do mesmo modo';
COMMENT ON FUNCTION audit_pricing_rule_changes IS 'Auditoria automática de mudanças em regras';
