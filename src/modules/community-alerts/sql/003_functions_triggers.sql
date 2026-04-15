-- ============================================================================
-- COMMUNITY ALERTS — Fase 1: Funções e Triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Função de normalização de texto de localização
-- Usada pela RPC antes de INSERT e comparações de deduplicação
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_location_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    regexp_replace(
      trim(
        lower(
          translate(
            input,
            'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
            'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
          )
        )
      ),
      '\s+', ' ', 'g'
    )
$$;

-- ---------------------------------------------------------------------------
-- Trigger: atualiza report_count e under_review
-- under_review é sticky — só sobe, nunca desce automaticamente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_alert_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_alerts
    SET
      report_count = report_count + 1,
      under_review = CASE
        WHEN report_count + 1 >= 3 THEN true
        ELSE under_review
      END,
      updated_at = now()
    WHERE id = NEW.alert_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementa o contador mas NÃO limpa under_review
    UPDATE community_alerts
    SET
      report_count = GREATEST(report_count - 1, 0),
      updated_at = now()
    WHERE id = OLD.alert_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alert_report_count ON community_alert_reports;
CREATE TRIGGER trg_alert_report_count
AFTER INSERT OR DELETE ON community_alert_reports
FOR EACH ROW EXECUTE FUNCTION fn_update_alert_report_count();

-- ---------------------------------------------------------------------------
-- Trigger: atualiza updated_at automaticamente em community_alerts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ca_updated_at ON community_alerts;
CREATE TRIGGER trg_ca_updated_at
BEFORE UPDATE ON community_alerts
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- Job de expiração: atualiza status para 'expirado'
-- Executar via pg_cron: SELECT cron.schedule('expire-alerts', '* * * * *', $$...$$)
-- Ou chamar manualmente / via Edge Function periódica
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_expire_community_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE community_alerts
    SET
      status = 'expirado',
      ended_at = now(),
      updated_at = now()
    WHERE status = 'ativo'
      AND expires_at < now()
    RETURNING id, author_user_id
  )
  INSERT INTO community_alert_audit (alert_id, actor_id, action_type, metadata)
  SELECT
    id,
    author_user_id,
    'expired',
    jsonb_build_object('expired_at', now())
  FROM expired;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
