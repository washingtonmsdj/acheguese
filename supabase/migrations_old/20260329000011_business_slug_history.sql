-- =============================================================================
-- Migration: Business Slug History
-- Data: 2026-03-29
--
-- DECISAO ARQUITETURAL:
--   Tabela business_slug_history registra cada URL canonica anterior de empresa.
--   Trigger automatico em business_data: ao mudar slug ou location_id,
--   registra a URL canonica antiga completa.
--   Resolucao: BusinessUrlService.resolveBySlugHistory() consulta esta tabela
--   e redireciona para a URL canonica atual (redirect 308).
--
-- SINTAXE:
--   Funcao PL/pgSQL sem DECLARE aninhado em IF.
--   Todas as variaveis declaradas no bloco DECLARE principal.
--   Compativel com PostgreSQL 12+.
-- =============================================================================

-- ── Tabela ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_slug_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK para business_data.id (PK real da tabela)
  business_id       UUID        NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  -- profile_id mantido para lookup direto sem join adicional
  profile_id        UUID        NOT NULL,
  old_canonical_url TEXT        NOT NULL,
  old_slug          TEXT        NOT NULL,
  change_reason     TEXT        CHECK (change_reason IN ('slug_changed', 'territory_changed', 'both')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug
  ON business_slug_history(old_slug);

CREATE INDEX IF NOT EXISTS idx_slug_history_old_canonical
  ON business_slug_history(old_canonical_url);

-- Índice em profile_id para lookup direto em resolveBySlugHistory
CREATE INDEX IF NOT EXISTS idx_slug_history_profile_id
  ON business_slug_history(profile_id);

COMMENT ON TABLE business_slug_history IS
  'Historico de URLs canonicas antigas de empresas. '
  'Usado para redirect 308 quando slug ou territorio muda. '
  'Nunca renderiza conteudo — apenas redireciona para a URL canonica atual.';

-- ── Funcao do trigger ─────────────────────────────────────────────────────────
-- Todas as variaveis no DECLARE principal — sem DECLARE aninhado.
-- Usa SPLIT_PART para extrair segmentos do geographic_path sem array temporario.

CREATE OR REPLACE FUNCTION fn_record_business_slug_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_geo_path  TEXT;
  v_uf            TEXT;
  v_cidade        TEXT;
  v_old_canonical TEXT;
  v_change_reason TEXT;
BEGIN
  -- Sai imediatamente se nada relevante mudou
  IF OLD.slug IS NOT DISTINCT FROM NEW.slug
     AND OLD.location_id IS NOT DISTINCT FROM NEW.location_id
  THEN
    RETURN NEW;
  END IF;

  -- Nao registra se nao havia slug antes (empresa nova sem slug)
  IF OLD.slug IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar geographic_path da location ANTIGA
  -- geographic_path formato: /br/ba/salvador[/district]
  SELECT geographic_path
    INTO v_old_geo_path
    FROM locations
   WHERE id = OLD.location_id;

  IF v_old_geo_path IS NOT NULL THEN
    -- SPLIT_PART(string, delimiter, field) — campo 1-indexed
    -- '/br/ba/salvador' → split_part com '/' → pos 2=br, 3=ba, 4=salvador
    -- Trim do leading '/' antes de split para garantir indices corretos
    v_uf     := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 2);
    v_cidade := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 3);

    IF v_uf <> '' AND v_cidade <> '' THEN
      v_old_canonical := '/empresas/' || v_uf || '/' || v_cidade || '/' || OLD.slug;
    ELSE
      v_old_canonical := '/empresas/ba/salvador/' || OLD.slug;
    END IF;
  ELSE
    v_old_canonical := '/empresas/ba/salvador/' || OLD.slug;
  END IF;

  -- Determinar motivo da mudanca
  IF OLD.slug IS DISTINCT FROM NEW.slug AND OLD.location_id IS DISTINCT FROM NEW.location_id THEN
    v_change_reason := 'both';
  ELSIF OLD.slug IS DISTINCT FROM NEW.slug THEN
    v_change_reason := 'slug_changed';
  ELSE
    v_change_reason := 'territory_changed';
  END IF;

  -- Inserir no historico
  -- ON CONFLICT DO NOTHING: se a mesma URL antiga ja foi registrada, ignora
  INSERT INTO business_slug_history (business_id, profile_id, old_canonical_url, old_slug, change_reason)
  VALUES (OLD.id, OLD.profile_id, v_old_canonical, OLD.slug, v_change_reason)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── Trigger ───────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_business_slug_history ON business_data;

CREATE TRIGGER trg_business_slug_history
  BEFORE UPDATE OF slug, location_id
  ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_business_slug_history();
