-- ============================================================================
-- MIGRATION: Criar tabela education_lead_events
-- ============================================================================
-- Tabela de auditoria para eventos do pipeline de leads.
-- Registra todas as mudancas de status e interacoes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS education_lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES education_leads(id) ON DELETE CASCADE,
  
  -- Tipo de evento
  event_type VARCHAR(50) NOT NULL, -- ex: 'status_change', 'note_added', 'contact_made'
  
  -- Payload do evento (JSONB flexivel)
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Quem executou a acao
  actor_user_id UUID REFERENCES auth.users(id),
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE education_lead_events IS 'Eventos de auditoria do pipeline de leads';
COMMENT ON COLUMN education_lead_events.event_type IS 'Tipo do evento (status_change, note_added, contact_made)';
COMMENT ON COLUMN education_lead_events.payload IS 'Dados adicionais do evento em JSONB';
COMMENT ON COLUMN education_lead_events.actor_user_id IS 'Usuario que executou a acao';

-- Indice para busca por lead
CREATE INDEX idx_education_lead_events_lead 
  ON education_lead_events(lead_id, created_at DESC);

-- RLS
ALTER TABLE education_lead_events ENABLE ROW LEVEL SECURITY;

-- Politica: owner/manager da instituicao pode acessar eventos dos seus leads
CREATE POLICY education_lead_events_owner_all
  ON education_lead_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM education_leads el
      JOIN education_profiles ep ON ep.id = el.education_profile_id
      JOIN business_data bd ON bd.id = ep.business_id
      WHERE el.id = education_lead_events.lead_id
        AND bd.profile_id = auth.uid()
    )
  );
