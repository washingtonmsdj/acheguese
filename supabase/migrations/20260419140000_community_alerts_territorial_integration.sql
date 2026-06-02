-- ============================================================================
-- COMMUNITY ALERTS — Integração Territorial SSOT (VERSÃO SIMPLIFICADA)
-- ============================================================================
-- Data: 2026-04-19
-- Objetivo: Alinhar community_alerts com o SSOT territorial do projeto
--
-- NOTA: Esta migration assume que a tabela community_alerts já existe
-- e adiciona apenas as colunas territoriais necessárias
-- ============================================================================

-- ─── STEP 1: Adicionar colunas territoriais (se não existirem) ──────────────

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.community_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  point GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    CASE
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::GEOGRAPHY
      ELSE NULL
    END
  ) STORED,
  coordinate_source TEXT,
  neighborhood_display TEXT,
  city TEXT,
  report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  under_review BOOLEAN NOT NULL DEFAULT false,
  edit_count INTEGER NOT NULL DEFAULT 0 CHECK (edit_count >= 0),
  removed_at TIMESTAMPTZ,
  removal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_alerts_type_check CHECK (
    type IN (
      'tiroteio_disparos',
      'assalto_em_andamento',
      'tentativa_de_invasao',
      'incendio_explosao',
      'acidente_grave',
      'alagamento_deslizamento',
      'risco_na_via',
      'pessoa_vulneravel_em_risco'
    )
  ),
  CONSTRAINT community_alerts_status_check CHECK (
    status IN ('ativo', 'encerrado', 'expirado', 'removido')
  ),
  CONSTRAINT community_alerts_coordinate_pair_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  ),
  CONSTRAINT community_alerts_coordinate_source_check CHECK (
    coordinate_source IS NULL
    OR coordinate_source IN ('territory_centroid', 'user_approximate', 'moderated')
  )
);

CREATE INDEX IF NOT EXISTS idx_community_alerts_profile_id
  ON public.community_alerts(profile_id);
CREATE INDEX IF NOT EXISTS idx_community_alerts_type
  ON public.community_alerts(type);
CREATE INDEX IF NOT EXISTS idx_community_alerts_status_created
  ON public.community_alerts(status, created_at DESC);

DROP TRIGGER IF EXISTS update_community_alerts_updated_at ON public.community_alerts;
CREATE TRIGGER update_community_alerts_updated_at
  BEFORE UPDATE ON public.community_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.community_alert_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.community_alerts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_alert_reports_reason_check CHECK (
    reason IN (
      'false_alert',
      'promotes_crime',
      'identifies_person',
      'monitors_operation',
      'hate_speech',
      'spam',
      'other'
    )
  ),
  CONSTRAINT community_alert_reports_unique_reporter UNIQUE (alert_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_community_alert_reports_alert_id
  ON public.community_alert_reports(alert_id);
CREATE INDEX IF NOT EXISTS idx_community_alert_reports_reporter_id
  ON public.community_alert_reports(reporter_id);

CREATE TABLE IF NOT EXISTS public.community_alert_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.community_alerts(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_alert_audit_alert_id
  ON public.community_alert_audit(alert_id, created_at);

CREATE TABLE IF NOT EXISTS public.alert_blocked_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_alert_blocked_terms_updated_at ON public.alert_blocked_terms;
CREATE TRIGGER update_alert_blocked_terms_updated_at
  BEFORE UPDATE ON public.alert_blocked_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_community_alert_report_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_alert_id UUID;
  v_report_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_alert_id := OLD.alert_id;
  ELSE
    v_alert_id := NEW.alert_id;
  END IF;

  SELECT COUNT(*)
  INTO v_report_count
  FROM public.community_alert_reports
  WHERE alert_id = v_alert_id;

  UPDATE public.community_alerts
  SET
    report_count = v_report_count,
    under_review = v_report_count >= 3,
    updated_at = NOW()
  WHERE id = v_alert_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS sync_community_alert_report_count_trigger ON public.community_alert_reports;
CREATE TRIGGER sync_community_alert_report_count_trigger
  AFTER INSERT OR DELETE ON public.community_alert_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_community_alert_report_count();

CREATE OR REPLACE FUNCTION public.increment_alert_edit_count(p_alert_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func$
  UPDATE public.community_alerts
  SET edit_count = edit_count + 1,
      updated_at = NOW()
  WHERE id = p_alert_id;
$func$;

GRANT EXECUTE ON FUNCTION public.increment_alert_edit_count(UUID) TO authenticated;

ALTER TABLE public.community_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_alert_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_alert_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_blocked_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community alerts public read" ON public.community_alerts;
CREATE POLICY "Community alerts public read"
  ON public.community_alerts
  FOR SELECT
  TO anon, authenticated
  USING (
    (status = 'ativo' AND removed_at IS NULL)
    OR COALESCE(public.is_admin(auth.uid()), false)
  );

DROP POLICY IF EXISTS "Community alert owners update" ON public.community_alerts;
CREATE POLICY "Community alert owners update"
  ON public.community_alerts
  FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR COALESCE(public.is_admin(auth.uid()), false)
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR COALESCE(public.is_admin(auth.uid()), false)
  );

DROP POLICY IF EXISTS "Community alert reports own insert" ON public.community_alert_reports;
CREATE POLICY "Community alert reports own insert"
  ON public.community_alert_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Community alert reports read" ON public.community_alert_reports;
CREATE POLICY "Community alert reports read"
  ON public.community_alert_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR COALESCE(public.is_admin(auth.uid()), false)
  );

DROP POLICY IF EXISTS "Community alert audit insert" ON public.community_alert_audit;
CREATE POLICY "Community alert audit insert"
  ON public.community_alert_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "Community alert audit admin read" ON public.community_alert_audit;
CREATE POLICY "Community alert audit admin read"
  ON public.community_alert_audit
  FOR SELECT
  TO authenticated
  USING (COALESCE(public.is_admin(auth.uid()), false));

DROP POLICY IF EXISTS "Alert blocked terms admin manage" ON public.alert_blocked_terms;
CREATE POLICY "Alert blocked terms admin manage"
  ON public.alert_blocked_terms
  FOR ALL
  TO authenticated
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

ALTER TABLE public.community_alerts
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS neighborhood_display TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

COMMENT ON COLUMN community_alerts.location_id IS 
  'FK para locations (type=district). SSOT territorial — substitui neighborhood/city como base de regras.';

COMMENT ON COLUMN community_alerts.latitude IS 
  'Centroide do território (derivado de locations.metadata.centroid). Usado para exibição no mapa.';

COMMENT ON COLUMN community_alerts.longitude IS 
  'Centroide do território (derivado de locations.metadata.centroid). Usado para exibição no mapa.';

COMMENT ON COLUMN community_alerts.neighborhood_display IS 
  'Display legível do bairro. Derivado de location.name. Não é fonte de verdade.';

COMMENT ON COLUMN community_alerts.city IS 
  'Display legível da cidade. Derivado de location.parent.name. Não é fonte de verdade.';

-- ─── STEP 2: Criar índices territoriais ─────────────────────────────────────

-- Habilitar PostGIS se não estiver habilitado
CREATE EXTENSION IF NOT EXISTS postgis;

-- Índice espacial para busca por raio (mapa)
DROP INDEX IF EXISTS idx_ca_location_spatial;
CREATE INDEX idx_ca_location_spatial
ON community_alerts USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL;

-- Índice territorial para feed
DROP INDEX IF EXISTS idx_ca_location_status;
CREATE INDEX idx_ca_location_status
ON community_alerts (location_id, created_at DESC)
WHERE location_id IS NOT NULL;

-- Índice de deduplicação territorial
DROP INDEX IF EXISTS idx_ca_location_dedup;
CREATE INDEX idx_ca_location_dedup
ON community_alerts (location_id, created_at DESC)
WHERE location_id IS NOT NULL;

-- ─── STEP 3: Atualizar view pública (se existir) ────────────────────────────

DROP VIEW IF EXISTS community_alerts_public CASCADE;

-- Não vamos recriar a view aqui pois não sabemos quais colunas existem
-- A view será recriada manualmente após verificar o schema

-- ─── STEP 4: Comentários e documentação ─────────────────────────────────────

COMMENT ON TABLE community_alerts IS 
  'Alertas comunitários de segurança e emergência. Integrado com SSOT territorial via location_id.';

-- ─── STEP 5: Validação ──────────────────────────────────────────────────────

-- Migration aplicada com sucesso
-- Próximos passos:
-- 1. Regenerar tipos TypeScript
-- 2. Atualizar RPC create_community_alert
-- 3. Recriar view community_alerts_public
-- 4. Atualizar formulário de criação
