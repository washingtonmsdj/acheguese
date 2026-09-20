BEGIN;

-- MVP Vagas runtime reconciliation.
-- Forward-only repair for a historical ledger/schema mismatch. Do not edit or
-- replay the historical 20260416190000 migration.

DO $preflight$
DECLARE
  status_labels text[];
  contrato_labels text[];
  modalidade_labels text[];
  nivel_labels text[];
BEGIN
  IF to_regclass('public.vagas') IS NULL THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: public.vagas is missing';
  END IF;

  IF to_regprocedure('private.is_admin_user(uuid)') IS NULL
     OR to_regprocedure('private.can_manage_profile(uuid)') IS NULL THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: canonical private authorization helpers are missing';
  END IF;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO status_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_status'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO contrato_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_contrato'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO modalidade_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_modalidade'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO nivel_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_nivel'::regtype;

  IF status_labels IS DISTINCT FROM ARRAY['ativa','pausada','encerrada','preenchida']::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: unexpected vaga_status labels: %', status_labels;
  END IF;

  IF contrato_labels IS DISTINCT FROM ARRAY['CLT','PJ','Temporário','Estágio','Freelance']::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: unexpected vaga_contrato labels: %', contrato_labels;
  END IF;

  IF modalidade_labels IS DISTINCT FROM ARRAY['Presencial','Remoto','Híbrido']::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: unexpected vaga_modalidade labels: %', modalidade_labels;
  END IF;

  IF nivel_labels IS DISTINCT FROM ARRAY['Júnior','Pleno','Sênior','Especialista']::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: unexpected vaga_nivel labels: %', nivel_labels;
  END IF;
END
$preflight$;

CREATE TEMP TABLE _mvp_known_vaga_seeds (
  id uuid PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO _mvp_known_vaga_seeds (id)
SELECT id
FROM public.vagas
WHERE
  (slug LIKE 'mock-feed-%' OR titulo LIKE '[MOCK_FEED_SEED_V1]%')
  OR (titulo, empresa) IN (
    ('Desenvolvedor Full Stack', 'Tech Solutions Ltda'),
    ('Designer UI/UX Sênior', 'Creative Studio'),
    ('Analista de Dados Júnior', 'Data Corp'),
    ('Gerente de Projetos', 'Consulting Group'),
    ('Estagiário de Marketing Digital', 'Marketing Pro'),
    ('Desenvolvedor Mobile React Native', 'App Factory'),
    ('Analista de Suporte Técnico', 'Support Solutions'),
    ('Redator Freelancer', 'Content Agency'),
    ('Coordenador de Vendas', 'Sales Corp'),
    ('Assistente Administrativo', 'Admin Services'),
    ('DevOps Engineer', 'Cloud Systems'),
    ('Product Manager', 'Product House'),
    ('Desenvolvedor Backend Júnior', 'Backend Solutions')
  );

DO $seed_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.vaga_applications a
    WHERE a.vaga_id IN (SELECT id FROM _mvp_known_vaga_seeds)
  ) OR EXISTS (
    SELECT 1
    FROM public.vaga_reports r
    WHERE r.vaga_id IN (SELECT id FROM _mvp_known_vaga_seeds)
  ) OR EXISTS (
    SELECT 1
    FROM public.vaga_saved_items s
    WHERE s.vaga_id IN (SELECT id FROM _mvp_known_vaga_seeds)
  ) THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: known seed vagas have user engagement';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.vagas v
    WHERE v.id NOT IN (SELECT id FROM _mvp_known_vaga_seeds)
      AND v.owner_profile_id IS NULL
  ) THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_BLOCKED: a non-seed vaga has no owner_profile_id';
  END IF;
END
$seed_guard$;

DELETE FROM public.vagas
WHERE id IN (SELECT id FROM _mvp_known_vaga_seeds);

-- Canonical columns already consumed by VagasService.
ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS resumo text,
  ADD COLUMN IF NOT EXISTS empresa_nome text,
  ADD COLUMN IF NOT EXISTS empresa_logo_url text,
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS subcategoria text,
  ADD COLUMN IF NOT EXISTS requisitos text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS diferenciais text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS responsabilidades text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS jornada_descricao text,
  ADD COLUMN IF NOT EXISTS application_url text,
  ADD COLUMN IF NOT EXISTS application_whatsapp text,
  ADD COLUMN IF NOT EXISTS application_email text,
  ADD COLUMN IF NOT EXISTS application_phone text,
  ADD COLUMN IF NOT EXISTS application_instructions text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0;

UPDATE public.vagas
SET
  empresa_nome = COALESCE(empresa_nome, empresa),
  empresa_logo_url = COALESCE(empresa_logo_url, empresa_logo),
  empresa_id = COALESCE(
    empresa_id,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.business_data b
        WHERE b.profile_id = vagas.owner_profile_id
      ) THEN owner_profile_id
      ELSE NULL
    END
  ),
  application_email = COALESCE(application_email, contato_email),
  application_whatsapp = COALESCE(application_whatsapp, contato_whatsapp),
  application_url = COALESCE(application_url, contato_url),
  meta_title = COALESCE(meta_title, seo_meta_title),
  meta_description = COALESCE(meta_description, seo_meta_description),
  published_at = CASE
    WHEN status::text = 'ativa' THEN COALESCE(published_at, created_at)
    ELSE published_at
  END,
  closed_at = CASE
    WHEN status::text IN ('encerrada', 'preenchida') THEN COALESCE(closed_at, updated_at)
    ELSE closed_at
  END;

UPDATE public.vagas
SET application_channel = CASE
  WHEN application_channel IS NOT NULL THEN application_channel
  WHEN NULLIF(BTRIM(application_url), '') IS NOT NULL THEN 'external_url'::public.vaga_application_channel
  WHEN NULLIF(BTRIM(application_whatsapp), '') IS NOT NULL THEN 'whatsapp'::public.vaga_application_channel
  WHEN NULLIF(BTRIM(application_email), '') IS NOT NULL THEN 'email'::public.vaga_application_channel
  ELSE 'internal'::public.vaga_application_channel
END;

UPDATE public.vagas
SET salary_mode = CASE
  WHEN salary_mode IS NOT NULL THEN salary_mode
  WHEN salario_min IS NOT NULL AND salario_max IS NOT NULL AND salario_min <> salario_max
    THEN 'range'::public.vaga_salary_mode
  WHEN salario_min IS NOT NULL OR salario_max IS NOT NULL
    THEN 'fixed'::public.vaga_salary_mode
  ELSE 'a_combinar'::public.vaga_salary_mode
END;

UPDATE public.vagas
SET highlight_type = CASE
  WHEN highlight_type IS NOT NULL AND highlight_type::text <> 'none' THEN highlight_type
  WHEN destaque THEN 'featured'::public.vaga_highlight_type
  ELSE 'none'::public.vaga_highlight_type
END;

ALTER TABLE public.vagas
  ALTER COLUMN empresa_nome SET NOT NULL,
  ALTER COLUMN owner_profile_id SET NOT NULL,
  ALTER COLUMN application_channel SET DEFAULT 'internal'::public.vaga_application_channel,
  ALTER COLUMN application_channel SET NOT NULL,
  ALTER COLUMN salary_mode SET DEFAULT 'a_combinar'::public.vaga_salary_mode,
  ALTER COLUMN salary_mode SET NOT NULL,
  ALTER COLUMN highlight_type SET DEFAULT 'none'::public.vaga_highlight_type,
  ALTER COLUMN highlight_type SET NOT NULL;

-- Remove all known policy variants before rebinding enum-backed columns.
DROP POLICY IF EXISTS "Admins can create vagas" ON public.vagas;
DROP POLICY IF EXISTS "Admins can delete vagas" ON public.vagas;
DROP POLICY IF EXISTS "Admins can update vagas" ON public.vagas;
DROP POLICY IF EXISTS "Admins can view all vagas" ON public.vagas;
DROP POLICY IF EXISTS "vagas_public_read" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_read" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_create" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_update" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_delete" ON public.vagas;

-- The notification trigger references status in its trigger column list. Its
-- function body already uses the canonical textual value "published", so only
-- the trigger binding must be recreated around the enum rebind.
DROP TRIGGER IF EXISTS trg_enqueue_vaga_match_notifications ON public.vagas;

-- Drop indexes that depend on the legacy vaga_status enum or the old search expression.
DROP INDEX IF EXISTS public.idx_vagas_destaque;
DROP INDEX IF EXISTS public.idx_vagas_location;
DROP INDEX IF EXISTS public.idx_vagas_public_timeline;
DROP INDEX IF EXISTS public.idx_vagas_status;
DROP INDEX IF EXISTS public.idx_vagas_search;

ALTER TABLE public.vagas
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN contrato DROP DEFAULT,
  ALTER COLUMN contrato_tipo DROP DEFAULT,
  ALTER COLUMN modalidade DROP DEFAULT,
  ALTER COLUMN nivel DROP DEFAULT;

ALTER TYPE public.vaga_status RENAME TO vaga_status_mvp_legacy_20260920;
CREATE TYPE public.vaga_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'paused',
  'closed',
  'expired',
  'rejected',
  'removed'
);
ALTER TABLE public.vagas
  ALTER COLUMN status TYPE public.vaga_status
  USING (
    CASE status::text
      WHEN 'ativa' THEN 'published'
      WHEN 'pausada' THEN 'paused'
      WHEN 'encerrada' THEN 'closed'
      WHEN 'preenchida' THEN 'closed'
      ELSE status::text
    END
  )::public.vaga_status;
ALTER TABLE public.vagas
  ALTER COLUMN status SET DEFAULT 'draft'::public.vaga_status;
DROP TYPE public.vaga_status_mvp_legacy_20260920;

ALTER TYPE public.vaga_contrato RENAME TO vaga_contrato_mvp_legacy_20260920;
CREATE TYPE public.vaga_contrato AS ENUM (
  'CLT',
  'PJ',
  'estagio',
  'temporario',
  'freelancer',
  'aprendiz'
);
ALTER TABLE public.vagas
  ALTER COLUMN contrato TYPE public.vaga_contrato
  USING (
    CASE contrato::text
      WHEN 'Temporário' THEN 'temporario'
      WHEN 'Estágio' THEN 'estagio'
      WHEN 'Freelance' THEN 'freelancer'
      ELSE contrato::text
    END
  )::public.vaga_contrato,
  ALTER COLUMN contrato_tipo TYPE public.vaga_contrato
  USING (
    CASE
      WHEN contrato_tipo IS NULL THEN NULL
      WHEN contrato_tipo::text = 'Temporário' THEN 'temporario'
      WHEN contrato_tipo::text = 'Estágio' THEN 'estagio'
      WHEN contrato_tipo::text = 'Freelance' THEN 'freelancer'
      ELSE contrato_tipo::text
    END
  )::public.vaga_contrato;
DROP TYPE public.vaga_contrato_mvp_legacy_20260920;

ALTER TYPE public.vaga_modalidade RENAME TO vaga_modalidade_mvp_legacy_20260920;
CREATE TYPE public.vaga_modalidade AS ENUM ('presencial', 'hibrido', 'remoto');
ALTER TABLE public.vagas
  ALTER COLUMN modalidade TYPE public.vaga_modalidade
  USING (
    CASE modalidade::text
      WHEN 'Presencial' THEN 'presencial'
      WHEN 'Híbrido' THEN 'hibrido'
      WHEN 'Remoto' THEN 'remoto'
      ELSE modalidade::text
    END
  )::public.vaga_modalidade;
DROP TYPE public.vaga_modalidade_mvp_legacy_20260920;

ALTER TYPE public.vaga_nivel RENAME TO vaga_nivel_mvp_legacy_20260920;
CREATE TYPE public.vaga_nivel AS ENUM (
  'junior',
  'pleno',
  'senior',
  'especialista',
  'gerente',
  'diretor',
  'estagio',
  'auxiliar'
);
ALTER TABLE public.vagas
  ALTER COLUMN nivel TYPE public.vaga_nivel
  USING (
    CASE nivel::text
      WHEN 'Júnior' THEN 'junior'
      WHEN 'Pleno' THEN 'pleno'
      WHEN 'Sênior' THEN 'senior'
      WHEN 'Especialista' THEN 'especialista'
      ELSE nivel::text
    END
  )::public.vaga_nivel;
DROP TYPE public.vaga_nivel_mvp_legacy_20260920;

ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'portuguese'::regconfig,
      COALESCE(titulo, '') || ' ' ||
      COALESCE(empresa_nome, empresa, '') || ' ' ||
      COALESCE(descricao, '')
    )
  ) STORED;

CREATE INDEX idx_vagas_search
  ON public.vagas USING gin (search_vector);
CREATE INDEX idx_vagas_status
  ON public.vagas(status);
CREATE INDEX idx_vagas_location
  ON public.vagas(location_id)
  WHERE status = 'published';
CREATE INDEX idx_vagas_public_timeline
  ON public.vagas(status, published_at DESC, created_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_vagas_empresa_id
  ON public.vagas(empresa_id)
  WHERE empresa_id IS NOT NULL;

ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vagas_public_read"
  ON public.vagas
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "vagas_owner_read"
  ON public.vagas
  FOR SELECT
  TO authenticated
  USING (
    private.is_admin_user(auth.uid())
    OR private.can_manage_profile(owner_profile_id)
  );

CREATE POLICY "vagas_owner_create"
  ON public.vagas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_profile_id IS NOT NULL
    AND (
      private.is_admin_user(auth.uid())
      OR (
        private.can_manage_profile(owner_profile_id)
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = owner_profile_id
            AND p.profile_type = 'business'
        )
        AND EXISTS (
          SELECT 1
          FROM public.business_data b
          WHERE b.profile_id = owner_profile_id
            AND COALESCE(b.status, 'active') = 'active'
            AND COALESCE(b.can_post_vagas, true) = true
        )
      )
    )
  );

CREATE POLICY "vagas_owner_update"
  ON public.vagas
  FOR UPDATE
  TO authenticated
  USING (
    private.is_admin_user(auth.uid())
    OR private.can_manage_profile(owner_profile_id)
  )
  WITH CHECK (
    owner_profile_id IS NOT NULL
    AND (
      private.is_admin_user(auth.uid())
      OR (
        private.can_manage_profile(owner_profile_id)
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = owner_profile_id
            AND p.profile_type = 'business'
        )
        AND EXISTS (
          SELECT 1
          FROM public.business_data b
          WHERE b.profile_id = owner_profile_id
            AND COALESCE(b.status, 'active') = 'active'
            AND COALESCE(b.can_post_vagas, true) = true
        )
      )
    )
  );

CREATE POLICY "vagas_owner_delete"
  ON public.vagas
  FOR DELETE
  TO authenticated
  USING (
    private.is_admin_user(auth.uid())
    OR (
      private.can_manage_profile(owner_profile_id)
      AND status IN ('draft', 'pending_review')
    )
  );

CREATE TRIGGER trg_enqueue_vaga_match_notifications
  BEFORE INSERT OR UPDATE OF
    status,
    categoria,
    location_id,
    owner_profile_id,
    slug,
    matching_notified_at
  ON public.vagas
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_vaga_match_notifications();

DO $postcondition$
DECLARE
  status_labels text[];
  contrato_labels text[];
  modalidade_labels text[];
  nivel_labels text[];
  public_policy text;
BEGIN
  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO status_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_status'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO contrato_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_contrato'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO modalidade_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_modalidade'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO nivel_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_nivel'::regtype;

  IF status_labels IS DISTINCT FROM ARRAY[
    'draft','pending_review','published','paused','closed','expired','rejected','removed'
  ]::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: vaga_status=%', status_labels;
  END IF;

  IF contrato_labels IS DISTINCT FROM ARRAY[
    'CLT','PJ','estagio','temporario','freelancer','aprendiz'
  ]::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: vaga_contrato=%', contrato_labels;
  END IF;

  IF modalidade_labels IS DISTINCT FROM ARRAY['presencial','hibrido','remoto']::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: vaga_modalidade=%', modalidade_labels;
  END IF;

  IF nivel_labels IS DISTINCT FROM ARRAY[
    'junior','pleno','senior','especialista','gerente','diretor','estagio','auxiliar'
  ]::text[] THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: vaga_nivel=%', nivel_labels;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.vagas
    WHERE slug LIKE 'mock-feed-%'
       OR titulo LIKE '[MOCK_FEED_SEED_V1]%'
       OR (titulo, empresa) IN (
         ('Desenvolvedor Full Stack', 'Tech Solutions Ltda'),
         ('Designer UI/UX Sênior', 'Creative Studio'),
         ('Analista de Dados Júnior', 'Data Corp'),
         ('Gerente de Projetos', 'Consulting Group'),
         ('Estagiário de Marketing Digital', 'Marketing Pro'),
         ('Desenvolvedor Mobile React Native', 'App Factory'),
         ('Analista de Suporte Técnico', 'Support Solutions'),
         ('Redator Freelancer', 'Content Agency'),
         ('Coordenador de Vendas', 'Sales Corp'),
         ('Assistente Administrativo', 'Admin Services'),
         ('DevOps Engineer', 'Cloud Systems'),
         ('Product Manager', 'Product House'),
         ('Desenvolvedor Backend Júnior', 'Backend Solutions')
       )
  ) THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: known seed data remains';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='vagas'
      AND column_name IN ('empresa_nome','application_channel','salary_mode','highlight_type')
      AND is_nullable <> 'NO'
  ) THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: canonical non-null columns are still nullable';
  END IF;

  SELECT qual
    INTO public_policy
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='vagas'
    AND policyname='vagas_public_read';

  IF public_policy IS NULL OR public_policy NOT LIKE '%published%' THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: public read policy is not canonical';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='vagas'
      AND policyname LIKE 'Admins can %vagas%'
  ) THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: legacy duplicate admin policies remain';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='vagas'
      AND column_name='search_vector'
      AND is_generated='ALWAYS'
  ) THEN
    RAISE EXCEPTION 'MVP_VAGAS_RECONCILE_FAILED: generated search_vector is missing';
  END IF;
END
$postcondition$;

COMMIT;
