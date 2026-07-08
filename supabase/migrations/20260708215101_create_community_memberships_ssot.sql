-- Community memberships SSOT.
--
-- This table is the durable participation contract for Community First.
-- It separates territorial residence, profile ownership, social groups, and
-- community participation. It is intentionally not public-readable.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.community_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.territory_communities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  join_method TEXT NOT NULL DEFAULT 'open',
  verified_by_residence BOOLEAN NOT NULL DEFAULT false,
  invited_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_memberships_role_check
    CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  CONSTRAINT community_memberships_status_check
    CHECK (status IN ('pending', 'active', 'rejected', 'blocked')),
  CONSTRAINT community_memberships_join_method_check
    CHECK (join_method IN ('open', 'approval', 'invite', 'residence_verified', 'admin_created')),
  CONSTRAINT community_memberships_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT community_memberships_approval_consistency_check
    CHECK (
      (status = 'active' AND joined_at IS NOT NULL)
      OR status <> 'active'
    )
);

CREATE INDEX IF NOT EXISTS idx_community_memberships_community_status
  ON public.community_memberships(community_id, status, role);

CREATE INDEX IF NOT EXISTS idx_community_memberships_profile
  ON public.community_memberships(profile_id);

CREATE INDEX IF NOT EXISTS idx_community_memberships_user_status
  ON public.community_memberships(user_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_memberships_active_profile_unique
  ON public.community_memberships(community_id, profile_id)
  WHERE status IN ('pending', 'active', 'blocked');

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_memberships_active_user_unique
  ON public.community_memberships(community_id, user_id)
  WHERE status IN ('pending', 'active', 'blocked');

CREATE OR REPLACE FUNCTION private.can_manage_community_membership(
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
          AND cm.role IN ('owner', 'admin')
      )
    );
$$;

CREATE OR REPLACE FUNCTION private.enforce_community_membership_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.profile_id
      AND p.user_id = NEW.user_id
      AND p.is_active = true
      AND p.is_suspended = false
  ) THEN
    RAISE EXCEPTION 'community_membership_profile_user_mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.community_id IS DISTINCT FROM OLD.community_id
      OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.requested_at IS DISTINCT FROM OLD.requested_at
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'community_membership_identity_fields_are_immutable'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.status = 'active' AND NEW.joined_at IS NULL THEN
    NEW.joined_at := now();
  END IF;

  IF NEW.status = 'active' AND NEW.approved_at IS NULL THEN
    NEW.approved_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_community_membership_contract
  ON public.community_memberships;
CREATE TRIGGER enforce_community_membership_contract
  BEFORE INSERT OR UPDATE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_community_membership_contract();

DROP TRIGGER IF EXISTS update_community_memberships_updated_at
  ON public.community_memberships;
CREATE TRIGGER update_community_memberships_updated_at
  BEFORE UPDATE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_memberships FROM PUBLIC;
REVOKE ALL ON TABLE public.community_memberships FROM anon;
REVOKE ALL ON TABLE public.community_memberships FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_memberships TO service_role;

REVOKE ALL ON FUNCTION private.can_manage_community_membership(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_community_membership_contract() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.can_manage_community_membership(UUID, UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.enforce_community_membership_contract()
  TO service_role;

DROP POLICY IF EXISTS community_memberships_select_own_or_manager
  ON public.community_memberships;
CREATE POLICY community_memberships_select_own_or_manager
  ON public.community_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.can_manage_community_membership(community_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS community_memberships_insert_self_pending
  ON public.community_memberships;
CREATE POLICY community_memberships_insert_self_pending
  ON public.community_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
    AND role = 'member'
    AND status = 'pending'
    AND join_method IN ('open', 'approval')
    AND verified_by_residence = false
    AND invited_by_profile_id IS NULL
    AND approved_by_profile_id IS NULL
    AND approved_at IS NULL
    AND joined_at IS NULL
    AND profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.is_active = true
        AND p.is_suspended = false
    )
    AND community_id IN (
      SELECT tc.id
      FROM public.territory_communities tc
      WHERE tc.status <> 'inactive'
    )
  );

DROP POLICY IF EXISTS community_memberships_update_by_manager
  ON public.community_memberships;
CREATE POLICY community_memberships_update_by_manager
  ON public.community_memberships FOR UPDATE
  TO authenticated
  USING (
    private.can_manage_community_membership(community_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    private.can_manage_community_membership(community_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS community_memberships_delete_self_or_manager
  ON public.community_memberships;
CREATE POLICY community_memberships_delete_self_or_manager
  ON public.community_memberships FOR DELETE
  TO authenticated
  USING (
    (
      user_id = (SELECT auth.uid())
      AND role = 'member'
      AND status IN ('pending', 'active', 'rejected')
    )
    OR private.can_manage_community_membership(community_id, (SELECT auth.uid()))
  );

COMMENT ON TABLE public.community_memberships IS
  'SSOT for Community First participation. Separates community membership from residence, social groups, and profile ownership.';

COMMENT ON COLUMN public.community_memberships.community_id IS
  'Canonical Local Community reference: territory_communities.id.';

COMMENT ON COLUMN public.community_memberships.profile_id IS
  'Profile identity used for community participation. Must belong to user_id.';

COMMENT ON COLUMN public.community_memberships.user_id IS
  'Auth user owner of the participating profile. Used only for auth/RLS checks.';

COMMENT ON COLUMN public.community_memberships.role IS
  'Community role: owner, admin, moderator, or member.';

COMMENT ON COLUMN public.community_memberships.status IS
  'Membership lifecycle: pending, active, rejected, or blocked.';

COMMENT ON COLUMN public.community_memberships.join_method IS
  'How this membership was requested or created: open, approval, invite, residence_verified, or admin_created.';

COMMENT ON FUNCTION private.can_manage_community_membership(UUID, UUID) IS
  'Private RLS helper for community membership management. Not exposed as public RPC.';

COMMENT ON FUNCTION private.enforce_community_membership_contract() IS
  'Private trigger enforcing profile/user consistency and immutable membership identity fields.';
