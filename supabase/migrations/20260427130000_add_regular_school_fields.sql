-- ============================================================================
-- MIGRATION: Adicionar campos específicos do nicho regular_school
-- ============================================================================
-- Adiciona colunas opcionais nas tabelas education_profiles, education_programs,
-- education_leads e education_events para suportar o contexto escolar.
-- ============================================================================

-- ============================================================================
-- education_profiles: campos de escola regular
-- ============================================================================

ALTER TABLE education_profiles
  ADD COLUMN IF NOT EXISTS school_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS education_levels TEXT[],
  ADD COLUMN IF NOT EXISTS shifts TEXT[],
  ADD COLUMN IF NOT EXISTS age_range_min INTEGER,
  ADD COLUMN IF NOT EXISTS age_range_max INTEGER,
  ADD COLUMN IF NOT EXISTS enrollment_open BOOLEAN DEFAULT false;

-- Comentários
COMMENT ON COLUMN education_profiles.school_type IS 'Tipo da escola: public, private, charter, community';
COMMENT ON COLUMN education_profiles.education_levels IS 'Níveis educacionais oferecidos: early_childhood, elementary_1, elementary_2, middle_school, high_school, technical';
COMMENT ON COLUMN education_profiles.shifts IS 'Turnos oferecidos: morning, afternoon, evening, full_day';
COMMENT ON COLUMN education_profiles.age_range_min IS 'Idade mínima aceita (em anos)';
COMMENT ON COLUMN education_profiles.age_range_max IS 'Idade máxima aceita (em anos)';
COMMENT ON COLUMN education_profiles.enrollment_open IS 'Indica se as matrículas estão abertas';

-- Constraint para validar school_type
ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_school_type
  CHECK (school_type IS NULL OR school_type IN ('public', 'private', 'charter', 'community'));

-- Índice para filtrar escolas com matrículas abertas
CREATE INDEX IF NOT EXISTS idx_education_profiles_enrollment_open
  ON education_profiles(enrollment_open)
  WHERE enrollment_open = true;

-- ============================================================================
-- education_programs: campos de série/turma
-- ============================================================================

ALTER TABLE education_programs
  ADD COLUMN IF NOT EXISTS education_level VARCHAR(30),
  ADD COLUMN IF NOT EXISTS grade VARCHAR(30),
  ADD COLUMN IF NOT EXISTS class_name VARCHAR(30),
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS current_enrollment INTEGER,
  ADD COLUMN IF NOT EXISTS schedule VARCHAR(100);

-- Comentários
COMMENT ON COLUMN education_programs.education_level IS 'Nível educacional: early_childhood, elementary_1, elementary_2, middle_school, high_school, technical';
COMMENT ON COLUMN education_programs.grade IS 'Série/Ano: 1º ano, 6º ano, 3ª série, etc';
COMMENT ON COLUMN education_programs.class_name IS 'Identificador da turma: A, B, Turma 1, etc';
COMMENT ON COLUMN education_programs.max_capacity IS 'Capacidade máxima da turma';
COMMENT ON COLUMN education_programs.current_enrollment IS 'Número de matriculados atuais';
COMMENT ON COLUMN education_programs.schedule IS 'Horário: Seg-Sex 07:30-12:00';

-- Índice para buscar programas por nível educacional
CREATE INDEX IF NOT EXISTS idx_education_programs_education_level
  ON education_programs(education_profile_id, education_level)
  WHERE education_level IS NOT NULL;

-- Índice para buscar programas por série
CREATE INDEX IF NOT EXISTS idx_education_programs_grade
  ON education_programs(education_profile_id, grade)
  WHERE grade IS NOT NULL;

-- ============================================================================
-- education_leads: campos de interesse de matrícula
-- ============================================================================

ALTER TABLE education_leads
  ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS student_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS student_age INTEGER,
  ADD COLUMN IF NOT EXISTS desired_grade VARCHAR(30),
  ADD COLUMN IF NOT EXISTS desired_shift VARCHAR(20);

-- Comentários
COMMENT ON COLUMN education_leads.guardian_name IS 'Nome do responsável (quando diferente do full_name)';
COMMENT ON COLUMN education_leads.student_name IS 'Nome do aluno (quando diferente de child_name)';
COMMENT ON COLUMN education_leads.student_age IS 'Idade do aluno';
COMMENT ON COLUMN education_leads.desired_grade IS 'Série/ano desejado: 1º ano, 6º ano, etc';
COMMENT ON COLUMN education_leads.desired_shift IS 'Turno desejado: morning, afternoon, evening, full_day';

-- Índice para leads por série desejada (para analytics escolar)
CREATE INDEX IF NOT EXISTS idx_education_leads_desired_grade
  ON education_leads(education_profile_id, desired_grade)
  WHERE desired_grade IS NOT NULL;

-- Índice para leads por turno desejado (para analytics escolar)
CREATE INDEX IF NOT EXISTS idx_education_leads_desired_shift
  ON education_leads(education_profile_id, desired_shift)
  WHERE desired_shift IS NOT NULL;

-- ============================================================================
-- education_events: tipo de evento escolar
-- ============================================================================

ALTER TABLE education_events
  ADD COLUMN IF NOT EXISTS school_event_type VARCHAR(30);

-- Comentário
COMMENT ON COLUMN education_events.school_event_type IS 'Tipo de evento escolar: open_house, enrollment_fair, parent_meeting, trial_class, school_tour, cultural_event, sports_event, other';

-- Constraint para validar school_event_type
ALTER TABLE education_events
  ADD CONSTRAINT chk_education_event_type
  CHECK (school_event_type IS NULL OR school_event_type IN (
    'open_house', 'enrollment_fair', 'parent_meeting', 'trial_class',
    'school_tour', 'cultural_event', 'sports_event', 'other'
  ));

-- Índice para eventos por tipo
CREATE INDEX IF NOT EXISTS idx_education_events_school_type
  ON education_events(education_profile_id, school_event_type)
  WHERE school_event_type IS NOT NULL;
