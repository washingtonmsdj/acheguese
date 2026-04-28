-- ============================================================================
-- MIGRATION: Criar tabela education_programs
-- ============================================================================
-- Tabela para programas/turmas/cursos oferecidos pela instituicao.
-- ============================================================================

CREATE TABLE IF NOT EXISTS education_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_profile_id UUID NOT NULL REFERENCES education_profiles(id) ON DELETE CASCADE,
  
  -- Dados do programa
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Metadados do programa
  age_group VARCHAR(50), -- ex: "3-5 anos", "6-10 anos", "Adulto"
  shift VARCHAR(50), -- ex: "Manha", "Tarde", "Integral", "Noturno"
  modality VARCHAR(50), -- ex: "Presencial", "Online", "Hibrido"
  
  -- Vagas e precos
  available_slots INTEGER,
  price_from DECIMAL(10, 2),
  
  -- Status e ordenacao
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE education_programs IS 'Programas, turmas e cursos oferecidos pela instituicao';
COMMENT ON COLUMN education_programs.age_group IS 'Faixa etaria (ex: 3-5 anos, Adulto)';
COMMENT ON COLUMN education_programs.shift IS 'Turno (Manha, Tarde, Integral, Noturno)';
COMMENT ON COLUMN education_programs.modality IS 'Modalidade (Presencial, Online, Hibrido)';

-- Indices
CREATE INDEX idx_education_programs_profile 
  ON education_programs(education_profile_id);

CREATE INDEX idx_education_programs_active_order 
  ON education_programs(education_profile_id, is_active, display_order);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_education_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_education_programs_updated_at ON education_programs;
CREATE TRIGGER trg_education_programs_updated_at
  BEFORE UPDATE ON education_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_education_programs_updated_at();

-- RLS
ALTER TABLE education_programs ENABLE ROW LEVEL SECURITY;

-- Politica: leitura publica para programas de perfis publicados
CREATE POLICY education_programs_select_public
  ON education_programs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM education_profiles ep
      WHERE ep.id = education_programs.education_profile_id
        AND ep.status = 'published'
    )
  );

-- Politica: owner/manager pode gerenciar
CREATE POLICY education_programs_owner_all
  ON education_programs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM education_profiles ep
      JOIN business_data bd ON bd.id = ep.business_id
      WHERE ep.id = education_programs.education_profile_id
        AND bd.profile_id = auth.uid()
    )
  );
