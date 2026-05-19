-- ============================================================================
-- MIGRATION: Reorganize Social + Professional Identity Foundation
-- Date: 2026-05-16
--
-- Goal:
-- - Personal/social profile as principal user identity
-- - Structured professional identity with explicit visibility modes
-- - Keep compatibility with existing feed/opportunities/services modules
--
-- NOTE:
-- This migration does not implement a full jobs/vacancies module.
-- It only prepares identity architecture for next phases.
-- ============================================================================

-- ============================================================================
-- 1) SOCIAL IDENTITY (PERSONAL PROFILE) ENHANCEMENTS
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS short_bio TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS main_territory_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_reputation_score INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_community_reputation_score_non_negative'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_community_reputation_score_non_negative
      CHECK (community_reputation_score >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_short_bio_length_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_short_bio_length_check
      CHECK (short_bio IS NULL OR char_length(short_bio) <= 280);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_main_territory_location
  ON public.profiles(main_territory_location_id)
  WHERE main_territory_location_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_profiles_unique_personal_per_user'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.profile_type = 'personal'
      GROUP BY p.user_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE NOTICE 'Skipping idx_profiles_unique_personal_per_user: duplicate personal profiles detected.';
    ELSE
      EXECUTE '
        CREATE UNIQUE INDEX idx_profiles_unique_personal_per_user
          ON public.profiles(user_id)
          WHERE profile_type = ''personal''
      ';
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.short_bio IS
'Short social bio for personal identity (max 280 chars).';

COMMENT ON COLUMN public.profiles.main_territory_location_id IS
'Principal territory of personal identity (territorial anchor).';

COMMENT ON COLUMN public.profiles.community_reputation_score IS
'Community reputation score focused on territorial/community participation.';

-- ============================================================================
-- 2) PROFESSIONAL IDENTITY ENHANCEMENTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'professional_profile_visibility'
  ) THEN
    CREATE TYPE public.professional_profile_visibility AS ENUM (
      'public_listed',
      'public_unlisted',
      'private'
    );
  END IF;
END $$;

ALTER TABLE public.professional_data
  ADD COLUMN IF NOT EXISTS visibility public.professional_profile_visibility NOT NULL DEFAULT 'public_listed';

ALTER TABLE public.professional_data
  ADD COLUMN IF NOT EXISTS availability_notes TEXT;

ALTER TABLE public.professional_data
  ADD COLUMN IF NOT EXISTS portfolio_items JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.professional_data
  ADD COLUMN IF NOT EXISTS owner_user_id UUID;

ALTER TABLE public.professional_data
  ADD COLUMN IF NOT EXISTS updated_by_user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professional_data_owner_user_id_fkey'
  ) THEN
    ALTER TABLE public.professional_data
      ADD CONSTRAINT professional_data_owner_user_id_fkey
      FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professional_data_updated_by_user_id_fkey'
  ) THEN
    ALTER TABLE public.professional_data
      ADD CONSTRAINT professional_data_updated_by_user_id_fkey
      FOREIGN KEY (updated_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_professional_data_visibility
  ON public.professional_data(visibility);

CREATE INDEX IF NOT EXISTS idx_professional_data_owner_user
  ON public.professional_data(owner_user_id)
  WHERE owner_user_id IS NOT NULL;

COMMENT ON COLUMN public.professional_data.visibility IS
'Professional profile visibility: public_listed | public_unlisted | private.';

COMMENT ON COLUMN public.professional_data.availability_notes IS
'Free-form availability notes shown on structured professional profile.';

COMMENT ON COLUMN public.professional_data.portfolio_items IS
'Structured portfolio media list for professional profile.';

-- Backfill owner_user_id for existing rows
UPDATE public.professional_data pd
SET owner_user_id = p.user_id
FROM public.profiles p
WHERE p.id = pd.profile_id
  AND pd.owner_user_id IS NULL;

-- Keep owner metadata in sync
CREATE OR REPLACE FUNCTION public.sync_professional_owner_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT p.user_id INTO v_user_id
  FROM public.profiles p
  WHERE p.id = NEW.profile_id;

  NEW.owner_user_id := v_user_id;
  NEW.updated_by_user_id := COALESCE(auth.uid(), NEW.updated_by_user_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_professional_owner_user ON public.professional_data;
CREATE TRIGGER trg_sync_professional_owner_user
  BEFORE INSERT OR UPDATE OF profile_id ON public.professional_data
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_professional_owner_user();

-- ============================================================================
-- 3) PROFESSIONAL PORTFOLIO ENTITY (STRUCTURED MEDIA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.professional_profile_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professional_data(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professional_profile_media_media_type_check
    CHECK (media_type IN ('image', 'video', 'document'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_professional_profile_media_unique_url
  ON public.professional_profile_media(professional_id, media_url);

CREATE INDEX IF NOT EXISTS idx_professional_profile_media_professional
  ON public.professional_profile_media(professional_id);

CREATE INDEX IF NOT EXISTS idx_professional_profile_media_cover
  ON public.professional_profile_media(professional_id, is_cover)
  WHERE is_cover = true;

DROP TRIGGER IF EXISTS update_professional_profile_media_updated_at ON public.professional_profile_media;
CREATE TRIGGER update_professional_profile_media_updated_at
  BEFORE UPDATE ON public.professional_profile_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.professional_profile_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional media public view" ON public.professional_profile_media;
CREATE POLICY "Professional media public view"
  ON public.professional_profile_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professional_data pd
      WHERE pd.id = professional_id
        AND pd.is_accepting_clients = true
        AND pd.visibility IN ('public_listed', 'public_unlisted')
    )
  );

DROP POLICY IF EXISTS "Professional media owner manage" ON public.professional_profile_media;
CREATE POLICY "Professional media owner manage"
  ON public.professional_profile_media FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professional_data pd
      JOIN public.profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professional_data pd
      JOIN public.profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_id
        AND p.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.professional_profile_media IS
'Structured portfolio media for professional profiles.';

-- ============================================================================
-- 4) RLS + PUBLIC SEARCH VISIBILITY ALIGNMENT
-- ============================================================================

DROP POLICY IF EXISTS "Professionals viewable" ON public.professional_data;
CREATE POLICY "Professionals viewable"
  ON public.professional_data FOR SELECT
  TO anon, authenticated
  USING (
    is_accepting_clients = true
    AND visibility IN ('public_listed', 'public_unlisted')
  );

DROP VIEW IF EXISTS public.public_professional_search CASCADE;
CREATE OR REPLACE VIEW public.public_professional_search AS
SELECT
  pd.id,
  pd.profile_id,
  pd.owner_user_id,
  pd.professional_name,
  pd.slug,
  pd.service_category,
  pd.description,
  pd.location_id,
  pd.address_id,
  pd.visibility,
  pd.is_accepting_clients,
  pd.is_verified,
  pd.rating,
  pd.price_range,
  pd.availability_notes,
  pd.portfolio_items,
  pd.metadata,
  pd.created_at,
  pd.updated_at,
  COALESCE((pd.metadata->>'latitude')::NUMERIC, a.latitude) AS latitude,
  COALESCE((pd.metadata->>'longitude')::NUMERIC, a.longitude) AS longitude,
  l.geographic_path
FROM public.professional_data pd
LEFT JOIN public.addresses a ON pd.address_id = a.id
LEFT JOIN public.locations l ON pd.location_id = l.id
WHERE pd.is_accepting_clients = true
  AND pd.visibility = 'public_listed';

GRANT SELECT ON public.public_professional_search TO anon, authenticated;

-- ============================================================================
-- 5) ARCHITECTURE VIEWS (user -> professional_profiles -> companies -> organizations)
-- ============================================================================

CREATE OR REPLACE VIEW public.personal_social_profiles AS
SELECT
  p.id AS profile_id,
  p.user_id,
  p.name,
  p.display_name,
  p.username,
  p.avatar_url,
  p.short_bio,
  p.bio,
  p.main_territory_location_id,
  p.community_reputation_score,
  COALESCE(gm_stats.groups_count, 0) AS groups_count,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS groups_count
  FROM public.group_members_new gm
  WHERE gm.member_profile_id = p.id
) gm_stats ON true
WHERE p.profile_type = 'personal'
  AND p.is_active = true;

CREATE OR REPLACE VIEW public.user_professional_profiles AS
SELECT
  p.user_id,
  pd.id AS professional_profile_id,
  pd.profile_id,
  pd.professional_name,
  pd.service_category,
  pd.visibility,
  pd.is_accepting_clients,
  pd.is_verified,
  pd.rating,
  pd.location_id,
  pd.created_at,
  pd.updated_at
FROM public.professional_data pd
JOIN public.profiles p ON p.id = pd.profile_id
WHERE p.profile_type = 'professional'
  AND p.is_active = true;

CREATE OR REPLACE VIEW public.user_companies AS
SELECT
  p.user_id,
  bd.id AS company_id,
  bd.profile_id,
  bd.business_name,
  bd.slug,
  bd.status,
  bd.category,
  bd.location_id,
  bd.created_at,
  bd.updated_at
FROM public.business_data bd
JOIN public.profiles p ON p.id = bd.profile_id
WHERE p.profile_type = 'business'
  AND p.is_active = true;

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.groups
SET slug = NULL
WHERE slug IS NOT NULL
  AND trim(slug) = '';

WITH normalized AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        lower(
          trim(
            both '-'
            from regexp_replace(
              regexp_replace(coalesce(name, id::text), '[^a-zA-Z0-9]+', '-', 'g'),
              '-+',
              '-',
              'g'
            )
          )
        ),
        ''
      ),
      id::text
    ) AS base_slug
  FROM public.groups
  WHERE slug IS NULL
),
deduplicated AS (
  SELECT
    id,
    CASE
      WHEN row_number() OVER (PARTITION BY base_slug ORDER BY id) = 1 THEN base_slug
      ELSE base_slug || '-' || left(id::text, 8)
    END AS resolved_slug
  FROM normalized
)
UPDATE public.groups g
SET slug = d.resolved_slug
FROM deduplicated d
WHERE g.id = d.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_slug_unique
  ON public.groups(slug)
  WHERE slug IS NOT NULL;

CREATE OR REPLACE VIEW public.user_organizations AS
SELECT
  p.user_id,
  gm.group_id AS organization_id,
  g.name AS organization_name,
  g.slug AS organization_slug,
  g.type AS organization_type,
  gm.role AS membership_role,
  gm.joined_at
FROM public.group_members_new gm
JOIN public.profiles p ON p.id = gm.member_profile_id
JOIN public.groups g ON g.id = gm.group_id
WHERE p.is_active = true;

GRANT SELECT ON public.personal_social_profiles TO authenticated;
GRANT SELECT ON public.user_professional_profiles TO authenticated;
GRANT SELECT ON public.user_companies TO authenticated;
GRANT SELECT ON public.user_organizations TO authenticated;

COMMENT ON VIEW public.personal_social_profiles IS
'Canonical social identity view (personal profile as principal user identity).';

COMMENT ON VIEW public.user_professional_profiles IS
'Architectural bridge: user -> structured professional profiles.';

COMMENT ON VIEW public.user_companies IS
'Architectural bridge: user -> companies (business identity).';

COMMENT ON VIEW public.user_organizations IS
'Architectural bridge: user -> organizations/groups.';

NOTIFY pgrst, 'reload schema';
