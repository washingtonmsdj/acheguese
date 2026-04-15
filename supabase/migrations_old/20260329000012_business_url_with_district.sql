-- =============================================================================
-- Migration: Business URL with District (Bairro Obrigatório)
-- Data: 2026-03-29
--
-- DECISÃO ARQUITETURAL FINAL:
--   Empresas pertencem obrigatoriamente a um bairro/district, não apenas à cidade.
--   Cidade funciona como agregador, bairro como contexto obrigatório.
--
-- PADRÃO OFICIAL DE URLs:
--   Hub da cidade:    /empresas/:uf/:cidade
--   Hub do bairro:    /empresas/:uf/:cidade/:bairro
--   Detalhe empresa:  /empresas/:uf/:cidade/:bairro/:slug
--   Link curto:       /p/:slug (premium)
--
-- REGRAS OBRIGATÓRIAS:
--   1. business.location_id DEVE apontar para bairro/district (não cidade)
--   2. BusinessUrlService gera canonical SEMPRE com bairro
--   3. Não usar fallback fake de cidade/bairro
--   4. Mudança de bairro registra histórico como territory_changed
--   5. Premium continua tendo link curto adicional
--
-- ESTRUTURA DE ROTA SEM AMBIGUIDADE:
--   3 segmentos = cidade
--   4 segmentos = bairro
--   5 segmentos = empresa
-- =============================================================================

-- ── Atualizar trigger de slug history ────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_record_business_slug_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_geo_path  TEXT;
  v_uf            TEXT;
  v_cidade        TEXT;
  v_bairro        TEXT;
  v_old_canonical TEXT;
  v_change_reason TEXT;
BEGIN
  -- Sai imediatamente se nada relevante mudou
  IF OLD.slug IS NOT DISTINCT FROM NEW.slug
     AND OLD.location_id IS NOT DISTINCT FROM NEW.location_id
  THEN
    RETURN NEW;
  END IF;

  -- Não registra se não havia slug antes (empresa nova sem slug)
  IF OLD.slug IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar geographic_path da location ANTIGA
  -- geographic_path formato OBRIGATÓRIO: /br/:uf/:cidade/:bairro
  SELECT geographic_path
    INTO v_old_geo_path
    FROM locations
   WHERE id = OLD.location_id;

  IF v_old_geo_path IS NOT NULL THEN
    -- SPLIT_PART(string, delimiter, field) — campo 1-indexed
    -- '/br/ba/salvador/pituba' → split_part com '/' → pos 2=br, 3=ba, 4=salvador, 5=pituba
    -- Trim do leading '/' antes de split para garantir índices corretos
    v_uf     := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 2);
    v_cidade := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 3);
    v_bairro := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 4);

    -- OBRIGATÓRIO: bairro deve existir
    IF v_uf <> '' AND v_cidade <> '' AND v_bairro <> '' THEN
      v_old_canonical := '/empresas/' || v_uf || '/' || v_cidade || '/' || v_bairro || '/' || OLD.slug;
    ELSE
      -- Empresa sem bairro é INVÁLIDA — registra erro mas não bloqueia
      RAISE WARNING 'Empresa % com geographic_path inválido (sem bairro): %', OLD.profile_id, v_old_geo_path;
      -- Não registra no histórico se não tiver bairro
      RETURN NEW;
    END IF;
  ELSE
    -- Empresa sem geographic_path é INVÁLIDA
    RAISE WARNING 'Empresa % sem geographic_path', OLD.profile_id;
    RETURN NEW;
  END IF;

  -- Determinar motivo da mudança
  IF OLD.slug IS DISTINCT FROM NEW.slug AND OLD.location_id IS DISTINCT FROM NEW.location_id THEN
    v_change_reason := 'both';
  ELSIF OLD.slug IS DISTINCT FROM NEW.slug THEN
    v_change_reason := 'slug_changed';
  ELSE
    v_change_reason := 'territory_changed';
  END IF;

  -- Inserir no histórico
  -- ON CONFLICT DO NOTHING: se a mesma URL antiga já foi registrada, ignora
  INSERT INTO business_slug_history (business_id, profile_id, old_canonical_url, old_slug, change_reason)
  VALUES (OLD.id, OLD.profile_id, v_old_canonical, OLD.slug, v_change_reason)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_business_slug_history ON business_data;

CREATE TRIGGER trg_business_slug_history
  AFTER UPDATE ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_business_slug_history();

-- ── Validação: Empresas devem ter location_id apontando para district ────────

-- Comentário atualizado na tabela
COMMENT ON COLUMN business_data.location_id IS
  'FK para locations. OBRIGATÓRIO apontar para bairro/district (type=district). '
  'Usado para gerar URL canônica: /empresas/:uf/:cidade/:bairro/:slug. '
  'Empresas sem bairro são inválidas.';

-- Query de validação (não bloqueia, apenas reporta)
DO $$
DECLARE
  v_invalid_count INTEGER;
BEGIN
  -- Contar empresas com location_id apontando para cidade (type=city) em vez de district (type=district)
  SELECT COUNT(*)
    INTO v_invalid_count
    FROM business_data bd
    JOIN locations l ON bd.location_id = l.id
   WHERE bd.status = 'active'
     AND l.type != 'district';

  IF v_invalid_count > 0 THEN
    RAISE WARNING 'ATENÇÃO: % empresas ativas com location_id apontando para cidade em vez de bairro. Execute correção manual.', v_invalid_count;
  ELSE
    RAISE NOTICE '✅ Todas as empresas ativas têm location_id apontando para bairro/district.';
  END IF;
END;
$$;

-- ── Comentários finais ────────────────────────────────────────────────────────

COMMENT ON TABLE business_slug_history IS
  'Histórico de URLs canônicas antigas de empresas. '
  'Formato obrigatório: /empresas/:uf/:cidade/:bairro/:slug. '
  'Usado para redirect 308 quando slug ou território muda. '
  'Nunca renderiza conteúdo — apenas redireciona para a URL canônica atual.';
