-- ============================================================================
-- Structured Territorial Content on posts (SSOT)
-- ============================================================================
-- Objetivo:
-- 1) Persistir intencao estrutural do conteudo territorial
-- 2) Separar tipo estrutural, formato de exibicao e distribuicao
-- 3) Preparar base para filtros inteligentes, semantica, moderacao e analytics

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content_intent text,
  ADD COLUMN IF NOT EXISTS display_format text,
  ADD COLUMN IF NOT EXISTS distribution_channels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_payload jsonb;

COMMENT ON COLUMN public.posts.content_intent IS
  'Intencao canonica de criacao territorial (ex: reportar_problema, vaga, evento).';

COMMENT ON COLUMN public.posts.display_format IS
  'Formato de apresentacao pretendido (ex: post_card, issue_card, event_card).';

COMMENT ON COLUMN public.posts.distribution_channels IS
  'Canais territoriais alvo (todos, para_voce, moradores, empresas, eventos, alertas, vagas, classificados).';

COMMENT ON COLUMN public.posts.content_payload IS
  'Payload estruturado versionado para schema de conteudo territorial.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_content_payload_is_object_chk'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_content_payload_is_object_chk
      CHECK (content_payload IS NULL OR jsonb_typeof(content_payload) = 'object');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_content_intent
  ON public.posts (content_intent);

CREATE INDEX IF NOT EXISTS idx_posts_distribution_channels_gin
  ON public.posts USING gin (distribution_channels);

CREATE INDEX IF NOT EXISTS idx_posts_content_payload_gin
  ON public.posts USING gin (content_payload);
