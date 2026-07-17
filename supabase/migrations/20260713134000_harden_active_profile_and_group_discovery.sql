-- Align every community mutation with the persisted active-profile SSOT and
-- make group discovery globally ordered without client-side page sorting.

-- security-authority: internal-function private.current_active_profile_id
CREATE OR REPLACE FUNCTION private.current_active_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT profile.id
  FROM public.profiles profile
  LEFT JOIN public.user_active_profiles selection
    ON selection.user_id = auth.uid()
   AND selection.profile_id = profile.id
  WHERE auth.uid() IS NOT NULL
    AND profile.is_active = TRUE
    AND NOT (
      (profile.is_suspended = TRUE OR profile.suspended = TRUE)
      AND (profile.suspended_until IS NULL OR profile.suspended_until > now())
    )
    AND (
      profile.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = profile.id
          AND member.user_id = auth.uid()
          AND member.is_active = TRUE
      )
    )
  ORDER BY
    CASE
      WHEN selection.profile_id IS NOT NULL THEN 0
      WHEN profile.profile_type::TEXT = 'personal' THEN 1
      ELSE 2
    END,
    profile.created_at ASC,
    profile.id ASC
  LIMIT 1;
$$;

-- security-authority: internal-function private.auth_owns_active_profile
CREATE OR REPLACE FUNCTION private.auth_owns_active_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, pg_temp
AS $$
  SELECT p_profile_id IS NOT NULL
    AND p_profile_id = private.current_active_profile_id();
$$;

-- security-authority: internal-function private.auth_has_verified_residence
CREATE OR REPLACE FUNCTION private.auth_has_verified_residence(
  p_profile_id UUID,
  p_location_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.auth_owns_active_profile(p_profile_id)
    AND p_location_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_residences residence
      JOIN public.locations location ON location.id = residence.location_id
      WHERE residence.user_id = auth.uid()
        AND residence.location_id = p_location_id
        AND residence.is_verified = TRUE
        AND location.status::TEXT = 'active'
    );
$$;

-- security-authority: internal-function private.auth_is_group_member
CREATE OR REPLACE FUNCTION private.auth_is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members_new member
    WHERE member.group_id = p_group_id
      AND private.auth_owns_active_profile(member.member_profile_id)
  );
$$;

-- security-authority: internal-function private.auth_is_group_admin
CREATE OR REPLACE FUNCTION private.auth_is_group_admin(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT COALESCE(private.is_admin_user(auth.uid()), FALSE)
    OR EXISTS (
      SELECT 1
      FROM public.group_members_new member
      JOIN public.groups community_group ON community_group.id = member.group_id
      WHERE member.group_id = p_group_id
        AND member.role::TEXT = 'admin'
        AND private.auth_owns_active_profile(member.member_profile_id)
        AND private.auth_has_verified_residence(
          member.member_profile_id,
          community_group.location_id
        )
    );
$$;

-- security-authority: internal-function private.auth_can_moderate_group
CREATE OR REPLACE FUNCTION private.auth_can_moderate_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT COALESCE(private.is_admin_user(auth.uid()), FALSE)
    OR EXISTS (
      SELECT 1
      FROM public.group_members_new member
      JOIN public.groups community_group ON community_group.id = member.group_id
      WHERE member.group_id = p_group_id
        AND member.role::TEXT IN ('admin', 'moderator')
        AND private.auth_owns_active_profile(member.member_profile_id)
        AND private.auth_has_verified_residence(
          member.member_profile_id,
          community_group.location_id
        )
    );
$$;

-- security-authority: internal-function private.auth_can_view_group
CREATE OR REPLACE FUNCTION private.auth_can_view_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups community_group
    WHERE community_group.id = p_group_id
      AND community_group.status::TEXT = 'active'
      AND (
        community_group.visibility = 'public'
        OR community_group.created_by = private.current_active_profile_id()
        OR private.auth_is_group_member(community_group.id)
        OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
      )
  );
$$;

REVOKE ALL ON FUNCTION private.current_active_profile_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_owns_active_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_has_verified_residence(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_group_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_group_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_can_moderate_group(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_can_view_group(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.current_active_profile_id()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_owns_active_profile(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_has_verified_residence(UUID, UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_is_group_member(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_is_group_admin(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_can_moderate_group(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_can_view_group(UUID)
  TO anon, authenticated, service_role;

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS members_count INTEGER;

DO $$
DECLARE
  v_previous_setting TEXT := COALESCE(
    current_setting('acheguese.internal_social_write', TRUE),
    ''
  );
BEGIN
  PERFORM set_config('acheguese.internal_social_write', 'on', TRUE);

  UPDATE public.groups community_group
  SET members_count = (
    SELECT count(*)::INTEGER
    FROM public.group_members_new member
    WHERE member.group_id = community_group.id
  );

  PERFORM set_config(
    'acheguese.internal_social_write',
    v_previous_setting,
    TRUE
  );
END $$;

ALTER TABLE public.groups
  ALTER COLUMN members_count SET DEFAULT 0,
  ALTER COLUMN members_count SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'groups_members_count_nonnegative'
      AND conrelid = 'public.groups'::regclass
  ) THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_members_count_nonnegative
      CHECK (members_count >= 0);
  END IF;
END $$;

-- security-authority: internal-function private.sync_group_members_count
CREATE OR REPLACE FUNCTION private.sync_group_members_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_group_id UUID := COALESCE(NEW.group_id, OLD.group_id);
  v_previous_setting TEXT := COALESCE(
    current_setting('acheguese.internal_social_write', TRUE),
    ''
  );
BEGIN
  PERFORM set_config('acheguese.internal_social_write', 'on', TRUE);

  UPDATE public.groups community_group
  SET members_count = (
        SELECT count(*)::INTEGER
        FROM public.group_members_new member
        WHERE member.group_id = v_group_id
      ),
      updated_at = community_group.updated_at
  WHERE community_group.id = v_group_id;

  PERFORM set_config(
    'acheguese.internal_social_write',
    v_previous_setting,
    TRUE
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config(
    'acheguese.internal_social_write',
    v_previous_setting,
    TRUE
  );
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_group_members_count() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_sync_group_members_count
  ON public.group_members_new;
CREATE TRIGGER trg_sync_group_members_count
  AFTER INSERT OR DELETE OR UPDATE OF group_id
  ON public.group_members_new
  FOR EACH ROW EXECUTE FUNCTION private.sync_group_members_count();

CREATE INDEX IF NOT EXISTS idx_groups_popular
  ON public.groups (members_count DESC, created_at DESC, id DESC)
  WHERE status::TEXT = 'active';
CREATE INDEX IF NOT EXISTS idx_groups_location_popular
  ON public.groups (location_id, members_count DESC, created_at DESC, id DESC)
  WHERE status::TEXT = 'active';

-- security-authority: public-rpc public.list_community_groups_page
CREATE OR REPLACE FUNCTION public.list_community_groups_page(
  p_search TEXT DEFAULT NULL,
  p_location_ids UUID[] DEFAULT NULL,
  p_only_member_groups BOOLEAN DEFAULT FALSE,
  p_group_ids UUID[] DEFAULT NULL,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 20,
  p_sort TEXT DEFAULT 'recentes'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_search TEXT := NULLIF(left(btrim(COALESCE(p_search, '')), 100), '');
  v_offset INTEGER := LEAST(GREATEST(COALESCE(p_offset, 0), 0), 10000);
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_sort TEXT := CASE
    WHEN p_sort IN ('recentes', 'populares', 'relevancia') THEN p_sort
    ELSE 'recentes'
  END;
  v_items JSONB;
  v_total BIGINT;
BEGIN
  IF cardinality(p_location_ids) > 100
     OR cardinality(p_group_ids) > 500 THEN
    RAISE EXCEPTION 'community_group_filter_too_large'
      USING ERRCODE = '22023';
  END IF;

  WITH filtered AS MATERIALIZED (
    SELECT
      community_group.*,
      creator.name AS profile_name,
      creator.avatar_url AS profile_avatar_url,
      CASE
        WHEN v_search IS NULL THEN 0
        WHEN lower(community_group.name) = lower(v_search) THEN 3
        WHEN lower(community_group.name) LIKE lower(v_search) || '%' THEN 2
        ELSE 1
      END AS relevance_rank
    FROM public.groups community_group
    LEFT JOIN public.profiles creator ON creator.id = community_group.created_by
    WHERE community_group.status::TEXT = 'active'
      AND (
        v_search IS NULL
        OR community_group.name ILIKE '%' || v_search || '%'
      )
      AND (
        p_location_ids IS NULL
        OR community_group.location_id = ANY(p_location_ids)
      )
      AND (
        p_group_ids IS NULL
        OR community_group.id = ANY(p_group_ids)
      )
      AND (
        NOT COALESCE(p_only_member_groups, FALSE)
        OR EXISTS (
          SELECT 1
          FROM public.group_members_new membership
          WHERE membership.group_id = community_group.id
            AND membership.member_profile_id = private.current_active_profile_id()
        )
      )
  ),
  page AS (
    SELECT
      filtered.*,
      row_number() OVER (
        ORDER BY
          CASE WHEN v_sort = 'relevancia' THEN filtered.relevance_rank END DESC,
          CASE WHEN v_sort IN ('populares', 'relevancia') THEN filtered.members_count END DESC,
          filtered.created_at DESC,
          filtered.id DESC
      ) AS ordinal
    FROM filtered
    ORDER BY
      CASE WHEN v_sort = 'relevancia' THEN filtered.relevance_rank END DESC,
      CASE WHEN v_sort IN ('populares', 'relevancia') THEN filtered.members_count END DESC,
      filtered.created_at DESC,
      filtered.id DESC
    OFFSET v_offset
    LIMIT v_limit
  )
  SELECT
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', page.id,
            'name', page.name,
            'description', page.description,
            'category', page.category,
            'members_count', page.members_count,
            'created_at', page.created_at,
            'created_by', page.created_by,
            'avatar_url', page.avatar_url,
            'is_private', page.is_private,
            'location_id', page.location_id,
            'visibility', page.visibility,
            'join_policy', page.join_policy,
            'posting_policy', page.posting_policy,
            'member_visibility', page.member_visibility,
            'media_policy', page.media_policy,
            'rules', page.rules,
            'capabilities', page.capabilities,
            'type', page.type,
            'status', page.status,
            'tags', page.tags,
            'slug', page.slug,
            'updated_at', page.updated_at,
            'profile', CASE
              WHEN page.profile_name IS NULL THEN NULL
              ELSE jsonb_build_object(
                'name', page.profile_name,
                'avatar_url', page.profile_avatar_url
              )
            END
          )
          ORDER BY page.ordinal
        )
        FROM page
      ),
      '[]'::JSONB
    ),
    (SELECT count(*)::BIGINT FROM filtered)
  INTO v_items, v_total;

  RETURN jsonb_build_object(
    'items', v_items,
    'total_count', COALESCE(v_total, 0),
    'has_more', v_offset + jsonb_array_length(v_items) < COALESCE(v_total, 0),
    'next_offset', CASE
      WHEN v_offset + jsonb_array_length(v_items) < COALESCE(v_total, 0)
        THEN v_offset + jsonb_array_length(v_items)
      ELSE NULL
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_community_groups_page(
  TEXT, UUID[], BOOLEAN, UUID[], INTEGER, INTEGER, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_community_groups_page(
  TEXT, UUID[], BOOLEAN, UUID[], INTEGER, INTEGER, TEXT
) TO anon, authenticated;

COMMENT ON FUNCTION private.current_active_profile_id() IS
  'Returns the persisted active profile accessible to auth.uid(), with the same fallback ordering as the session SSOT.';
COMMENT ON FUNCTION private.auth_owns_active_profile(UUID) IS
  'Checks that a profile is the current persisted active profile, including accessible shared profiles.';
COMMENT ON FUNCTION public.list_community_groups_page(
  TEXT, UUID[], BOOLEAN, UUID[], INTEGER, INTEGER, TEXT
) IS 'Bounded RLS-aware community group discovery with global recent, popular and relevance ordering.';
