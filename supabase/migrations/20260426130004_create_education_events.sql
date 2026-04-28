-- ============================================================================
-- MIGRATION: Criar tabela education_events
-- ============================================================================
-- Tabela para eventos (visitas, reunioes, atividades) da instituicao.
-- ============================================================================

CREATE TABLE IF NOT EXISTS education_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_profile_id UUID NOT NULL REFERENCES education_profiles(id) ON DELETE CASCADE,
  
  -- Dados do evento
  title VARCHAR(150) NOT NULL,
  description TEXT,
  
  -- Data/hora
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  
  -- Local
  location VARCHAR(255),
  
  -- Visibilidade
  is_public BOOLEAN NOT NULL DEFAULT true,
  
  -- Capacidade (quando aplicavel)
  max_attendees INTEGER,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE education_events IS 'Eventos, visitas e atividades das instituicoes';
COMMENT ON COLUMN education_events.is_public IS 'Se o evento e publico (visivel na landing)';
COMMENT ON COLUMN education_events.max_attendees IS 'Numero maximo de participantes (null = ilimitado)';

-- Indices
CREATE INDEX idx_education_events_profile 
  ON education_events(education_profile_id);

CREATE INDEX idx_education_events_starts_at 
  ON education_events(education_profile_id, starts_at);

CREATE INDEX idx_education_events_public 
  ON education_events(education_profile_id, is_public, starts_at) 
  WHERE is_public = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_education_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_education_events_updated_at ON education_events;
CREATE TRIGGER trg_education_events_updated_at
  BEFORE UPDATE ON education_events
  FOR EACH ROW
  EXECUTE FUNCTION update_education_events_updated_at();

-- RLS
ALTER TABLE education_events ENABLE ROW LEVEL SECURITY;

-- Politica: leitura publica para eventos publicos de perfis publicados
CREATE POLICY education_events_select_public
  ON education_events
  FOR SELECT
  USING (
    is_public = true AND
    EXISTS (
      SELECT 1 FROM education_profiles ep
      WHERE ep.id = education_events.education_profile_id
        AND ep.status = 'published'
    )
  );

-- Politica: owner/manager pode gerenciar
CREATE POLICY education_events_owner_all
  ON education_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM education_profiles ep
      JOIN business_data bd ON bd.id = ep.business_id
      WHERE ep.id = education_events.education_profile_id
        AND bd.profile_id = auth.uid()
    )
  );
