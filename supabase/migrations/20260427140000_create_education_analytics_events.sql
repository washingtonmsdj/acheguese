-- ============================================================================
-- MIGRATION: Criar tabela education_analytics_events
-- ============================================================================
-- Tabela para tracking de eventos de analytics do modulo Education.
-- Registra visualizacoes, cliques e conversoes para o funil de matricula.
-- ============================================================================

-- Tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS education_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores principais
  education_profile_id UUID NOT NULL REFERENCES education_profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES business_data(id) ON DELETE CASCADE,
  niche_key VARCHAR(50) NOT NULL,
  
  -- Tipo de evento
  event_type VARCHAR(50) NOT NULL,
  
  -- IDs relacionados (quando aplicavel)
  program_id UUID REFERENCES education_programs(id) ON DELETE SET NULL,
  education_event_id UUID REFERENCES education_events(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES education_leads(id) ON DELETE SET NULL,
  
  -- Contexto
  source_page VARCHAR(500),
  session_id VARCHAR(255),
  
  -- Dados extras flexiveis
  metadata JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE education_analytics_events IS 'Eventos de analytics do modulo Education (page views, clicks, conversions)';
COMMENT ON COLUMN education_analytics_events.event_type IS 'Tipo: profile_view, program_view, event_view, whatsapp_click, enrollment_cta_click, lead_submitted, event_interest';
COMMENT ON COLUMN education_analytics_events.niche_key IS 'Nicho da instituicao (regular_school, daycare, etc)';
COMMENT ON COLUMN education_analytics_events.session_id IS 'ID de sessao para tracking de usuarios unicos';
COMMENT ON COLUMN education_analytics_events.metadata IS 'Dados extras em formato JSON';

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Constraint para validar event_type
ALTER TABLE education_analytics_events
  ADD CONSTRAINT chk_education_analytics_event_type
  CHECK (event_type IN (
    'profile_view',
    'program_view', 
    'event_view',
    'whatsapp_click',
    'enrollment_cta_click',
    'lead_submitted',
    'event_interest'
  ));

-- Constraint para validar niche_key
ALTER TABLE education_analytics_events
  ADD CONSTRAINT chk_education_analytics_niche_key
  CHECK (niche_key IN (
    'regular_school',
    'daycare',
    'language_school',
    'prep_course',
    'technical_school',
    'tutoring_center',
    'music_school',
    'sports_school'
  ));

-- ============================================================================
-- INDICES
-- ============================================================================

-- Indice principal por profile (mais usado)
CREATE INDEX idx_education_analytics_profile
  ON education_analytics_events(education_profile_id, created_at DESC);

-- Indice por tipo de evento (para queries agregadas)
CREATE INDEX idx_education_analytics_event_type
  ON education_analytics_events(event_type, created_at DESC);

-- Indice por niche (para comparacoes entre nichos)
CREATE INDEX idx_education_analytics_niche
  ON education_analytics_events(niche_key, created_at DESC);

-- Indice composto para queries de funnel
CREATE INDEX idx_education_analytics_profile_event
  ON education_analytics_events(education_profile_id, event_type, created_at DESC);

-- Indice por program_id (quando aplicavel)
CREATE INDEX idx_education_analytics_program
  ON education_analytics_events(program_id, created_at DESC)
  WHERE program_id IS NOT NULL;

-- Indice por education_event_id (quando aplicavel)
CREATE INDEX idx_education_analytics_event_ref
  ON education_analytics_events(education_event_id, created_at DESC)
  WHERE education_event_id IS NOT NULL;

-- Indice por lead_id (quando aplicavel)
CREATE INDEX idx_education_analytics_lead
  ON education_analytics_events(lead_id, created_at DESC)
  WHERE lead_id IS NOT NULL;

-- Indice por session_id (para contagem de usuarios unicos)
CREATE INDEX idx_education_analytics_session
  ON education_analytics_events(session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE education_analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir insercao anonima (page views de visitantes)
-- NOTA: Em producao, considerar rate limiting no application layer
CREATE POLICY "allow_anonymous_insert_analytics" ON education_analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy: Leitura apenas para owners do perfil
CREATE POLICY "allow_owner_read_analytics" ON education_analytics_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM education_profiles ep
      JOIN business_data bd ON ep.business_id = bd.id
      JOIN profiles p ON bd.profile_id = p.id
      WHERE ep.id = education_analytics_events.education_profile_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Delecao apenas para owners do perfil (para limpeza de dados de teste)
CREATE POLICY "allow_owner_delete_analytics" ON education_analytics_events
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM education_profiles ep
      JOIN business_data bd ON ep.business_id = bd.id
      JOIN profiles p ON bd.profile_id = p.id
      WHERE ep.id = education_analytics_events.education_profile_id
      AND p.user_id = auth.uid()
    )
  );
