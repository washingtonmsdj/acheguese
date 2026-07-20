-- =====================================================================
-- MIGRAÇÃO: community_interest_registrations
-- Consumida por: src/core/routing/components/CommunityInterestPage.tsx
-- Rota: /comunidade/:uf/:city/interesse (bairros em status coming_soon)
-- Risco: BAIXO — tabela isolada, sem foreign keys obrigatórias.
-- =====================================================================

-- 1. Enum de vínculo do interessado com o território
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_interest_role') THEN
    CREATE TYPE public.community_interest_role AS ENUM (
      'morador',
      'comerciante',
      'prestador',
      'visitante',
      'outro'
    );
  END IF;
END $$;

-- 2. Tabela
CREATE TABLE IF NOT EXISTS public.community_interest_registrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id      uuid NULL,
  community_slug    text NULL,
  territory_path    text NULL,
  full_name         text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email             text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  phone             text NULL CHECK (phone IS NULL OR char_length(phone) <= 30),
  role              public.community_interest_role NOT NULL DEFAULT 'morador',
  message           text NULL CHECK (message IS NULL OR char_length(message) <= 1000),
  wants_updates     boolean NOT NULL DEFAULT true,
  source            text NULL,
  user_agent        text NULL,
  turnstile_verified boolean NOT NULL DEFAULT false,
  user_id           uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 3. Unicidade por (comunidade, email) — permite reentrada em outros bairros
CREATE UNIQUE INDEX IF NOT EXISTS community_interest_unique_email_per_community
  ON public.community_interest_registrations (
    COALESCE(community_slug, ''),
    lower(email)
  );

CREATE INDEX IF NOT EXISTS community_interest_created_at_idx
  ON public.community_interest_registrations (created_at DESC);

CREATE INDEX IF NOT EXISTS community_interest_community_id_idx
  ON public.community_interest_registrations (community_id);

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_community_interest_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_community_interest_updated_at ON public.community_interest_registrations;
CREATE TRIGGER tg_community_interest_updated_at
  BEFORE UPDATE ON public.community_interest_registrations
  FOR EACH ROW EXECUTE FUNCTION public.tg_community_interest_touch_updated_at();

-- 5. Grants (Data API / PostgREST não concede default no schema public)
GRANT INSERT ON public.community_interest_registrations TO anon, authenticated;
GRANT SELECT ON public.community_interest_registrations TO authenticated;
GRANT ALL    ON public.community_interest_registrations TO service_role;

-- 6. RLS
ALTER TABLE public.community_interest_registrations ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode registrar interesse (waitlist é público).
-- Anti-spam vive fora do RLS: Turnstile no frontend + verify-turnstile edge function.
DROP POLICY IF EXISTS community_interest_public_insert
  ON public.community_interest_registrations;
CREATE POLICY community_interest_public_insert
  ON public.community_interest_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Somente o próprio usuário autenticado (quando existir user_id) pode reler o
-- próprio registro. Admin/backoffice usa service_role.
DROP POLICY IF EXISTS community_interest_owner_select
  ON public.community_interest_registrations;
CREATE POLICY community_interest_owner_select
  ON public.community_interest_registrations
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

COMMENT ON TABLE public.community_interest_registrations IS
  'Waitlist pública de interesse em comunidades territoriais (coming_soon). Insert público, select restrito ao dono. Anti-spam: Turnstile + honeypot no frontend.';
