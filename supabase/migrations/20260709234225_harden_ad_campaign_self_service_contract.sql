-- ============================================================================
-- Harden sponsored ads as a real self-service business contract
-- ============================================================================
-- Home and discovery surfaces already consume public sponsored ads through
-- core/business/promotions. This migration makes the database contract match
-- that product promise:
--
-- - ad_campaigns/ad_targets are canonical Supabase tables, not SQL snippets in src.
-- - public users can only read active, approved campaigns inside their window.
-- - public delivery also requires billing authorized/paid.
-- - authenticated business owners/managers can draft/request campaigns only for
--   businesses they own through business_data.profile_id/profile_members.
-- - approval, billing, priority, and activation stay server/admin controlled.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_contact TEXT,
  advertiser_name TEXT NOT NULL,
  budget_spent NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (budget_spent >= 0),
  budget_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (budget_total >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  cta_label TEXT,
  cta_url TEXT,
  description TEXT,
  ends_at TIMESTAMPTZ,
  image_url TEXT,
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  placement_key TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'paused',
  territory_ref_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  territory_type TEXT NOT NULL DEFAULT 'city',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  target_scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ad_targets_campaign_location_unique UNIQUE (campaign_id, location_id)
);

ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS owner_business_id UUID REFERENCES public.business_data(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'self_service',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_campaigns_status_check'
      AND conrelid = 'public.ad_campaigns'::regclass
  ) THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_status_check
      CHECK (status IN ('active', 'paused', 'ended'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_campaigns_placement_key_check'
      AND conrelid = 'public.ad_campaigns'::regclass
  ) THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_placement_key_check
      CHECK (placement_key IN ('feed_sponsored', 'sidebar_widget', 'banner_top', 'banner_bottom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_campaigns_territory_type_check'
      AND conrelid = 'public.ad_campaigns'::regclass
  ) THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_territory_type_check
      CHECK (territory_type IN ('city', 'district', 'neighborhood'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_campaigns_review_status_check'
      AND conrelid = 'public.ad_campaigns'::regclass
  ) THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_review_status_check
      CHECK (review_status IN ('draft', 'pending', 'approved', 'rejected', 'archived'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_campaigns_billing_status_check'
      AND conrelid = 'public.ad_campaigns'::regclass
  ) THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_billing_status_check
      CHECK (billing_status IN ('unpaid', 'authorized', 'paid', 'refunded', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_campaigns_source_check'
      AND conrelid = 'public.ad_campaigns'::regclass
  ) THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_source_check
      CHECK (source IN ('self_service', 'admin', 'migration', 'platform'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_campaigns_date_window_check'
      AND conrelid = 'public.ad_campaigns'::regclass
  ) THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_date_window_check
      CHECK (ends_at IS NULL OR ends_at > starts_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_targets_target_scope_check'
      AND conrelid = 'public.ad_targets'::regclass
  ) THEN
    ALTER TABLE public.ad_targets
      ADD CONSTRAINT ad_targets_target_scope_check
      CHECK (target_scope IN ('city', 'district', 'neighborhood'));
  END IF;
END $migration$;

DROP TRIGGER IF EXISTS update_ad_campaigns_updated_at ON public.ad_campaigns;
CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_targets_updated_at ON public.ad_targets;
CREATE TRIGGER update_ad_targets_updated_at
  BEFORE UPDATE ON public.ad_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_public_delivery
  ON public.ad_campaigns (placement_key, status, review_status, starts_at, ends_at, priority DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_owner_business_review
  ON public.ad_campaigns (owner_business_id, review_status, status, updated_at DESC)
  WHERE owner_business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_territory
  ON public.ad_campaigns (territory_ref_id, territory_type, status, review_status);

CREATE INDEX IF NOT EXISTS idx_ad_targets_location_campaign
  ON public.ad_targets (location_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_ad_targets_campaign
  ON public.ad_targets (campaign_id);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_targets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ad_campaigns FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.ad_targets FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.ad_campaigns TO anon, authenticated;
GRANT SELECT ON TABLE public.ad_targets TO anon, authenticated;

GRANT INSERT (
  owner_business_id,
  created_by_profile_id,
  advertiser_contact,
  advertiser_name,
  title,
  description,
  image_url,
  cta_label,
  cta_url,
  placement_key,
  starts_at,
  ends_at,
  budget_total,
  territory_ref_id,
  territory_type,
  source
) ON public.ad_campaigns TO authenticated;

GRANT UPDATE (
  advertiser_contact,
  advertiser_name,
  title,
  description,
  image_url,
  cta_label,
  cta_url,
  placement_key,
  starts_at,
  ends_at,
  budget_total,
  territory_ref_id,
  territory_type,
  review_status,
  submitted_at,
  updated_at
) ON public.ad_campaigns TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.ad_targets TO authenticated;
GRANT ALL ON TABLE public.ad_campaigns TO service_role;
GRANT ALL ON TABLE public.ad_targets TO service_role;

DROP POLICY IF EXISTS "ad_campaigns_select" ON public.ad_campaigns;
DROP POLICY IF EXISTS "ad_targets_select" ON public.ad_targets;
DROP POLICY IF EXISTS "ad_campaigns_write_service_role" ON public.ad_campaigns;
DROP POLICY IF EXISTS "ad_targets_write_service_role" ON public.ad_targets;
DROP POLICY IF EXISTS ad_campaigns_public_active_approved_select ON public.ad_campaigns;
DROP POLICY IF EXISTS ad_campaigns_owner_select ON public.ad_campaigns;
DROP POLICY IF EXISTS ad_campaigns_owner_insert ON public.ad_campaigns;
DROP POLICY IF EXISTS ad_campaigns_owner_update_unapproved ON public.ad_campaigns;
DROP POLICY IF EXISTS ad_targets_public_active_approved_select ON public.ad_targets;
DROP POLICY IF EXISTS ad_targets_owner_select ON public.ad_targets;
DROP POLICY IF EXISTS ad_targets_owner_insert ON public.ad_targets;
DROP POLICY IF EXISTS ad_targets_owner_update ON public.ad_targets;
DROP POLICY IF EXISTS ad_targets_owner_delete ON public.ad_targets;

CREATE POLICY ad_campaigns_public_active_approved_select
  ON public.ad_campaigns
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND review_status = 'approved'
    AND billing_status IN ('authorized', 'paid')
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY ad_campaigns_owner_select
  ON public.ad_campaigns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = ad_campaigns.owner_business_id
        AND p.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = ad_campaigns.owner_business_id
        AND pm.user_id = (select auth.uid())
        AND pm.is_active = true
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

CREATE POLICY ad_campaigns_owner_insert
  ON public.ad_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_business_id IS NOT NULL
    AND status = 'paused'
    AND review_status IN ('draft', 'pending')
    AND billing_status = 'unpaid'
    AND source = 'self_service'
    AND priority = 0
    AND approved_at IS NULL
    AND approved_by_profile_id IS NULL
    AND created_by_profile_id = (
      SELECT bd.profile_id
      FROM public.business_data bd
      WHERE bd.id = owner_business_id
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.business_data bd
        JOIN public.profiles p ON p.id = bd.profile_id
        WHERE bd.id = owner_business_id
          AND p.user_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1
        FROM public.business_data bd
        JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
        WHERE bd.id = owner_business_id
          AND pm.user_id = (select auth.uid())
          AND pm.is_active = true
          AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
      )
    )
  );

CREATE POLICY ad_campaigns_owner_update_unapproved
  ON public.ad_campaigns
  FOR UPDATE
  TO authenticated
  USING (
    source = 'self_service'
    AND review_status IN ('draft', 'pending', 'rejected')
    AND (
      EXISTS (
        SELECT 1
        FROM public.business_data bd
        JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
        WHERE bd.id = ad_campaigns.owner_business_id
          AND pm.user_id = (select auth.uid())
          AND pm.is_active = true
          AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
      )
      OR EXISTS (
        SELECT 1
        FROM public.business_data bd
        JOIN public.profiles p ON p.id = bd.profile_id
        WHERE bd.id = ad_campaigns.owner_business_id
          AND p.user_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    owner_business_id IS NOT NULL
    AND status = 'paused'
    AND review_status IN ('draft', 'pending')
    AND billing_status = 'unpaid'
    AND source = 'self_service'
    AND priority = 0
    AND approved_at IS NULL
    AND approved_by_profile_id IS NULL
    AND created_by_profile_id = (
      SELECT bd.profile_id
      FROM public.business_data bd
      WHERE bd.id = owner_business_id
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.business_data bd
        JOIN public.profiles p ON p.id = bd.profile_id
        WHERE bd.id = owner_business_id
          AND p.user_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1
        FROM public.business_data bd
        JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
        WHERE bd.id = owner_business_id
          AND pm.user_id = (select auth.uid())
          AND pm.is_active = true
          AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
      )
    )
  );

CREATE POLICY ad_targets_public_active_approved_select
  ON public.ad_targets
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      WHERE ac.id = ad_targets.campaign_id
        AND ac.status = 'active'
        AND ac.review_status = 'approved'
        AND ac.billing_status IN ('authorized', 'paid')
        AND ac.starts_at <= now()
        AND (ac.ends_at IS NULL OR ac.ends_at > now())
    )
  );

CREATE POLICY ad_targets_owner_select
  ON public.ad_targets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE ac.id = ad_targets.campaign_id
        AND p.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE ac.id = ad_targets.campaign_id
        AND pm.user_id = (select auth.uid())
        AND pm.is_active = true
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

CREATE POLICY ad_targets_owner_insert
  ON public.ad_targets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE ac.id = campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending')
        AND p.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE ac.id = campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending')
        AND pm.user_id = (select auth.uid())
        AND pm.is_active = true
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

CREATE POLICY ad_targets_owner_update
  ON public.ad_targets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE ac.id = ad_targets.campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending', 'rejected')
        AND p.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE ac.id = ad_targets.campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending', 'rejected')
        AND pm.user_id = (select auth.uid())
        AND pm.is_active = true
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE ac.id = campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending')
        AND p.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE ac.id = campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending')
        AND pm.user_id = (select auth.uid())
        AND pm.is_active = true
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

CREATE POLICY ad_targets_owner_delete
  ON public.ad_targets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE ac.id = ad_targets.campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending', 'rejected')
        AND p.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.ad_campaigns ac
      JOIN public.business_data bd ON bd.id = ac.owner_business_id
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE ac.id = ad_targets.campaign_id
        AND ac.source = 'self_service'
        AND ac.status = 'paused'
        AND ac.review_status IN ('draft', 'pending', 'rejected')
        AND pm.user_id = (select auth.uid())
        AND pm.is_active = true
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

COMMENT ON TABLE public.ad_campaigns IS
  'Sponsored ad campaigns. Public delivery requires active+approved rows; business writes are limited by business_data ownership.';
COMMENT ON COLUMN public.ad_campaigns.owner_business_id IS
  'Business owner for self-service campaigns. business_data remains the SSOT for business identity.';
COMMENT ON COLUMN public.ad_campaigns.review_status IS
  'Moderation workflow for sponsored ads. Only approved campaigns are publicly delivered.';
COMMENT ON COLUMN public.ad_campaigns.billing_status IS
  'Billing workflow for sponsored ads; priority/approval/activation are server-admin controlled.';
COMMENT ON TABLE public.ad_targets IS
  'Canonical location targets for sponsored ads. Targeting uses location_id, never free-form city/neighborhood strings.';

CREATE OR REPLACE FUNCTION public.request_ad_campaign(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_owner_business_id UUID := NULLIF(payload->>'owner_business_id', '')::UUID;
  v_created_by_profile_id UUID;
  v_business_name TEXT;
  v_advertiser_name TEXT := btrim(COALESCE(payload->>'advertiser_name', ''));
  v_advertiser_contact TEXT := NULLIF(btrim(COALESCE(payload->>'advertiser_contact', '')), '');
  v_title TEXT := btrim(COALESCE(payload->>'title', ''));
  v_description TEXT := NULLIF(btrim(COALESCE(payload->>'description', '')), '');
  v_image_url TEXT := NULLIF(btrim(COALESCE(payload->>'image_url', '')), '');
  v_cta_label TEXT := NULLIF(btrim(COALESCE(payload->>'cta_label', '')), '');
  v_cta_url TEXT := NULLIF(btrim(COALESCE(payload->>'cta_url', '')), '');
  v_placement_key TEXT := COALESCE(NULLIF(payload->>'placement_key', ''), 'sidebar_widget');
  v_territory_ref_id UUID := NULLIF(payload->>'territory_ref_id', '')::UUID;
  v_territory_type TEXT := COALESCE(NULLIF(payload->>'territory_type', ''), 'city');
  v_starts_at TIMESTAMPTZ := COALESCE(NULLIF(payload->>'starts_at', '')::TIMESTAMPTZ, now());
  v_ends_at TIMESTAMPTZ := NULLIF(payload->>'ends_at', '')::TIMESTAMPTZ;
  v_budget_total NUMERIC(12,2) := COALESCE(NULLIF(payload->>'budget_total', '')::NUMERIC, 0);
  v_targets JSONB := CASE
    WHEN jsonb_typeof(payload->'targets') = 'array' THEN payload->'targets'
    ELSE '[]'::jsonb
  END;
  v_campaign_id UUID;
  v_target JSONB;
  v_target_location_id UUID;
  v_target_scope TEXT;
BEGIN
  IF (select auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT bd.profile_id, bd.business_name
    INTO v_created_by_profile_id, v_business_name
  FROM public.business_data bd
  WHERE bd.id = v_owner_business_id
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = bd.profile_id
          AND p.user_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = bd.profile_id
          AND pm.user_id = (select auth.uid())
          AND pm.is_active = true
          AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
      )
    );

  IF v_created_by_profile_id IS NULL THEN
    RAISE EXCEPTION 'business_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF v_advertiser_name = '' THEN
    v_advertiser_name := v_business_name;
  END IF;

  IF char_length(v_advertiser_name) < 2 OR char_length(v_advertiser_name) > 120 THEN
    RAISE EXCEPTION 'invalid_advertiser_name' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_title) < 4 OR char_length(v_title) > 90 THEN
    RAISE EXCEPTION 'invalid_title' USING ERRCODE = '22023';
  END IF;

  IF v_description IS NULL OR char_length(v_description) < 8 OR char_length(v_description) > 220 THEN
    RAISE EXCEPTION 'invalid_description' USING ERRCODE = '22023';
  END IF;

  IF v_cta_label IS NOT NULL AND char_length(v_cta_label) > 36 THEN
    RAISE EXCEPTION 'invalid_cta_label' USING ERRCODE = '22023';
  END IF;

  IF v_cta_url IS NOT NULL AND v_cta_url !~ '^(https?://|/)' THEN
    RAISE EXCEPTION 'invalid_cta_url' USING ERRCODE = '22023';
  END IF;

  IF v_image_url IS NOT NULL AND v_image_url !~ '^https?://' THEN
    RAISE EXCEPTION 'invalid_image_url' USING ERRCODE = '22023';
  END IF;

  IF v_placement_key NOT IN ('feed_sponsored', 'sidebar_widget', 'banner_top', 'banner_bottom') THEN
    RAISE EXCEPTION 'invalid_placement_key' USING ERRCODE = '22023';
  END IF;

  IF v_territory_type NOT IN ('city', 'district', 'neighborhood') THEN
    RAISE EXCEPTION 'invalid_territory_type' USING ERRCODE = '22023';
  END IF;

  IF v_budget_total < 0 THEN
    RAISE EXCEPTION 'invalid_budget_total' USING ERRCODE = '22023';
  END IF;

  IF v_ends_at IS NOT NULL AND v_ends_at <= v_starts_at THEN
    RAISE EXCEPTION 'invalid_date_window' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.locations l
    WHERE l.id = v_territory_ref_id
      AND l.status = 'active'
  ) THEN
    RAISE EXCEPTION 'invalid_territory' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ad_campaigns (
    owner_business_id,
    created_by_profile_id,
    advertiser_contact,
    advertiser_name,
    title,
    description,
    image_url,
    cta_label,
    cta_url,
    placement_key,
    starts_at,
    ends_at,
    budget_total,
    territory_ref_id,
    territory_type,
    status,
    review_status,
    billing_status,
    source,
    priority
  )
  VALUES (
    v_owner_business_id,
    v_created_by_profile_id,
    v_advertiser_contact,
    v_advertiser_name,
    v_title,
    v_description,
    v_image_url,
    v_cta_label,
    v_cta_url,
    v_placement_key,
    v_starts_at,
    v_ends_at,
    v_budget_total,
    v_territory_ref_id,
    v_territory_type,
    'paused',
    'pending',
    'unpaid',
    'self_service',
    0
  )
  RETURNING id INTO v_campaign_id;

  IF jsonb_array_length(v_targets) = 0 THEN
    v_targets := jsonb_build_array(
      jsonb_build_object(
        'location_id', v_territory_ref_id::TEXT,
        'target_scope', v_territory_type
      )
    );
  END IF;

  FOR v_target IN SELECT value FROM jsonb_array_elements(v_targets)
  LOOP
    v_target_location_id := NULLIF(v_target->>'location_id', '')::UUID;
    v_target_scope := COALESCE(NULLIF(v_target->>'target_scope', ''), v_territory_type);

    IF v_target_scope NOT IN ('city', 'district', 'neighborhood') THEN
      RAISE EXCEPTION 'invalid_target_scope' USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.locations l
      WHERE l.id = v_target_location_id
        AND l.status = 'active'
    ) THEN
      RAISE EXCEPTION 'invalid_target_location' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.ad_targets (campaign_id, location_id, target_scope)
    VALUES (v_campaign_id, v_target_location_id, v_target_scope);
  END LOOP;

  RETURN v_campaign_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_ad_campaign(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_ad_campaign(jsonb) TO authenticated;

COMMENT ON FUNCTION public.request_ad_campaign(jsonb) IS
  'Authenticated self-service request for sponsored campaigns. SECURITY INVOKER keeps caller RLS and creates campaign+targets atomically.';

NOTIFY pgrst, 'reload schema';
