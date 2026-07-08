-- Community entity links SSOT.
--
-- This table is the durable Community First distribution contract.
-- Canonical entity data remains in its own domain table; this table only says
-- where an entity appears inside a Local Community and how that local placement
-- is moderated.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.community_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.territory_communities(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'primary_territory',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_entity_links_entity_type_check
    CHECK (entity_type IN ('business', 'event', 'classified', 'professional', 'post', 'tourist_point')),
  CONSTRAINT community_entity_links_link_type_check
    CHECK (link_type IN ('primary_territory', 'serves_area', 'featured', 'sponsored', 'member_submitted', 'official')),
  CONSTRAINT community_entity_links_status_check
    CHECK (status IN ('pending', 'active', 'rejected', 'hidden', 'expired')),
  CONSTRAINT community_entity_links_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT community_entity_links_time_window_check
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT community_entity_links_approval_consistency_check
    CHECK (
      (status = 'active' AND approved_at IS NOT NULL)
      OR status <> 'active'
    )
);

CREATE INDEX IF NOT EXISTS idx_community_entity_links_community_status
  ON public.community_entity_links(
    community_id,
    status,
    entity_type,
    link_type,
    priority DESC,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_community_entity_links_entity_status
  ON public.community_entity_links(entity_type, entity_id, status);

CREATE INDEX IF NOT EXISTS idx_community_entity_links_created_by_profile
  ON public.community_entity_links(created_by_profile_id)
  WHERE created_by_profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_entity_links_live_unique
  ON public.community_entity_links(community_id, entity_type, entity_id, link_type)
  WHERE status IN ('pending', 'active', 'hidden');

CREATE OR REPLACE FUNCTION private.can_manage_community_entity_link(
  p_community_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT
    p_community_id IS NOT NULL
    AND p_user_id IS NOT NULL
    AND (
      coalesce(private.is_admin_from_roles(p_user_id), false)
      OR EXISTS (
        SELECT 1
        FROM public.community_memberships cm
        WHERE cm.community_id = p_community_id
          AND cm.user_id = p_user_id
          AND cm.status = 'active'
          AND cm.role IN ('owner', 'admin', 'moderator')
      )
    );
$$;

CREATE OR REPLACE FUNCTION private.community_entity_link_target_is_visible(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_entity_type = 'business' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = p_entity_id
        AND bd.status = 'active'
    );
  END IF;

  IF p_entity_type = 'event' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = p_entity_id
        AND e.status IN ('upcoming', 'ongoing')
    );
  END IF;

  IF p_entity_type = 'classified' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.classifieds c
      WHERE c.id = p_entity_id
        AND c.status = 'active'
    );
  END IF;

  IF p_entity_type = 'professional' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.professional_data pd
      WHERE pd.id = p_entity_id
        AND pd.is_accepting_clients = true
    );
  END IF;

  IF p_entity_type = 'post' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = p_entity_id
        AND p.is_published = true
    );
  END IF;

  IF p_entity_type = 'tourist_point' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.tourist_points tp
      WHERE tp.id = p_entity_id
        AND tp.status = 'published'
    );
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_community_entity_link_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.territory_communities tc
    WHERE tc.id = NEW.community_id
      AND tc.status <> 'inactive'
  ) THEN
    RAISE EXCEPTION 'community_entity_link_inactive_or_missing_community'
      USING ERRCODE = '23514';
  END IF;

  IF NOT private.community_entity_link_target_is_visible(NEW.entity_type, NEW.entity_id) THEN
    RAISE EXCEPTION 'community_entity_link_target_not_publicly_visible'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.created_by_profile_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = NEW.created_by_profile_id
        AND p.is_active = true
        AND p.is_suspended = false
    )
  THEN
    RAISE EXCEPTION 'community_entity_link_creator_profile_inactive'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.approved_by_profile_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = NEW.approved_by_profile_id
        AND p.is_active = true
        AND p.is_suspended = false
    )
  THEN
    RAISE EXCEPTION 'community_entity_link_approver_profile_inactive'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.community_id IS DISTINCT FROM OLD.community_id
      OR NEW.entity_type IS DISTINCT FROM OLD.entity_type
      OR NEW.entity_id IS DISTINCT FROM OLD.entity_id
      OR NEW.created_by_profile_id IS DISTINCT FROM OLD.created_by_profile_id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'community_entity_link_identity_fields_are_immutable'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.status = 'active' AND NEW.approved_at IS NULL THEN
    NEW.approved_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_community_entity_link_contract
  ON public.community_entity_links;
CREATE TRIGGER enforce_community_entity_link_contract
  BEFORE INSERT OR UPDATE ON public.community_entity_links
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_community_entity_link_contract();

DROP TRIGGER IF EXISTS update_community_entity_links_updated_at
  ON public.community_entity_links;
CREATE TRIGGER update_community_entity_links_updated_at
  BEFORE UPDATE ON public.community_entity_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.community_entity_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_entity_links FROM PUBLIC;
REVOKE ALL ON TABLE public.community_entity_links FROM anon;
REVOKE ALL ON TABLE public.community_entity_links FROM authenticated;

GRANT SELECT ON TABLE public.community_entity_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_entity_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_entity_links TO service_role;

REVOKE ALL ON FUNCTION private.can_manage_community_entity_link(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.community_entity_link_target_is_visible(TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_community_entity_link_contract() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.can_manage_community_entity_link(UUID, UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.community_entity_link_target_is_visible(TEXT, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.enforce_community_entity_link_contract()
  TO service_role;

DROP POLICY IF EXISTS community_entity_links_public_active_select
  ON public.community_entity_links;
CREATE POLICY community_entity_links_public_active_select
  ON public.community_entity_links FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS community_entity_links_select_own_or_manager
  ON public.community_entity_links;
CREATE POLICY community_entity_links_select_own_or_manager
  ON public.community_entity_links FOR SELECT
  TO authenticated
  USING (
    created_by_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.is_active = true
        AND p.is_suspended = false
    )
    OR private.can_manage_community_entity_link(community_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS community_entity_links_insert_member_pending
  ON public.community_entity_links;
CREATE POLICY community_entity_links_insert_member_pending
  ON public.community_entity_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND status = 'pending'
    AND link_type = 'member_submitted'
    AND priority = 0
    AND approved_by_profile_id IS NULL
    AND approved_at IS NULL
    AND created_by_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.is_active = true
        AND p.is_suspended = false
    )
    AND EXISTS (
      SELECT 1
      FROM public.community_memberships cm
      WHERE cm.community_id = community_entity_links.community_id
        AND cm.user_id = (SELECT auth.uid())
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS community_entity_links_update_by_manager
  ON public.community_entity_links;
CREATE POLICY community_entity_links_update_by_manager
  ON public.community_entity_links FOR UPDATE
  TO authenticated
  USING (
    private.can_manage_community_entity_link(community_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    private.can_manage_community_entity_link(community_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS community_entity_links_delete_by_manager
  ON public.community_entity_links;
CREATE POLICY community_entity_links_delete_by_manager
  ON public.community_entity_links FOR DELETE
  TO authenticated
  USING (
    private.can_manage_community_entity_link(community_id, (SELECT auth.uid()))
  );

COMMENT ON TABLE public.community_entity_links IS
  'SSOT for Community First local placement. Links canonical entities to Local Communities without duplicating entity ownership or master data.';

COMMENT ON COLUMN public.community_entity_links.community_id IS
  'Canonical Local Community reference: territory_communities.id.';

COMMENT ON COLUMN public.community_entity_links.entity_type IS
  'Canonical domain of entity_id: business, event, classified, professional, post, or tourist_point.';

COMMENT ON COLUMN public.community_entity_links.entity_id IS
  'Polymorphic canonical entity id. Existence and public visibility are enforced by private trigger.';

COMMENT ON COLUMN public.community_entity_links.link_type IS
  'Local placement reason: primary_territory, serves_area, featured, sponsored, member_submitted, or official.';

COMMENT ON COLUMN public.community_entity_links.status IS
  'Local placement lifecycle: pending, active, rejected, hidden, or expired.';

COMMENT ON COLUMN public.community_entity_links.priority IS
  'Local ranking weight inside the community. Public consumers must still apply product-specific ordering.';

COMMENT ON FUNCTION private.can_manage_community_entity_link(UUID, UUID) IS
  'Private RLS helper for community entity link moderation. Not exposed as public RPC.';

COMMENT ON FUNCTION private.community_entity_link_target_is_visible(TEXT, UUID) IS
  'Private trigger helper validating that a linked entity exists and is currently eligible for public discovery.';

COMMENT ON FUNCTION private.enforce_community_entity_link_contract() IS
  'Private trigger enforcing immutable link identity, active community, visible target, and active creator/approver profiles.';
