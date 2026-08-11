-- Community Interest ADDITIVE compatibility phase.
--
-- The target authority is register-community-interest using service_role, but
-- the deployed legacy frontend still writes directly through the Data API.
-- Keep only the explicitly documented legacy INSERT contract until the staged
-- CUTOVER in docs/09-reference/migrations-pending is promoted with a new
-- timestamp after operational evidence is collected.

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'community_interest_role'
  ) THEN
    CREATE TYPE public.community_interest_role AS ENUM (
      'morador',
      'comerciante',
      'prestador',
      'visitante',
      'outro'
    );
  END IF;
END
$migration$;

CREATE TABLE IF NOT EXISTS public.community_interest_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NULL,
  community_slug text NULL,
  territory_path text NULL,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  phone text NULL CHECK (phone IS NULL OR char_length(phone) <= 30),
  role public.community_interest_role NOT NULL DEFAULT 'morador',
  message text NULL CHECK (message IS NULL OR char_length(message) <= 1000),
  wants_updates boolean NOT NULL DEFAULT true,
  source text NOT NULL CHECK (char_length(source) BETWEEN 1 AND 300),
  user_agent text NULL CHECK (user_agent IS NULL OR char_length(user_agent) <= 500),
  turnstile_verified boolean NOT NULL DEFAULT false,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_status text NOT NULL DEFAULT 'new'
    CHECK (admin_status IN ('new', 'reviewed', 'contacted', 'converted', 'discarded')),
  admin_notes text NULL CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 2000),
  reviewed_at timestamptz NULL,
  reviewed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reconcile installations that may already contain the former pending draft.
ALTER TABLE public.community_interest_registrations
  ADD COLUMN IF NOT EXISTS admin_status text NOT NULL DEFAULT 'new'
    CHECK (admin_status IN ('new', 'reviewed', 'contacted', 'converted', 'discarded')),
  ADD COLUMN IF NOT EXISTS admin_notes text NULL
    CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 2000),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS community_interest_unique_email_per_community
  ON public.community_interest_registrations (
    COALESCE(community_slug, ''),
    lower(email)
  );

CREATE INDEX IF NOT EXISTS community_interest_created_at_idx
  ON public.community_interest_registrations (created_at DESC);

CREATE INDEX IF NOT EXISTS community_interest_community_id_idx
  ON public.community_interest_registrations (community_id);

CREATE INDEX IF NOT EXISTS community_interest_admin_status_idx
  ON public.community_interest_registrations (admin_status);

CREATE OR REPLACE FUNCTION public.tg_community_interest_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tg_community_interest_updated_at
  ON public.community_interest_registrations;
CREATE TRIGGER tg_community_interest_updated_at
  BEFORE UPDATE ON public.community_interest_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_community_interest_touch_updated_at();

ALTER TABLE public.community_interest_registrations ENABLE ROW LEVEL SECURITY;

-- SECURITY: reset privileges to a deterministic least-privilege baseline. The
-- migration is transactional, so the restricted legacy INSERT grant below is
-- established atomically with this reset.
REVOKE ALL PRIVILEGES ON TABLE public.community_interest_registrations
  FROM PUBLIC, anon, authenticated, service_role;

-- Authenticated backoffice remains actor-bound by the admin policies below.
GRANT SELECT, UPDATE, DELETE ON TABLE public.community_interest_registrations
  TO authenticated;

-- The target public registration broker receives only the privilege it needs.
GRANT INSERT ON TABLE public.community_interest_registrations TO service_role;

-- TEMPORARY LEGACY COMPATIBILITY
-- Exact column contract emitted by the currently deployed direct-insert
-- frontend. No server-owned or administrative column is granted. Remove this
-- grant and policy only through the staged Community Interest CUTOVER.
GRANT INSERT (
  community_id,
  community_slug,
  territory_path,
  full_name,
  email,
  phone,
  role,
  message,
  wants_updates,
  source,
  user_agent,
  turnstile_verified
) ON public.community_interest_registrations TO anon, authenticated;

DROP POLICY IF EXISTS community_interest_public_insert
  ON public.community_interest_registrations;
DROP POLICY IF EXISTS community_interest_legacy_insert
  ON public.community_interest_registrations;
CREATE POLICY community_interest_legacy_insert
  ON public.community_interest_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    AND admin_status = 'new'
    AND admin_notes IS NULL
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
    AND char_length(btrim(full_name)) BETWEEN 2 AND 120
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND (
      phone IS NULL
      OR phone ~ '^[0-9+().[:space:]-]+$'
    )
    AND (
      community_slug IS NULL
      OR community_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
    AND (
      territory_path IS NULL
      OR territory_path ~ '^/[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$'
    )
    AND (
      source ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      OR source ~ '^/[a-z0-9_-]+(/[a-z0-9_-]+)*$'
    )
  );

COMMENT ON POLICY community_interest_legacy_insert
  ON public.community_interest_registrations IS
  'TEMPORARY LEGACY COMPATIBILITY: column-restricted direct INSERT for the deployed frontend. Remove only after broker rollout evidence and CUTOVER preflight.';

DROP POLICY IF EXISTS community_interest_owner_select
  ON public.community_interest_registrations;
CREATE POLICY community_interest_owner_select
  ON public.community_interest_registrations
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS community_interest_admin_select
  ON public.community_interest_registrations;
CREATE POLICY community_interest_admin_select
  ON public.community_interest_registrations
  FOR SELECT
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS community_interest_admin_update
  ON public.community_interest_registrations;
CREATE POLICY community_interest_admin_update
  ON public.community_interest_registrations
  FOR UPDATE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS community_interest_admin_delete
  ON public.community_interest_registrations;
CREATE POLICY community_interest_admin_delete
  ON public.community_interest_registrations
  FOR DELETE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

COMMENT ON TABLE public.community_interest_registrations IS
  'Community Interest waitlist in ADDITIVE compatibility. register-community-interest is the target authority; restricted legacy direct INSERT remains temporarily until evidence-gated CUTOVER.';
