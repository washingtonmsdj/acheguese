-- ============================================================================
-- MIGRATION: Criar tabela education_leads
-- ============================================================================
-- Tabela para leads (potenciais alunos/clientes) interessados na instituicao.
-- ============================================================================

-- Criar tipo enum para status do lead
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_lead_status') THEN
    CREATE TYPE education_lead_status AS ENUM (
      'new', 'contacted', 'visit_scheduled', 'proposal_sent', 'enrolled', 'lost'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS education_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_profile_id UUID NOT NULL REFERENCES education_profiles(id) ON DELETE CASCADE,
  
  -- Dados do responsavel/interessado
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  
  -- Dados da crianca/aluno (quando aplicavel)
  child_name VARCHAR(150),
  child_age INTEGER,
  
  -- Interesse
  interest_note TEXT,
  source_channel VARCHAR(50), -- ex: 'website', 'whatsapp', 'indicacao'
  
  -- Pipeline
  status education_lead_status NOT NULL DEFAULT 'new',
  
  -- Owner do lead (quem esta gerenciando)
  owner_user_id UUID REFERENCES auth.users(id),
  
  -- Datas importantes
  first_contact_at TIMESTAMPTZ,
  lost_reason TEXT, -- Motivo da perda (quando status = 'lost')
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE education_leads IS 'Leads (potenciais matriculas) das instituicoes';
COMMENT ON COLUMN education_leads.source_channel IS 'Canal de origem (website, whatsapp, indicacao, etc)';
COMMENT ON COLUMN education_leads.child_name IS 'Nome da crianca/aluno (quando aplicavel)';
COMMENT ON COLUMN education_leads.child_age IS 'Idade da crianca/aluno (quando aplicavel)';

-- Indices de performance
CREATE INDEX idx_education_leads_profile 
  ON education_leads(education_profile_id);

CREATE INDEX idx_education_leads_status_created 
  ON education_leads(education_profile_id, status, created_at DESC);

CREATE INDEX idx_education_leads_owner 
  ON education_leads(owner_user_id) 
  WHERE owner_user_id IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_education_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_education_leads_updated_at ON education_leads;
CREATE TRIGGER trg_education_leads_updated_at
  BEFORE UPDATE ON education_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_education_leads_updated_at();

-- RLS
ALTER TABLE education_leads ENABLE ROW LEVEL SECURITY;

-- Politica: apenas owner/manager da instituicao pode acessar leads
CREATE POLICY education_leads_owner_all
  ON education_leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM education_profiles ep
      JOIN business_data bd ON bd.id = ep.business_id
      WHERE ep.id = education_leads.education_profile_id
        AND bd.profile_id = auth.uid()
    )
  );
