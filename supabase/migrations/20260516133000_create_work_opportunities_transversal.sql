-- ============================================================================
-- MIGRATION: Create transversal work_opportunities infrastructure
-- Date: 2026-05-16
--
-- Goal:
-- - Create reusable economic opportunity entity connected to professional identity
-- - Distribute opportunities through feed without duplicating identity data
-- - Prepare matching + notifications foundation by category, territory and availability
--
-- IMPORTANT:
-- This is NOT the full recruitment/jobs pipeline.
-- No resume, no HR stages, no candidacy flow.
-- ============================================================================

-- ============================================================================
-- 1) ENUMS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'work_opportunity_type'
  ) THEN
    CREATE TYPE public.work_opportunity_type AS ENUM (
      'looking_for_work',
      'offering_work',
      'freelance',
      'quick_job',
      'service_availability'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'work_opportunity_status'
  ) THEN
    CREATE TYPE public.work_opportunity_status AS ENUM (
      'active',
      'paused',
      'filled',
      'expired',
      'cancelled'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'professional_profile_visibility'
  ) THEN
    CREATE TYPE public.professional_profile_visibility AS ENUM (
      'public_listed',
      'public_unlisted',
      'private'
    );
  END IF;
END $$;

-- ============================================================================
-- 2) TABLE: work_opportunities (SSOT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity anchor
  author_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Optional reusable professional identity
  professional_id UUID REFERENCES public.professional_data(id) ON DELETE SET NULL,

  -- Opportunity core
  opportunity_type public.work_opportunity_type NOT NULL,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  professional_category TEXT NOT NULL,

  -- Territorial anchor
  territory_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  reach TEXT NOT NULL DEFAULT 'neighborhood'
    CHECK (reach IN ('street', 'neighborhood', 'city')),

  -- Operational context
  urgency TEXT NOT NULL DEFAULT '24h'
    CHECK (urgency IN ('hoje', '24h', 'semana', 'flexivel')),
  availability_notes TEXT,
  availability_start_at TIMESTAMPTZ,
  availability_end_at TIMESTAMPTZ,
  compensation_notes TEXT,
  contact_notes TEXT,

  -- Publication and lifecycle
  visibility public.professional_profile_visibility NOT NULL DEFAULT 'public_listed',
  status public.work_opportunity_status NOT NULL DEFAULT 'active',
  is_feed_distributed BOOLEAN NOT NULL DEFAULT true,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,

  -- Matching metadata and provenance
  matching_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_context TEXT NOT NULL DEFAULT 'community_feed',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT work_opportunities_headline_len_chk
    CHECK (char_length(trim(headline)) BETWEEN 3 AND 120),
  CONSTRAINT work_opportunities_description_len_chk
    CHECK (char_length(trim(description)) BETWEEN 10 AND 2000),
  CONSTRAINT work_opportunities_category_len_chk
    CHECK (char_length(trim(professional_category)) BETWEEN 2 AND 80),
  CONSTRAINT work_opportunities_payload_object_chk
    CHECK (jsonb_typeof(matching_metadata) = 'object'),
  CONSTRAINT work_opportunities_availability_range_chk
    CHECK (
      availability_start_at IS NULL
      OR availability_end_at IS NULL
      OR availability_end_at >= availability_start_at
    )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_opportunities_post_id_unique'
  ) THEN
    ALTER TABLE public.work_opportunities
      ADD CONSTRAINT work_opportunities_post_id_unique UNIQUE (post_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_opportunities_author_profile
  ON public.work_opportunities(author_profile_id);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_author_user
  ON public.work_opportunities(author_user_id)
  WHERE author_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_opportunities_professional
  ON public.work_opportunities(professional_id)
  WHERE professional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_opportunities_location
  ON public.work_opportunities(territory_location_id);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_category
  ON public.work_opportunities(professional_category);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_status
  ON public.work_opportunities(status);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_visibility
  ON public.work_opportunities(visibility);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_type_status_created
  ON public.work_opportunities(opportunity_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_opportunities_matching
  ON public.work_opportunities(territory_location_id, professional_category, urgency)
  WHERE status = 'active'
    AND visibility = 'public_listed';

CREATE INDEX IF NOT EXISTS idx_work_opportunities_matching_metadata_gin
  ON public.work_opportunities USING gin (matching_metadata);

DROP TRIGGER IF EXISTS update_work_opportunities_updated_at ON public.work_opportunities;
CREATE TRIGGER update_work_opportunities_updated_at
  BEFORE UPDATE ON public.work_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Sync author_user_id from author_profile_id
CREATE OR REPLACE FUNCTION public.sync_work_opportunity_author_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT p.user_id
  INTO v_user_id
  FROM public.profiles p
  WHERE p.id = NEW.author_profile_id;

  NEW.author_user_id := v_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_work_opportunity_author_user ON public.work_opportunities;
CREATE TRIGGER trg_sync_work_opportunity_author_user
  BEFORE INSERT OR UPDATE OF author_profile_id ON public.work_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_work_opportunity_author_user();

-- Enforce professional profile ownership when linked
CREATE OR REPLACE FUNCTION public.enforce_work_opportunity_professional_ownership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  IF NEW.professional_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT pd.owner_user_id
  INTO v_owner_user_id
  FROM public.professional_data pd
  WHERE pd.id = NEW.professional_id;

  IF v_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Professional profile not found for id %', NEW.professional_id;
  END IF;

  IF NEW.author_user_id IS DISTINCT FROM v_owner_user_id THEN
    RAISE EXCEPTION 'Linked professional profile must belong to the same user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_work_opportunity_professional_ownership ON public.work_opportunities;
CREATE TRIGGER trg_enforce_work_opportunity_professional_ownership
  BEFORE INSERT OR UPDATE OF professional_id, author_user_id ON public.work_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_work_opportunity_professional_ownership();

COMMENT ON TABLE public.work_opportunities IS
'Transversal territorial economic opportunities linked to reusable professional identity.';

COMMENT ON COLUMN public.work_opportunities.professional_id IS
'Reusable professional profile identity linked to the opportunity when available.';

COMMENT ON COLUMN public.work_opportunities.post_id IS
'Associated feed post used for territorial distribution card.';

-- ============================================================================
-- 3) RLS
-- ============================================================================

ALTER TABLE public.work_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public work opportunities viewable" ON public.work_opportunities;
CREATE POLICY "Public work opportunities viewable"
  ON public.work_opportunities FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND visibility IN ('public_listed', 'public_unlisted')
    AND (
      professional_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.professional_data pd
        WHERE pd.id = professional_id
          AND pd.visibility IN ('public_listed', 'public_unlisted')
      )
    )
  );

DROP POLICY IF EXISTS "Owners view own work opportunities" ON public.work_opportunities;
CREATE POLICY "Owners view own work opportunities"
  ON public.work_opportunities FOR SELECT
  TO authenticated
  USING (
    author_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners manage own work opportunities" ON public.work_opportunities;
CREATE POLICY "Owners manage own work opportunities"
  ON public.work_opportunities FOR ALL
  TO authenticated
  USING (
    author_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    author_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4) PUBLIC SEARCH VIEW
-- ============================================================================

DROP VIEW IF EXISTS public.public_work_opportunity_search CASCADE;
CREATE OR REPLACE VIEW public.public_work_opportunity_search AS
SELECT
  wo.id,
  wo.author_profile_id,
  wo.professional_id,
  wo.opportunity_type,
  wo.headline,
  wo.description,
  wo.professional_category,
  wo.territory_location_id,
  wo.reach,
  wo.urgency,
  wo.availability_notes,
  wo.compensation_notes,
  wo.contact_notes,
  wo.visibility,
  wo.status,
  wo.post_id,
  wo.created_at,
  wo.updated_at,
  wo.published_at,
  p.name AS author_name,
  p.avatar_url AS author_avatar_url,
  l.name AS territory_name,
  l.geographic_path,
  pd.slug AS professional_slug,
  pd.professional_name,
  pd.service_category
FROM public.work_opportunities wo
JOIN public.profiles p ON p.id = wo.author_profile_id
JOIN public.locations l ON l.id = wo.territory_location_id
LEFT JOIN public.professional_data pd ON pd.id = wo.professional_id
WHERE wo.status = 'active'
  AND wo.visibility = 'public_listed';

GRANT SELECT ON public.public_work_opportunity_search TO anon, authenticated;

COMMENT ON VIEW public.public_work_opportunity_search IS
'Public search projection for transversal work opportunities.';

-- ============================================================================
-- 5) MATCHING HELPER VIEW (professional candidates)
-- ============================================================================

DROP VIEW IF EXISTS public.work_opportunity_match_candidates CASCADE;
CREATE OR REPLACE VIEW public.work_opportunity_match_candidates AS
SELECT
  wo.id AS opportunity_id,
  wo.author_user_id AS opportunity_author_user_id,
  wo.professional_category,
  wo.territory_location_id,
  wo.urgency,
  pd.id AS professional_id,
  pd.owner_user_id AS professional_owner_user_id,
  pd.service_category,
  pd.availability_notes,
  pd.location_id AS professional_location_id,
  pd.visibility AS professional_visibility,
  pd.is_accepting_clients
FROM public.work_opportunities wo
JOIN public.professional_data pd
  ON pd.service_category = wo.professional_category
 AND pd.location_id = wo.territory_location_id
WHERE wo.status = 'active'
  AND wo.visibility = 'public_listed'
  AND pd.is_accepting_clients = true
  AND pd.visibility IN ('public_listed', 'public_unlisted')
  AND pd.owner_user_id IS DISTINCT FROM wo.author_user_id;

GRANT SELECT ON public.work_opportunity_match_candidates TO authenticated;

COMMENT ON VIEW public.work_opportunity_match_candidates IS
'Candidate professionals for opportunity matching by category + territory.';

NOTIFY pgrst, 'reload schema';
