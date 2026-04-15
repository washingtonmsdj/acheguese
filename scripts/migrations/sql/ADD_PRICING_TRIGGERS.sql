-- Adicionar triggers de validação e auditoria

-- ============================================
-- TRIGGER: Validação de conflito de regras
-- ============================================

CREATE OR REPLACE FUNCTION validate_pricing_rule_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF EXISTS (
      SELECT 1 FROM pricing_rules
      WHERE id != NEW.id
        AND mode = NEW.mode
        AND is_active = true
        AND (
          (valid_from IS NULL AND valid_until IS NULL) OR
          (NEW.valid_from IS NULL AND NEW.valid_until IS NULL) OR
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

-- ============================================
-- TRIGGER: Auditoria automática
-- ============================================

CREATE OR REPLACE FUNCTION audit_pricing_rule_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, new_values)
    VALUES ('rule_created', 'rule', NEW.id, COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'), to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values, new_values)
      VALUES (
        CASE WHEN NEW.is_active THEN 'rule_activated' ELSE 'rule_deactivated' END,
        'rule',
        NEW.id,
        COALESCE(NEW.updated_by, '00000000-0000-0000-0000-000000000000'),
        jsonb_build_object('is_active', OLD.is_active),
        jsonb_build_object('is_active', NEW.is_active)
      );
    ELSE
      INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values, new_values)
      VALUES ('rule_updated', 'rule', NEW.id, COALESCE(NEW.updated_by, '00000000-0000-0000-0000-000000000000'), to_jsonb(OLD), to_jsonb(NEW));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values)
    VALUES ('rule_deleted', 'rule', OLD.id, COALESCE(OLD.updated_by, '00000000-0000-0000-0000-000000000000'), to_jsonb(OLD));
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
-- TRIGGER: updated_at automático
-- ============================================

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

SELECT 'Triggers criados com sucesso!' AS status;
