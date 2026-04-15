-- Corrigir trigger de auditoria para aceitar NULL em performed_by

CREATE OR REPLACE FUNCTION audit_pricing_rule_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Usar NULL se created_by for NULL ou UUID fake
    INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, new_values)
    VALUES (
      'rule_created', 
      'rule', 
      NEW.id, 
      CASE 
        WHEN NEW.created_by = '00000000-0000-0000-0000-000000000000' THEN NULL
        ELSE NEW.created_by
      END,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values, new_values)
      VALUES (
        CASE WHEN NEW.is_active THEN 'rule_activated' ELSE 'rule_deactivated' END,
        'rule',
        NEW.id,
        CASE 
          WHEN NEW.updated_by = '00000000-0000-0000-0000-000000000000' THEN NULL
          ELSE NEW.updated_by
        END,
        jsonb_build_object('is_active', OLD.is_active),
        jsonb_build_object('is_active', NEW.is_active)
      );
    ELSE
      INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values, new_values)
      VALUES (
        'rule_updated', 
        'rule', 
        NEW.id, 
        CASE 
          WHEN NEW.updated_by = '00000000-0000-0000-0000-000000000000' THEN NULL
          ELSE NEW.updated_by
        END,
        to_jsonb(OLD), 
        to_jsonb(NEW)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO pricing_audit_log (action, entity_type, entity_id, performed_by, old_values)
    VALUES (
      'rule_deleted', 
      'rule', 
      OLD.id, 
      CASE 
        WHEN OLD.updated_by = '00000000-0000-0000-0000-000000000000' THEN NULL
        ELSE OLD.updated_by
      END,
      to_jsonb(OLD)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS pricing_rule_audit_trigger ON pricing_rules;
CREATE TRIGGER pricing_rule_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION audit_pricing_rule_changes();

SELECT 'Trigger de auditoria corrigido!' AS status;
