-- ============================================================================
-- MIGRATION: Criar funcao de auditoria para education_leads
-- ============================================================================
-- Funcao trigger que registra automaticamente mudancas de status
-- na tabela education_lead_events.
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_education_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra evento quando status muda
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO education_lead_events (
      lead_id,
      event_type,
      payload,
      actor_user_id
    ) VALUES (
      NEW.id,
      'status_change',
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'changed_at', NOW()
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplica trigger na tabela education_leads
DROP TRIGGER IF EXISTS trg_audit_lead_status_change ON education_leads;
CREATE TRIGGER trg_audit_lead_status_change
  AFTER UPDATE ON education_leads
  FOR EACH ROW
  EXECUTE FUNCTION audit_education_lead_status_change();

COMMENT ON FUNCTION audit_education_lead_status_change() IS 
  'Audita automaticamente mudancas de status nos leads de educacao';
