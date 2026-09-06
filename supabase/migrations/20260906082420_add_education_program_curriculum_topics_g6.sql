-- G6 Education: structured curriculum/topics shared by all education niches.
-- A regular school can use this for subjects; courses can use it for modules or
-- content topics. NULL means unknown/not informed, never "no curriculum".

ALTER TABLE public.education_programs
  ADD COLUMN IF NOT EXISTS curriculum_topics text[];

ALTER TABLE public.education_programs
  DROP CONSTRAINT IF EXISTS chk_education_programs_curriculum_topics;

ALTER TABLE public.education_programs
  ADD CONSTRAINT chk_education_programs_curriculum_topics
  CHECK (
    curriculum_topics IS NULL
    OR (
      cardinality(curriculum_topics) <= 50
      AND array_position(curriculum_topics, '') IS NULL
    )
  );

COMMENT ON COLUMN public.education_programs.curriculum_topics IS
  'Disciplinas, modulos ou conteudos ofertados pelo programa/turma. Maximo 50 itens; sem inferencia quando desconhecido.';
