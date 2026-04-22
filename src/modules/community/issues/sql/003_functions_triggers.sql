-- ============================================================================
-- Community Issues — Funções e Triggers
-- ============================================================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_community_issue_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_community_issues_updated_at
  BEFORE UPDATE ON community_issues
  FOR EACH ROW EXECUTE FUNCTION update_community_issue_updated_at();

-- ============================================================================
-- Incrementa support_count quando suporte é adicionado
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_issue_support_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_issues
  SET support_count = support_count + 1
  WHERE id = NEW.issue_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_issue_support_added
  AFTER INSERT ON community_issue_supports
  FOR EACH ROW EXECUTE FUNCTION increment_issue_support_count();

-- ============================================================================
-- Decrementa support_count quando suporte é removido
-- ============================================================================

CREATE OR REPLACE FUNCTION decrement_issue_support_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_issues
  SET support_count = GREATEST(support_count - 1, 0)
  WHERE id = OLD.issue_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_issue_support_removed
  AFTER DELETE ON community_issue_supports
  FOR EACH ROW EXECUTE FUNCTION decrement_issue_support_count();

-- ============================================================================
-- Incrementa report_count e aciona under_review se threshold atingido
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_issue_report()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_report_count INTEGER;
BEGIN
  UPDATE community_issues
  SET report_count = report_count + 1
  WHERE id = NEW.issue_id
  RETURNING report_count INTO v_report_count;

  -- Aciona under_review se threshold atingido (3 reports)
  IF v_report_count >= 3 THEN
    UPDATE community_issues
    SET under_review = TRUE
    WHERE id = NEW.issue_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_issue_reported
  AFTER INSERT ON community_issue_reports
  FOR EACH ROW EXECUTE FUNCTION handle_issue_report();

-- ============================================================================
-- Registra resolved_at quando status muda para resolvido
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_issue_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'resolvido' AND OLD.status != 'resolvido' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_issue_status_change
  BEFORE UPDATE OF status ON community_issues
  FOR EACH ROW EXECUTE FUNCTION handle_issue_status_change();
