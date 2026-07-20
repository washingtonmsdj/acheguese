-- =====================================================================
-- MIGRAÇÃO: community_post_drafts (sync de rascunhos do composer)
-- Consumida por: src/core/community/services/postDraftSync.ts
-- UI: src/core/community/components/composer/CreatePostModal.tsx
--     rota /novo-post e modal territorial de criação de post
-- Risco: BAIXO — tabela isolada, sem impacto em feeds/RLS existentes.
--        Se ausente, o composer degrada para localStorage (comportamento atual).
-- =====================================================================

-- 1. Tabela: um rascunho corrente por (user, profile)
CREATE TABLE IF NOT EXISTS public.community_post_drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL,
  payload     jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_drafts_user_profile_key UNIQUE (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS community_post_drafts_user_id_idx
  ON public.community_post_drafts (user_id);

CREATE INDEX IF NOT EXISTS community_post_drafts_updated_at_idx
  ON public.community_post_drafts (updated_at DESC);

-- 2. GRANTs (obrigatório no schema public — PostgREST não concede por default)
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.community_post_drafts TO authenticated;
GRANT ALL ON public.community_post_drafts TO service_role;
-- Sem GRANT para anon: rascunho é sempre por usuário autenticado.

-- 3. RLS: dono é o único que enxerga/edita o próprio rascunho
ALTER TABLE public.community_post_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_post_drafts_owner_select
  ON public.community_post_drafts;
CREATE POLICY community_post_drafts_owner_select
  ON public.community_post_drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS community_post_drafts_owner_insert
  ON public.community_post_drafts;
CREATE POLICY community_post_drafts_owner_insert
  ON public.community_post_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS community_post_drafts_owner_update
  ON public.community_post_drafts;
CREATE POLICY community_post_drafts_owner_update
  ON public.community_post_drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS community_post_drafts_owner_delete
  ON public.community_post_drafts;
CREATE POLICY community_post_drafts_owner_delete
  ON public.community_post_drafts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_community_post_drafts_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := COALESCE(NEW.updated_at, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_post_drafts_touch_updated_at
  ON public.community_post_drafts;
CREATE TRIGGER community_post_drafts_touch_updated_at
  BEFORE UPDATE ON public.community_post_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_community_post_drafts_touch_updated_at();
