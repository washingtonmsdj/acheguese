-- ============================================================================
-- MIGRATION: Optimize economic circulation query paths
-- Date: 2026-05-16
--
-- Goal:
-- - Improve latency for feed/opportunities/search without changing behavior
-- - Keep architecture stable (no new entities/modules)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- --------------------------------------------------------------------------
-- work_opportunities: public listing + filters + author history
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_work_opportunities_public_timeline
  ON public.work_opportunities(status, visibility, published_at DESC, created_at DESC)
  WHERE status = 'active'
    AND visibility = 'public_listed';

CREATE INDEX IF NOT EXISTS idx_work_opportunities_author_recent
  ON public.work_opportunities(author_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_public_filter_combo
  ON public.work_opportunities(territory_location_id, professional_category, opportunity_type, urgency, created_at DESC)
  WHERE status = 'active'
    AND visibility = 'public_listed';

CREATE INDEX IF NOT EXISTS idx_work_opportunities_headline_trgm
  ON public.work_opportunities USING gin (headline gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_description_trgm
  ON public.work_opportunities USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_category_trgm
  ON public.work_opportunities USING gin (professional_category gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_availability_trgm
  ON public.work_opportunities USING gin (availability_notes gin_trgm_ops)
  WHERE availability_notes IS NOT NULL;

-- --------------------------------------------------------------------------
-- support tables used by public_work_opportunity_search
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_locations_name_trgm
  ON public.locations USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_professional_data_name_trgm
  ON public.professional_data USING gin (professional_name gin_trgm_ops)
  WHERE professional_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_data_service_category_trgm
  ON public.professional_data USING gin (service_category gin_trgm_ops)
  WHERE service_category IS NOT NULL;

-- --------------------------------------------------------------------------
-- vagas: structured jobs search + ordering
-- (column existence is guarded because some environments evolved in phases)
-- --------------------------------------------------------------------------

DO $$
DECLARE
  v_public_vaga_status text;
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'vaga_status'
        AND e.enumlabel = 'published'
    ) THEN 'published'
    ELSE 'ativa'
  END
  INTO v_public_vaga_status;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'published_at'
  ) THEN
    EXECUTE format('
      CREATE INDEX IF NOT EXISTS idx_vagas_public_timeline
      ON public.vagas(status, published_at DESC, created_at DESC)
      WHERE status = %L::public.vaga_status
    ', v_public_vaga_status);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'titulo'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vagas_titulo_trgm ON public.vagas USING gin (titulo gin_trgm_ops)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'descricao'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vagas_descricao_trgm ON public.vagas USING gin (descricao gin_trgm_ops)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'categoria'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vagas_categoria_trgm ON public.vagas USING gin (categoria gin_trgm_ops)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'bairro_nome'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vagas_bairro_nome_trgm ON public.vagas USING gin (bairro_nome gin_trgm_ops)';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
